import HeroSlider from '@/components/HeroSlider';

import HomeCategoriesGrid from '@/components/home/HomeCategoriesGrid';
import HomeProductBanner from '@/components/home/HomeProductBanner';
import HomeProductGridSection from '@/components/home/HomeProductGridSection';
import HomeScrollableBannerCarousel from '@/components/home/HomeScrollableBannerCarousel';

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

        return null;
      })}
    </>
  );
}
