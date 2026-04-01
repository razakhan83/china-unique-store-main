import { cacheLife, cacheTag } from 'next/cache';

import HomeClientWrapper from '@/components/HomeClientWrapper';
import HomeCategories from '@/components/HomeCategories';
import { getHomeSections } from '@/lib/data';

const heroSlides = [
  { mobileSrc: '/hero1.webp', pcSrc: '/hero1pc.webp', alt: 'Kitchen Promotion 1' },
  { mobileSrc: '/hero2.webp', pcSrc: '/hero2pc.webp', alt: 'Kitchen Promotion 2' },
  { mobileSrc: '/hero3.webp', pcSrc: '/hero3pc.webp', alt: 'Home Decor Promotion 3' },
  { mobileSrc: '/hero4.webp', pcSrc: '/hero4pc.webp', alt: 'Home Decor Promotion 4' },
];

export default async function Home() {
  'use cache';
  cacheLife('foreverish');
  cacheTag('home-sections', 'products', 'categories', 'cover-photos', 'settings');

  const { coverPhotos, sections, categories } = await getHomeSections();
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
