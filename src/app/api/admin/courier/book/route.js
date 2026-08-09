import { NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { bookNocParcels } from '@/lib/nocCourier';

export async function POST(request) {
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

    // Fetch target orders
    const orders = await Order.find({
      $or: [{ _id: { $in: orderIds } }, { orderId: { $in: orderIds } }],
      isDeleted: { $ne: true },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching orders found.' },
        { status: 404 }
      );
    }

    // Build NOC API Parcels payload
    const parcelsPayload = orders.map((order) => {
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

    // Call NOC BookParcel API
    const apiResult = await bookNocParcels(parcelsPayload, portalKey);

    if (apiResult.Response !== 'success') {
      return NextResponse.json(
        {
          success: false,
          error: apiResult.ErrorDescription || 'NOC Courier booking failed. Please verify credentials and order details.',
          rawResponse: apiResult,
        },
        { status: 400 }
      );
    }

    // Parse returned Parcel Numbers from ErrorDescription
    // Example string: "Parcel Booked Successfully :00000001, 00000002"
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

    const labelUrl = apiResult.LabelURL || '';
    const now = new Date();
    const updatedOrders = [];

    // Update orders in DB
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
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
        status: 'Shipped',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully booked ${orders.length} parcel(s) with NOC Express (${portalKey === 'portal_2' ? 'Secondary Account' : 'Main Account'}).`,
      labelUrl,
      parcelNumbers,
      portalKey,
      updatedOrders,
    });
  } catch (error) {
    console.error('Error booking NOC parcel:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error while booking NOC parcel' },
      { status: 500 }
    );
  }
}
