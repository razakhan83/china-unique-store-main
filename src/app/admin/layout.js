import { Suspense } from 'react';
import { AdminShellSkeleton } from '@/components/AdminDashboardSkeleton';
import { getAdminSession } from '@/lib/requireAdmin';
import AdminLayoutShell from './AdminLayoutShell';

function AdminLayoutFallback({ children }) {
  return <AdminShellSkeleton>{children}</AdminShellSkeleton>;
}

async function AdminSessionLayout({ children }) {
  const session = await getAdminSession();
  return (
    <Suspense fallback={<AdminLayoutFallback>{children}</AdminLayoutFallback>}>
      <AdminLayoutShell sessionUser={session?.user || null}>{children}</AdminLayoutShell>
    </Suspense>
  );
}

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<AdminLayoutFallback>{children}</AdminLayoutFallback>}>
      <AdminSessionLayout>{children}</AdminSessionLayout>
    </Suspense>
  );
}
