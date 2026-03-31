import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayoutShell from './AdminLayoutShell';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  return <AdminLayoutShell sessionUser={session?.user || null}>{children}</AdminLayoutShell>;
}
