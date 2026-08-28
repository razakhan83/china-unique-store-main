import { Suspense } from 'react';
import { getAdminOrdersPage, getAdminTrashOrders } from '@/lib/data';
import { DEFAULT_ORDER_STATUS } from '@/lib/order-status';
import { requireAdmin } from '@/lib/requireAdmin';
import AdminOrdersClient from './AdminOrdersClient';
import AdminOrdersSkeleton from './AdminOrdersSkeleton';

export default async function AdminOrdersPage({ searchParams }) {
  await requireAdmin();

  const params = await searchParams;
  const search = String(params?.search || '').trim();
  const status = String(params?.status || DEFAULT_ORDER_STATUS).trim() || DEFAULT_ORDER_STATUS;
  const startDate = String(params?.startDate || '').trim();
  const endDate = String(params?.endDate || '').trim();
  const page = Math.max(1, Number(params?.page) || 1);
  const initialCreateOrder = params?.createOrder === '1';
  const dateFiltered = Boolean(startDate || endDate);
  // Date filters stay paginated; cap keeps RSC payload bounded for exports/filters.
  const limit = dateFiltered ? 200 : 15;

  const [orders, trashOrders] = await Promise.all([
    getAdminOrdersPage({ search, status, startDate, endDate, page, limit }),
    getAdminTrashOrders(),
  ]);

  return (
    <Suspense fallback={<AdminOrdersSkeleton />}>
      <AdminOrdersClient
        initialOrders={orders.items}
        total={orders.total}
        totalPages={orders.totalPages}
        currentPage={orders.page}
        pageSize={orders.limit}
        initialSearchQuery={orders.searchTerm}
        initialStatusFilter={orders.status}
        initialStartDate={orders.startDate}
        initialEndDate={orders.endDate}
        summary={orders.summary}
        initialCreateOrder={initialCreateOrder}
        initialTrashOrders={trashOrders}
      />
    </Suspense>
  );
}
