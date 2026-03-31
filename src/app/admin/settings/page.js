// @ts-nocheck
import { getAdminSettings } from '@/lib/data';
import { requireAdmin } from '@/lib/requireAdmin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

import AdminSettingsClient from './AdminSettingsClient';

export default async function AdminSettingsPage() {
  await requireAdmin();

  const session = await getServerSession(authOptions);
  let isConfiguredAdmin = false;
  if (session?.user?.email) {
    isConfiguredAdmin = isAdminEmail(session.user.email);
  }

  return <SettingsContent isConfiguredAdmin={isConfiguredAdmin} />;
}

async function SettingsContent({ isConfiguredAdmin }) {
  const settings = await getAdminSettings();
  return <AdminSettingsClient initialSettings={settings} isConfiguredAdmin={isConfiguredAdmin} />;
}

