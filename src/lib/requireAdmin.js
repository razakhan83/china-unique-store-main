// @ts-nocheck
import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

export const getAdminSession = cache(async () => getServerSession(authOptions));

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session || !session.user?.isAdmin) {
    redirect('/admin/login');
  }

  return session;
}

export async function requireMutationAccess() {
  const session = await requireAdmin();
  if (session.user?.isDemo) {
    throw new Error("Demo Mode: Actions are disabled. You have read-only access.");
  }
  return session;
}
