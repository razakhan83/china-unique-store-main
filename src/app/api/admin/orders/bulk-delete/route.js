import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';
import { bulkDeleteOrdersAction } from '@/app/actions/order.actions';

export async function POST(request) {
  try {
    const auth = await requireApiAdmin({ mutation: true, requireRealAdmin: true });
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const { orderIds } = body || {};

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderIds array is required for bulk deletion.' },
        { status: 400 }
      );
    }

    const result = await bulkDeleteOrdersAction(orderIds);
    if (!result?.success) {
      return NextResponse.json(
        { success: false, error: result?.error || 'Failed to bulk soft-delete orders.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.count || orderIds.length} order(s) moved to trash`,
      count: result.count,
      deletedIds: result.deletedIds,
    });
  } catch (error) {
    console.error('Error in /api/admin/orders/bulk-delete:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
