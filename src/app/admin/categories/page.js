import { requireAdmin } from '@/lib/requireAdmin';
import { getAdminCategories } from '@/lib/data';
import AdminCategoriesClient from './AdminCategoriesClient';

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const initialCategories = await getAdminCategories();

  return <AdminCategoriesClient initialCategories={initialCategories} />;
}

