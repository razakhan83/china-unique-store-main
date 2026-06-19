import { Suspense } from 'react';
import { AdminShellSkeleton } from '@/components/AdminDashboardSkeleton';
import AdminLayoutShell from './AdminLayoutShell';
import { getAdminSession } from '@/lib/requireAdmin';

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
    <AdminLayoutShell sessionUser={sessionUser}>{children}</AdminLayoutShell>
  );
}
