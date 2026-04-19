import { getAdminOrdersPage } from '@/lib/data';
import { requireAdmin } from '@/lib/requireAdmin';
import AdminOrdersClient from './AdminOrdersClient';

export default async function AdminOrdersPage({ searchParams }) {
  await requireAdmin();

  const params = await searchParams;
  const search = String(params?.search || '').trim();
  const status = String(params?.status || 'Confirmed').trim() || 'Confirmed';
  const startDate = String(params?.startDate || '').trim();
  const endDate = String(params?.endDate || '').trim();
  const page = Math.max(1, Number(params?.page) || 1);
  
  // Disable pagination fully if searching via specific date boundaries
  const limit = (startDate || endDate) ? 999999 : 12;
  
  const orders = await getAdminOrdersPage({ search, status, startDate, endDate, page, limit });

  return (
    <AdminOrdersClient
      initialOrders={orders.items}
      total={orders.total}
      totalPages={orders.totalPages}
      currentPage={orders.page}
      initialSearchQuery={orders.searchTerm}
      initialStatusFilter={orders.status}
      initialStartDate={orders.startDate}
      initialEndDate={orders.endDate}
      summary={orders.summary}
    />
  );
}
