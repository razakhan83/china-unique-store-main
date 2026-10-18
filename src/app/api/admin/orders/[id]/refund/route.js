import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import OrderLog from '@/models/OrderLog';
import { revalidateTag } from 'next/cache';

export async function POST(req, { params }) {
  try {
    const { session, error: authError } = await requireApiAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    const amount = Number(body?.amount);
    const reason = String(body?.reason || 'Customer Refund').trim();
    const method = String(body?.method || 'COD Adjustment').trim();
    const notes = String(body?.notes || '').trim();

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'A valid refund amount greater than 0 is required.' }, { status: 400 });
    }

    await mongooseConnect();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const currentRefunded = Number(order.refundedAmount || 0);
    const maxRefundable = Math.max(0, Number(order.totalAmount || 0) - currentRefunded);

    if (amount > maxRefundable) {
      return NextResponse.json({
        success: false,
        error: `Refund amount (Rs. ${amount.toLocaleString('en-PK')}) exceeds maximum refundable balance (Rs. ${maxRefundable.toLocaleString('en-PK')}).`,
      }, { status: 400 });
    }

    const newRefundedTotal = currentRefunded + amount;
    order.refundedAmount = newRefundedTotal;

    const refundEntry = {
      amount,
      reason,
      method,
      notes,
      processedBy: session?.user?.name || session?.user?.email || 'Staff',
      createdAt: new Date(),
    };

    if (!Array.isArray(order.refunds)) {
      order.refunds = [];
    }
    order.refunds.push(refundEntry);

    const isFullyRefunded = newRefundedTotal >= Number(order.totalAmount || 0);

    await order.save();

    // Log in order timeline
    const logDetails = `Processed ${isFullyRefunded ? 'Full' : 'Partial'} Refund of Rs. ${amount.toLocaleString('en-PK')} via ${method}. Reason: ${reason}.${notes ? ` Notes: ${notes}` : ''}`;
    const logEntry = await OrderLog.create({
      orderId: order._id,
      action: 'REFUND',
      details: logDetails,
      adminName: session?.user?.name || 'Staff Member',
      adminEmail: session?.user?.email || '',
    });

    revalidateTag('orders');
    revalidateTag('admin-dashboard');

    return NextResponse.json({
      success: true,
      message: `Refund of Rs. ${amount.toLocaleString('en-PK')} recorded successfully.`,
      refund: refundEntry,
      refundedAmount: newRefundedTotal,
      isFullyRefunded,
      log: {
        ...logEntry.toObject(),
        _id: logEntry._id.toString(),
        orderId: logEntry.orderId.toString(),
        createdAt: logEntry.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[API] Process Refund Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
