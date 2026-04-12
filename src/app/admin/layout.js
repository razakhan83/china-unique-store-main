import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayoutShell from './AdminLayoutShell';

function AdminLayoutFallback({ children }) {
  return <AdminLayoutShell sessionUser={null}>{children}</AdminLayoutShell>;
}

async function AdminSessionLayout({ children }) {
  const session = await getServerSession(authOptions);
  return <AdminLayoutShell sessionUser={session?.user || null}>{children}</AdminLayoutShell>;
}

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<AdminLayoutFallback>{children}</AdminLayoutFallback>}>
      <AdminSessionLayout>{children}</AdminSessionLayout>
    </Suspense>
  );
}
