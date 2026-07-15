import { Geist_Mono } from 'next/font/google';
import './admin.css';
import { Suspense } from 'react';
import { AdminShellSkeleton } from '@/components/AdminDashboardSkeleton';
import AdminLayoutShell from './AdminLayoutShell';
import { getAdminSession } from '@/lib/requireAdmin';

// Geist Mono: admin-only font for code, tables, JSON display
// Excluded from root layout to avoid loading on store pages
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Only load when admin pages are visited
});



export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<AdminShellSkeleton>{children}</AdminShellSkeleton>}>
      <AdminLayoutSessionWrapper>{children}</AdminLayoutSessionWrapper>
    </Suspense>
  );
}

async function AdminLayoutSessionWrapper({ children }) {
  const session = await getAdminSession();
  const sessionUser = session?.user?.isAdmin ? session.user : null;

  return (
    <div className={geistMono.variable}>
      <AdminLayoutShell sessionUser={sessionUser}>{children}</AdminLayoutShell>
    </div>
  );
}
