import { getAdminProductsPage } from '@/lib/data';
import { requireAdmin } from '@/lib/requireAdmin';

import AdminProductsClient from './AdminProductsClient';

export default async function AdminProductsPage({ searchParams }) {
  await requireAdmin();

  const params = await searchParams;
  const search = String(params?.search || '').trim();
  const status = String(params?.status || 'all').trim() || 'all';
  const stock = String(params?.stock || 'all').trim() || 'all';
  const sort = String(params?.sort || 'newest').trim() || 'newest';
  const page = Math.max(1, Number(params?.page) || 1);
  const result = await getAdminProductsPage({ search, status, stock, sort, page, limit: 12 });

  return (
    <AdminProductsClient
      initialProducts={result.items}
      total={result.total}
      totalPages={result.totalPages}
      currentPage={result.page}
      initialSearchQuery={result.searchTerm}
      initialStatusFilter={result.status}
      initialStockFilter={result.stock}
      initialSortOption={result.sort}
      summary={result.summary}
    />
  );
}
