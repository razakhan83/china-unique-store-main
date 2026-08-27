import { cacheLife, cacheTag } from 'next/cache';
import HomeSectionRenderer from '@/components/home/HomeSectionRenderer';
import { getStorefrontHomePage } from '@/lib/data';

export const metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  'use cache';
  cacheLife('foreverish');
  cacheTag('home-page');

  const homeData = await getStorefrontHomePage().catch(() => ({ sections: [] }));
  const sections = homeData?.sections || [];

  return <HomeSectionRenderer sections={sections} />;
}



