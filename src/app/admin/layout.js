import { connection } from 'next/server';
import { Geist_Mono } from 'next/font/google';
import './admin.css';
import AdminLayoutShell from './AdminLayoutShell';
import { getAdminSession } from '@/lib/requireAdmin';
import { getStoreSettings } from '@/lib/data';

// Geist Mono: admin-only font for code, tables, JSON display
// Excluded from root layout to avoid loading on store pages
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Only load when admin pages are visited
});

export const instant = false;

export default async function AdminLayout({ children }) {
  await connection();
  const [session, settings] = await Promise.all([
    getAdminSession(),
    getStoreSettings().catch(() => ({})),
  ]);
  const sessionUser = session?.user?.isAdmin ? session.user : null;

  return (
    <div className={geistMono.variable} suppressHydrationWarning>
      <AdminLayoutShell sessionUser={sessionUser} settings={settings}>{children}</AdminLayoutShell>
    </div>
  );
}
