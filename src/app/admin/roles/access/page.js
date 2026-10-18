import { requireAdmin } from '@/lib/requireAdmin';
import { isAdminEmail, getConfiguredAdminEmails, normalizeEmail } from '@/lib/admin';
import mongooseConnect from '@/lib/mongooseConnect';
import Settings from '@/models/Settings';
import AdminAccessSectionClient from './AdminAccessSectionClient';

export default async function AccessSettingsPage() {
  const session = await requireAdmin();
  const isConfiguredAdmin = Boolean(session?.user?.email) && isAdminEmail(session.user.email);

  let configuredAdmins = [];
  let dynamicAdmins = [];

  if (isConfiguredAdmin) {
    try {
      await mongooseConnect();
      const settings = await Settings.findOne({ singletonKey: 'site-settings' }).sort({ updatedAt: -1 }).lean();
      configuredAdmins = getConfiguredAdminEmails();
      dynamicAdmins = (settings?.adminEmails || []).map(normalizeEmail).filter(Boolean);
    } catch (err) {
      console.error('[AccessSettingsPage] Failed to load admins on server:', err);
    }
  }

  return (
    <AdminAccessSectionClient
      isConfiguredAdmin={isConfiguredAdmin}
      initialConfiguredAdmins={configuredAdmins}
      initialDynamicAdmins={dynamicAdmins}
    />
  );
}

