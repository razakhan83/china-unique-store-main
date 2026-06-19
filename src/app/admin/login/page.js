import { connection } from 'next/server';
import { getStoreSettings } from '@/lib/data';

import AdminLoginClient from './AdminLoginClient';

export default async function AdminLoginPage() {
  await connection();
  const settings = await getStoreSettings();
  const guestModeEnabled = settings?.guestModeEnabled !== false;
  return <AdminLoginClient guestModeEnabled={guestModeEnabled} />;
}
