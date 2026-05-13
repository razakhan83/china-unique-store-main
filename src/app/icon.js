import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { getStoreSettings } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readFallbackFavicon() {
  const faviconPath = path.join(process.cwd(), 'src', 'app', 'favicon.ico');
  const bytes = await readFile(faviconPath);

  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}

export default async function Icon() {
  const settings = await getStoreSettings();
  const faviconUrl = String(settings?.faviconUrl || '').trim();

  if (!faviconUrl) {
    return readFallbackFavicon();
  }

  try {
    const response = await fetch(faviconUrl, { cache: 'no-store' });
    if (!response.ok) {
      return readFallbackFavicon();
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const bytes = await response.arrayBuffer();

    return new Response(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch {
    return readFallbackFavicon();
  }
}
