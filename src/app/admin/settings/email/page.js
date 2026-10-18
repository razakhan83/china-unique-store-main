import { requireAdmin } from '@/lib/requireAdmin';
import { getStoreSettings } from '@/lib/data';
import AdminNotificationTemplatesClient from './AdminNotificationTemplatesClient';

export const metadata = {
  title: 'Notification Templates | Admin',
};

export default async function EmailSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return <AdminNotificationTemplatesClient initialSettings={settings} />;
}
