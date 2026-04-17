import { Suspense } from 'react';

import HomePageSkeleton from '@/components/HomePageSkeleton';
import HomeSectionRenderer from '@/components/home/HomeSectionRenderer';
import { getStorefrontHomePage } from '@/lib/data';

export default async function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}

async function HomePageContent() {
  const { sections } = await getStorefrontHomePage();

  return <HomeSectionRenderer sections={sections} />;
}
