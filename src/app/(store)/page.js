import { Suspense } from 'react';

import HomeClientWrapper from '@/components/HomeClientWrapper';
import HomeCategories from '@/components/HomeCategories';
import HomePageSkeleton from '@/components/HomePageSkeleton';
import { getHomeSections, getStoreCategories } from '@/lib/data';

const heroSlides = [
  { mobileSrc: '/hero1.webp', pcSrc: '/hero1pc.webp', alt: 'Kitchen Promotion 1' },
  { mobileSrc: '/hero2.webp', pcSrc: '/hero2pc.webp', alt: 'Kitchen Promotion 2' },
  { mobileSrc: '/hero3.webp', pcSrc: '/hero3pc.webp', alt: 'Home Decor Promotion 3' },
  { mobileSrc: '/hero4.webp', pcSrc: '/hero4pc.webp', alt: 'Home Decor Promotion 4' },
];

export default function Home() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [{ coverPhotos, sections }, categories] = await Promise.all([
    getHomeSections(),
    getStoreCategories(),
  ]);
  const activeHeroSlides = coverPhotos.length
    ? coverPhotos.map((item, index) => ({
        desktopImage: item.desktopImage,
        tabletImage: item.tabletImage,
        mobileImage: item.mobileImage,
        alt: item.alt || `Store cover ${index + 1}`,
      }))
    : heroSlides;

  return (
    <>
      <HomeClientWrapper
        heroSlides={activeHeroSlides}
        categories={categories}
      />
      <HomeCategories sections={sections} />
    </>
  );
}
