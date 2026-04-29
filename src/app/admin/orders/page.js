import { getAdminOrdersPage, getAdminProducts } from '@/lib/data';
import { DEFAULT_ORDER_STATUS } from '@/lib/order-status';
import { requireAdmin } from '@/lib/requireAdmin';
import AdminOrdersClient from './AdminOrdersClient';

export default async function AdminOrdersPage({ searchParams }) {
  await requireAdmin();

  const params = await searchParams;
  const search = String(params?.search || '').trim();
  const status = String(params?.status || DEFAULT_ORDER_STATUS).trim() || DEFAULT_ORDER_STATUS;
  const startDate = String(params?.startDate || '').trim();
  const endDate = String(params?.endDate || '').trim();
  const page = Math.max(1, Number(params?.page) || 1);
  
  // Disable pagination fully if searching via specific date boundaries
  const limit = (startDate || endDate) ? 999999 : 12;
  
  const [orders, products] = await Promise.all([
    getAdminOrdersPage({ search, status, startDate, endDate, page, limit }),
    getAdminProducts(),
  ]);

  return (
    <AdminOrdersClient
      initialOrders={orders.items}
      productCatalog={products}
      total={orders.total}
      totalPages={orders.totalPages}
      currentPage={orders.page}
      pageSize={orders.limit}
      initialSearchQuery={orders.searchTerm}
      initialStatusFilter={orders.status}
      initialStartDate={orders.startDate}
      initialEndDate={orders.endDate}
      summary={orders.summary}
    />
  );
}
