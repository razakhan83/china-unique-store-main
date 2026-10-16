'use server';

import { requireMutationAccess } from '@/lib/requireAdmin';
import mongooseConnect from '@/lib/mongooseConnect';
import Settings from '@/models/Settings';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function toggleGuestModeAction() {
  await requireMutationAccess();
  return { success: false, error: 'Guest demo mode is permanently disabled for security.' };
}
