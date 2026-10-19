import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Order from '@/models/Order';
import { ORDER_SUMMARY_PROJECTION } from '@/lib/data';

export async function GET(request) {
  try {
    const auth = await requireApiAdmin({ requireRealAdmin: true });
    if (auth.error) return auth.error;

    await mongooseConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ isDeleted: { $ne: true } })
        .select(ORDER_SUMMARY_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
