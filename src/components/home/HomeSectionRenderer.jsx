import dynamic from 'next/dynamic';
import HeroSlider from '@/components/HeroSlider';

const HomeCategoriesGrid = dynamic(() => import('@/components/home/HomeCategoriesGrid'));
const HomeProductBanner = dynamic(() => import('@/components/home/HomeProductBanner'));
const HomeProductGridSection = dynamic(() => import('@/components/home/HomeProductGridSection'));
const HomeScrollableBannerCarousel = dynamic(() => import('@/components/home/HomeScrollableBannerCarousel'));
const HomeVideoCatalog = dynamic(() => import('@/components/home/HomeVideoCatalog'));

export default function HomeSectionRenderer({ sections = [] }) {
  if (!sections.length) return null;

  return (
    <>
      {sections.map((section) => {
        if (section.type === 'HeroSlider') {
          return <HeroSlider key={section.id} slides={section.slides} />;
        }

        if (section.type === 'CategoriesGrid') {
          return (
            <HomeCategoriesGrid
              key={section.id}
              title={section.title}
              categories={section.categories}
            />
          );
        }

        if (section.type === 'ProductBanner') {
          return (
            <HomeProductBanner
              key={section.id}
              title={section.title}
              description={section.description}
              desktopImages={section.desktopImages}
              mobileImage={section.mobileImage}
            />
          );
        }

        if (section.type === 'ScrollableBannerCarousel') {
          return (
            <HomeScrollableBannerCarousel
              key={section.id}
              title={section.title}
              description={section.description}
              banners={section.carouselBanners}
            />
          );
        }

        if (section.type === 'ProductGridByCategory') {
          return (
            <HomeProductGridSection
              key={section.id}
              title={section.title}
              category={section.category}
              products={section.products}
            />
          );
        }

        if (section.type === 'ProductCollection') {
          return (
            <HomeProductGridSection
              key={section.id}
              title={section.title}
              products={section.products}
              viewAllHref={section.viewAllHref}
            />
          );
        }

        if (section.type === 'VideoCatalog') {
          return (
            <HomeVideoCatalog
              key={section.id}
              title={section.title}
              pcVideo={section.pcVideo}
              mobileVideo={section.mobileVideo}
            />
          );
        }

        return null;
      })}
    </>
  );
}
