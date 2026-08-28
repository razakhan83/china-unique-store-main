import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/requireAdmin';

/**
 * Standard API Route Guard for Admin-only API endpoints.
 * Returns JSON 401/403 — never redirect.
 *
 * @param {Function} handler - (req, ctx, session) => Response
 * @param {{ mutation?: boolean }} [options]
 */
export function withAdmin(handler, { mutation = false } = {}) {
  return async (req, ctx) => {
    try {
      const { session, error } = await requireApiAdmin({ mutation });
      if (error) return error;
      return await handler(req, ctx, session);
    } catch (error) {
      console.error('[withAdmin API Error]:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}
