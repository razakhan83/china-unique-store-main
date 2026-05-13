import { Suspense } from 'react';
import { AdminShellSkeleton } from '@/components/AdminDashboardSkeleton';
import AdminLayoutShell from './AdminLayoutShell';

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<AdminShellSkeleton>{children}</AdminShellSkeleton>}>
      <AdminLayoutShell sessionUser={null}>{children}</AdminLayoutShell>
    </Suspense>
  );
}
