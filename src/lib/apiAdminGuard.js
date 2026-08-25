import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Standard API Route Guard for Admin-only API endpoints.
 * Ensures the requesting user has an authenticated session with isAdmin === true.
 *
 * @param {Function} handler - The async route handler function (req, ctx, session) => Response
 * @returns {Function} Wrapped Next.js Route Handler
 */
export function withAdmin(handler) {
  return async (req, ctx) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user?.isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin access required.' },
          { status: 401 }
        );
      }
      return await handler(req, ctx, session);
    } catch (error) {
      console.error('[withAdmin API Error]:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}
