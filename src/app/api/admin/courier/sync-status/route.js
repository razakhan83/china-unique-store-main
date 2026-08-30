import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import mongoose from 'mongoose';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { trackNocParcel, fetchNocPortalDashboard } from '@/lib/nocCourier';
import { requireApiAdmin } from '@/lib/requireAdmin';

export async function POST(request) {
  const auth = await requireApiAdmin({ mutation: true });
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least one order ID to sync.' },
        { status: 400 }
      );
    }

    await mongooseConnect();

    const validObjectIds = orderIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id) && id.length === 24)
      .map((id) => new mongoose.Types.ObjectId(id));
    const orderIdStrings = orderIds.map(String);

    const orConditions = [{ orderId: { $in: orderIdStrings } }];
    if (validObjectIds.length > 0) {
      orConditions.push({ _id: { $in: validObjectIds } });
    }

    const orders = await Order.find({
      $or: orConditions,
      isDeleted: { $ne: true },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching orders found.' },
        { status: 404 }
      );
    }

    // Fetch live portal dashboard in parallel for all relevant portal keys
    const portalKeys = [...new Set(orders.map((o) => o.nocAccountId || 'portal_1'))];
    const portalRowsMap = new Map();

    await Promise.all(
      portalKeys.map(async (pKey) => {
        try {
          const rows = await fetchNocPortalDashboard(pKey);
          for (const r of rows) {
            if (r.parcelNo) {
              portalRowsMap.set(r.parcelNo, r);
            }
          }
        } catch (err) {
          console.warn(`[Sync Status] Portal dashboard fetch failed for ${pKey}:`, err?.message);
        }
      })
    );

    const now = new Date();

    // Process all orders concurrently in parallel
    const results = await Promise.all(
      orders.map(async (order) => {
        const trackingNumber = (order.trackingNumber || '').trim();
        const portalKey = order.nocAccountId || 'portal_1';

        if (!trackingNumber) {
          return {
            orderId: order.orderId,
            _id: String(order._id),
            success: false,
            error: 'No tracking number assigned to this order.',
          };
        }

        // Auto-update from live portal dashboard if 3rd party CN or specific courier was assigned
        const portalInfo = portalRowsMap.get(trackingNumber) || portalRowsMap.get(order.nocParcelNo);
        if (portalInfo) {
          if (portalInfo.courier) order.courierName = portalInfo.courier;
          if (portalInfo.thirdPartyNo) order.nocThirdPartyNo = portalInfo.thirdPartyNo;
          if (portalInfo.parcelNo) order.nocParcelNo = portalInfo.parcelNo;
        }

        try {
          const trackingData = await trackNocParcel(trackingNumber, portalKey);

          if (trackingData?.Response === 'success' && Array.isArray(trackingData?.detail) && trackingData.detail.length > 0) {
            const latest = trackingData.detail[0];
            const rawStatus = latest.PacelStatus || latest.ParcelStatus || latest.Status || 'Booked';
            const rawTime = latest.DateTime || latest.dateTime || latest.Date_Time || latest.Date || '';
            const remarks = latest.Remarks || '';

            const rawCourierCandidate = 
              latest.CourierName || 
              latest.Courier || 
              latest.ThirdPartyCourier || 
              latest.Courier_Name || 
              latest['3rdPartyCourier'] ||
              trackingData.CourierName || 
              trackingData.Courier || 
              order.courierName || 
              'NOC';

            const rawCourier = String(rawCourierCandidate || 'NOC').trim();

            const raw3rdParty = 
              latest.ThirdPartyNo || 
              latest.ThirdPartyNumber || 
              latest.ThirdPartyCN || 
              latest.TPNo || 
              latest.ThirdPartyTracking || 
              latest['3rdPartyNo'] || 
              latest.ReferenceNo || 
              trackingData.ThirdPartyNo || 
              '';

            const rawParcelNo = latest.ParcelNo || trackingData.ParcelNo || trackingNumber;
            
            const is3rdPartyValid = 
              raw3rdParty && 
              String(raw3rdParty).trim() !== '' && 
              String(raw3rdParty).trim().toUpperCase() !== 'N/A' && 
              String(raw3rdParty).trim().toUpperCase() !== 'NA' && 
              String(raw3rdParty).trim().toLowerCase() !== 'null' && 
              String(raw3rdParty).trim().toLowerCase() !== 'undefined';

            const finalThirdPartyNo = is3rdPartyValid ? String(raw3rdParty).trim() : '';
            const finalParcelNo = String(rawParcelNo || trackingNumber).trim();
            const effectiveTrackingNumber = is3rdPartyValid ? finalThirdPartyNo : finalParcelNo;

            const lowerRawStatus = rawStatus.toLowerCase();
            const isPaymentDone =
              lowerRawStatus.includes('payment') ||
              lowerRawStatus.includes('paid') ||
              lowerRawStatus.includes('remit') ||
              lowerRawStatus.includes('cr done');

            order.nocStatus = rawStatus;
            order.nocStatusTime = rawTime;
            order.courierName = rawCourier;
            order.nocParcelNo = finalParcelNo;
            order.nocThirdPartyNo = finalThirdPartyNo;
            order.nocRemarks = remarks;
            order.nocLastTrackedAt = now;

            if (isPaymentDone) {
              order.paymentStatus = 'Paid';
              if (order.status !== 'Completed' && order.status !== 'Returned') {
                order.status = 'Delivered';
              }
            }

            await order.save();

            return {
              orderId: order.orderId,
              _id: String(order._id),
              success: true,
              nocStatus: rawStatus,
              nocStatusTime: rawTime,
              courierName: rawCourier,
              nocParcelNo: finalParcelNo,
              nocThirdPartyNo: finalThirdPartyNo,
              effectiveTrackingNumber,
              nocRemarks: remarks,
              nocLastTrackedAt: now,
            };
          }

          // Fallback if no timeline details yet
          await order.save();
          return {
            orderId: order.orderId,
            _id: String(order._id),
            success: true,
            nocStatus: order.nocStatus || 'Booked',
            courierName: order.courierName || 'NOC',
            nocParcelNo: order.nocParcelNo || trackingNumber,
            nocThirdPartyNo: order.nocThirdPartyNo || '',
            nocLastTrackedAt: now,
          };
        } catch (itemErr) {
          console.error(`[Sync Status] Tracking failed for ${order.orderId}:`, itemErr);
          return {
            orderId: order.orderId,
            _id: String(order._id),
            success: false,
            error: itemErr.message || 'Failed to track parcel',
          };
        }
      })
    );

    const successfulCount = results.filter((r) => r.success).length;

    if (successfulCount > 0) {
      try {
        revalidateTag('orders');
        revalidateTag('admin-dashboard');
        revalidatePath('/admin/orders');
      } catch (revErr) {
        console.error('Error revalidating orders cache after NOC sync:', revErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successfulCount} of ${orders.length} order(s) with NOC Courier.`,
      results,
    });
  } catch (error) {
    if (error?.digest?.startsWith('NEXT_') || error?.digest === 'HANGING_PROMISE_REJECTION') {
      throw error;
    }
    console.error('Error syncing NOC courier status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error syncing courier status' },
      { status: 500 }
    );
  }
}
