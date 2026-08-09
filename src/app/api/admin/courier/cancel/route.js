import { NextResponse } from 'next/server';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { cancelNocParcel } from '@/lib/nocCourier';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, trackingNumber, portalKey } = body;

    await mongooseConnect();

    let order = null;
    if (orderId) {
      order = await Order.findOne({
        $or: [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }],
        isDeleted: { $ne: true },
      });
    } else if (trackingNumber) {
      order = await Order.findOne({ trackingNumber, isDeleted: { $ne: true } });
    }

    const targetParcelNo = trackingNumber || order?.trackingNumber;
    const targetPortalKey = portalKey || order?.nocAccountId || 'portal_1';

    if (!targetParcelNo) {
      return NextResponse.json(
        { success: false, error: 'Tracking number is required to cancel courier booking.' },
        { status: 400 }
      );
    }

    const apiResult = await cancelNocParcel([targetParcelNo], targetPortalKey);

    if (order) {
      order.courierBookingStatus = 'cancelled';
      if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
      order.statusHistory.push({
        status: 'Courier Booking Cancelled',
        timestamp: new Date(),
      });
      await order.save();
    }

    return NextResponse.json({
      success: true,
      message: `Cancellation request submitted to NOC Express for parcel #${targetParcelNo}.`,
      rawResponse: apiResult,
    });
  } catch (error) {
    console.error('Error cancelling NOC parcel:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error cancelling NOC parcel' },
      { status: 500 }
    );
  }
}
