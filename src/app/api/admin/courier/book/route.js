import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { bookNocParcels } from '@/lib/nocCourier';
import { requireApiAdmin } from '@/lib/requireAdmin';

export async function POST(request) {
  const auth = await requireApiAdmin({ mutation: true });
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { orderIds, portalKey = 'portal_1' } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one order to book with NOC Courier.' },
        { status: 400 }
      );
    }

    await mongooseConnect();

    // Fetch target orders safely without throwing CastError on string orderIds
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

    // Preserve requested order sequence
    const orderMap = new Map();
    orders.forEach((o) => {
      orderMap.set(String(o._id), o);
      if (o.orderId) orderMap.set(String(o.orderId), o);
    });

    const orderedList = [];
    orderIds.forEach((id) => {
      const found = orderMap.get(String(id));
      if (found && !orderedList.some((m) => String(m._id) === String(found._id))) {
        orderedList.push(found);
      }
    });

    const targetOrders = orderedList.length > 0 ? orderedList : orders;

    // Build NOC API Parcels payload for bulk booking
    const parcelsPayload = targetOrders.map((order) => {
      const codVal =
        order.manualCodAmount != null && order.manualCodAmount !== ''
          ? Number(order.manualCodAmount)
          : Number(order.totalAmount || 0);

      const emailRaw = (order.customerEmail || '').trim();
      const emailVal = emailRaw && emailRaw.includes('@') && emailRaw.includes('.') ? emailRaw : 'customer@chinaunique.pk';

      return {
        consigneeName: order.customerName || 'Customer',
        consigneeAddress: order.customerAddress || 'Address',
        consigneeEmail: emailVal,
        consigneeCellNo: order.customerPhone || '',
        itemType: order.itemType || 'Mix',
        city: order.customerCity || 'Karachi',
        quantity: order.orderQuantity || 1,
        codAmount: codVal,
        weight: order.weight || 2,
        specialInstruction: order.landmark || order.notes || '',
      };
    });

    // Call NOC BookParcel API with all parcels so NOC returns the official combined LabelURL
    const apiResult = await bookNocParcels(parcelsPayload, portalKey);

    if (apiResult.Response !== 'success') {
      return NextResponse.json(
        {
          success: false,
          error: apiResult.ErrorDescription || 'NOC Courier booking failed. Please verify credentials and order details.',
        },
        { status: 400 }
      );
    }

    // Parse returned Parcel Numbers from ErrorDescription
    // Example string: "Parcel Booked Successfully :16216206417422, 16216206417423"
    const desc = apiResult.ErrorDescription || '';
    const colonIdx = desc.indexOf(':');
    let parcelNumbers = [];

    if (colonIdx !== -1) {
      const rawNumbers = desc.substring(colonIdx + 1);
      parcelNumbers = rawNumbers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Official NOC Express combined Label URL (contains all slips in 1 official link from NOC!)
    const labelUrl = apiResult.LabelURL || '';
    const now = new Date();
    const updatedOrders = [];

    // Update all target orders in DB
    for (let i = 0; i < targetOrders.length; i++) {
      const order = targetOrders[i];
      const trackingNo = parcelNumbers[i] || (parcelNumbers.length === 1 ? parcelNumbers[0] : '');

      order.courierName = 'NOC Express';
      if (trackingNo) order.trackingNumber = trackingNo;
      order.nocLabelUrl = labelUrl;
      order.nocAccountId = portalKey;
      order.courierBookingStatus = 'booked';
      order.courierBookingDate = now;
      order.courierResponseDetails = apiResult;

      // Update status to Shipped & convert draft if needed
      order.status = 'Shipped';
      order.isDraft = false;
      if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
      order.statusHistory.push({ status: 'Shipped', timestamp: now });

      await order.save();
      updatedOrders.push({
        orderId: order.orderId,
        trackingNumber: trackingNo,
        labelUrl: labelUrl,
        status: 'Shipped',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully booked ${targetOrders.length} parcel(s) with NOC Express (${portalKey === 'portal_2' ? 'Secondary Account' : 'Main Account'}).`,
      labelUrl,
      parcelNumbers,
      portalKey,
      updatedOrders,
    });
  } catch (error) {
    console.error('Error booking NOC parcel:', error);
    return NextResponse.json(
      { success: false, error: 'Server error while booking NOC parcel' },
      { status: 500 }
    );
  }
}
