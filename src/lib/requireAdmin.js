// @ts-nocheck
import 'server-only';

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';


import { authOptions } from '@/lib/auth';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.isAdmin) {
    redirect('/admin/login');
  }

  return session;
}

