import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayoutShell from './AdminLayoutShell';

function AdminLayoutFallback({ children }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border bg-background">
        <div className="h-16 px-4 md:px-6 xl:px-8" />
      </div>
      <div className="px-4 py-6 md:px-6 xl:px-8">{children}</div>
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
