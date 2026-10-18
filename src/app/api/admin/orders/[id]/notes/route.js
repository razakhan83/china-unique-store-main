import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import OrderLog from '@/models/OrderLog';

export async function POST(req, { params }) {
  try {
    const { session, error: authError } = await requireApiAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    const noteText = String(body?.note || '').trim();

    if (!noteText) {
      return NextResponse.json({ success: false, error: 'Note content cannot be empty.' }, { status: 400 });
    }

    await mongooseConnect();

    const order = await Order.findById(id).select('_id orderId').lean();
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const logEntry = await OrderLog.create({
      orderId: order._id,
      action: 'INTERNAL_NOTE',
      details: noteText,
      adminName: session?.user?.name || 'Staff Member',
      adminEmail: session?.user?.email || '',
    });

    return NextResponse.json({
      success: true,
      message: 'Internal note added to order timeline.',
      log: {
        ...logEntry.toObject(),
        _id: logEntry._id.toString(),
        orderId: logEntry.orderId.toString(),
        createdAt: logEntry.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[API] Add Order Note Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
