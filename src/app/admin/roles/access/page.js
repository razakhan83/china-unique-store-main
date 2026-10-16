import { requireAdmin } from '@/lib/requireAdmin';
import { isAdminEmail } from '@/lib/admin';
import AdminAccessSectionClient from './AdminAccessSectionClient';

export default async function AccessSettingsPage() {
  const session = await requireAdmin();
  const isConfiguredAdmin = Boolean(session?.user?.email) && isAdminEmail(session.user.email);
  return <AdminAccessSectionClient isConfiguredAdmin={isConfiguredAdmin} />;
}
