// @ts-nocheck
import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

export const DEMO_MODE_MESSAGE = 'Demo Mode: Actions are disabled. You have read-only access.';
export const DEMO_PII_RESTRICTED_MESSAGE = 'Demo Mode: Access to real customer data is restricted.';

export const getAdminSession = cache(async () => getServerSession(authOptions));

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session || !session.user?.isAdmin || session.user?.isDemo) {
    redirect('/admin/login');
  }

  return session;
}

export async function requireMutationAccess() {
  return requireAdmin();
}

/** JSON 401 for Route Handlers — never redirect (redirects become 500 in API catch blocks). */
export async function requireApiAdmin() {
  const session = await getAdminSession();

  if (!session || !session.user?.isAdmin || session.user?.isDemo) {
    return {
      session: null,
      error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { session, error: null };
}
