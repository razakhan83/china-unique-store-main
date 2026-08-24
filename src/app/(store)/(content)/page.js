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

  const { sections } = await getStorefrontHomePage();

  return <HomeSectionRenderer sections={sections} />;
}



