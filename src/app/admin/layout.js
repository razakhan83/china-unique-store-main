import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayoutShell from './AdminLayoutShell';

function AdminLayoutFallback({ children }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border bg-background">
        <div className="mx-auto h-16 max-w-7xl px-4" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  );
}

async function AdminSessionLayout({ children }) {
  const session = await getServerSession(authOptions);
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
