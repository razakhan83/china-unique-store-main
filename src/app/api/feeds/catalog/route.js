import { getCatalogFeed } from '@/lib/data';

export async function GET() {
  const feed = await getCatalogFeed();

  return Response.json(feed, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
