import { requireAdmin } from '@/lib/requireAdmin';
import { getStoreSettings } from '@/lib/data';
import AdminNavigationClient from './AdminNavigationClient';

export const metadata = {
  title: 'Navigation & URL Redirects | Admin',
};

export default async function NavigationPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return <AdminNavigationClient initialSettings={settings} />;
}
