import { requireAdmin } from '@/lib/requireAdmin';
import { getStoreSettings } from '@/lib/data';
import AdminWhatsAppSettingsClient from './AdminWhatsAppSettingsClient';

export const metadata = {
  title: 'WhatsApp Settings | Admin',
};

export default async function WhatsAppSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return <AdminWhatsAppSettingsClient initialSettings={settings} />;
}
