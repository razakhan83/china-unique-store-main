import { NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { trackNocParcel } from '@/lib/nocCourier';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('trackingNumber') || searchParams.get('parcelNo');
    const orderId = searchParams.get('orderId');
    const portalKeyParam = searchParams.get('portalKey');

    let order = null;

    await mongooseConnect();

    if (orderId) {
      order = await Order.findOne({
        $or: [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }],
        isDeleted: { $ne: true },
      }).lean();
    } else if (trackingNumber) {
      order = await Order.findOne({ trackingNumber, isDeleted: { $ne: true } }).lean();
    }

    const targetParcelNo = trackingNumber || order?.trackingNumber;
    const targetPortalKey = portalKeyParam || order?.nocAccountId || 'portal_1';

    if (!targetParcelNo) {
      return NextResponse.json(
        { success: false, error: 'Tracking number or order ID is required.' },
        { status: 400 }
      );
    }

    // Call NOC Express GetParcelTracking API
    let trackingResult = null;
    let events = [];
    let fetchError = null;

    try {
      trackingResult = await trackNocParcel(targetParcelNo, targetPortalKey);
      if (trackingResult?.Response === 'success' && Array.isArray(trackingResult?.detail)) {
        events = trackingResult.detail.map((item) => ({
          status: item.PacelStatus || item.ParcelStatus || 'Status Update',
          remarks: item.Remarks || '',
          dateTime: item.DateTime || '',
        }));
      } else if (trackingResult?.Response === 'failure') {
        fetchError = trackingResult.ErrorDescription || 'Unable to retrieve tracking data from NOC Courier.';
      }
    } catch (err) {
      console.error('Error contacting NOC tracking API:', err);
      fetchError = err.message || 'Courier API connection error.';
    }

    return NextResponse.json({
      success: true,
      orderId: order?.orderId || null,
      courierName: order?.courierName || 'NOC Express',
      trackingNumber: targetParcelNo,
      nocLabelUrl: order?.nocLabelUrl || '',
      orderStatus: order?.status || 'Shipped',
      customerCity: order?.customerCity || '',
      fetchError,
      events,
      rawResponse: trackingResult,
    });
  } catch (error) {
    if (error?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error in courier track API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error tracking courier parcel' },
      { status: 500 }
    );
  }
}
