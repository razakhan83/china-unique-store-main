import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import OrderLog from '@/models/OrderLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    
    const { status, courierName, trackingNumber, weight, manualCodAmount } = body;

    await mongooseConnect();
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const hasStatusChanged = status !== undefined && status !== order.status;
    const oldStatus = order.status;

    if (status) order.status = status;
    if (courierName !== undefined) order.courierName = courierName;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (weight !== undefined) order.weight = weight;
    if (manualCodAmount !== undefined) {
      if (manualCodAmount === '' || manualCodAmount === null) {
        order.manualCodAmount = undefined;
      } else {
        order.manualCodAmount = Number(manualCodAmount);
      }
    }

    await order.save();

    // Log the change
    try {
      const session = await getServerSession(authOptions);
      let details = 'Order updated';
      let action = 'UPDATE';

      if (hasStatusChanged) {
        action = 'STATUS_CHANGE';
        details = `Status changed from ${oldStatus} to ${order.status}`;
      } else if (trackingNumber !== undefined) {
        action = 'TRACKING_UPDATE';
        details = `Tracking Number updated to ${trackingNumber}`;
      }

      await OrderLog.create({
        orderId: order._id,
        action,
        details,
        previousStatus: hasStatusChanged ? oldStatus : undefined,
        newStatus: hasStatusChanged ? order.status : undefined,
        adminName: session?.user?.name,
        adminEmail: session?.user?.email,
      });
    } catch (logError) {
      console.error('Failed to create API order log:', logError);
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
