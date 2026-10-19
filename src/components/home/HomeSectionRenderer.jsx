import dynamic from 'next/dynamic';
import HeroSlider from '@/components/HeroSlider';
import HomeCategoriesGrid from '@/components/home/HomeCategoriesGrid';
import HomeProductGridSection from '@/components/home/HomeProductGridSection';

const LazyHomeProductGridSection = dynamic(() => import('@/components/home/HomeProductGridSection'), {
  loading: () => <div className="h-64 my-8 rounded-xl bg-muted/20 animate-pulse" />,
});

const HomeTestimonialsCarousel = dynamic(() => import('@/components/HomeTestimonialsCarousel'), {
  loading: () => null,
});
const HomeProductBanner = dynamic(() => import('@/components/home/HomeProductBanner'), {
  loading: () => null,
});
const HomeScrollableBannerCarousel = dynamic(() => import('@/components/home/HomeScrollableBannerCarousel'), {
  loading: () => null,
});
const HomeVideoCatalog = dynamic(() => import('@/components/home/HomeVideoCatalog'), {
  loading: () => null,
});

export default function HomeSectionRenderer({ sections = [] }) {
  const safeSections = Array.isArray(sections) ? sections : [];
  if (!safeSections.length) return null;

  const hasHero = safeSections.some((section) => section?.type === 'HeroSlider');
  const firstProductSectionId = safeSections.find(
    (section) => section?.type === 'ProductGridByCategory' || section?.type === 'ProductCollection'
  )?.id;

  let productGridIndex = 0;

  return (
    <>
      {safeSections.map((section) => {
        if (!section || !section.type) return null;
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

        if (section.type === 'CustomerReviews') {
          if (!section.reviews || !section.reviews.length) return null;
          return (
            <HomeTestimonialsCarousel
              key={section.id}
              title={section.title}
              description={section.description}
              reviews={section.reviews}
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

        if (section.type === 'LimitedTimeOffers') {
          if (!section.products?.length) return null;
          const isBelowFold = productGridIndex++ >= 2;
          const GridComponent = isBelowFold ? LazyHomeProductGridSection : HomeProductGridSection;
          return (
            <GridComponent
              key={section.id}
              title={section.title || 'Limited Time Offers'}
              products={section.products}
              viewAllHref={section.viewAllHref || '/products?category=special-offers'}
            />
          );
        }

        if (section.type === 'ProductGridByCategory' || section.type === 'ProductCollection') {
          const priorityCount = !hasHero && section.id === firstProductSectionId ? 2 : 0;
          const isBelowFold = productGridIndex++ >= 2;
          const GridComponent = isBelowFold ? LazyHomeProductGridSection : HomeProductGridSection;
          return (
            <GridComponent
              key={section.id}
              title={section.title}
              category={section.category}
              products={section.products}
              viewAllHref={section.viewAllHref}
              priorityCount={priorityCount}
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
