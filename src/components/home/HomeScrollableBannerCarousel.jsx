import Image from 'next/image';
import Link from 'next/link';

import { optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';

function ScrollableBannerCard({ banner, index }) {
  if (!banner?.image?.url) return null;

  const frame = (
    <div className="relative aspect-[16/7] overflow-hidden rounded-[1.75rem] bg-muted shadow-[0_18px_42px_rgba(10,61,46,0.09)]">
      <Image
        src={optimizeCloudinaryUrl(banner.image.url)}
        alt={banner.alt || `Scrollable banner ${index + 1}`}
        fill
        sizes="(max-width: 768px) 88vw, (max-width: 1280px) 58vw, 42vw"
        className="object-cover transition-transform duration-500 hover:scale-[1.02]"
        {...getBlurPlaceholderProps(banner.image.blurDataURL)}
      />
    </div>
  );

  return (
    <article className="min-w-[88%] scroll-ml-4 snap-start sm:min-w-[68%] lg:min-w-[44%]">
      {banner.link ? (
        <Link href={banner.link} className="block">
          {frame}
        </Link>
      ) : (
        frame
      )}
    </article>
  );
}

export default function HomeScrollableBannerCarousel({
  title = '',
  description = '',
  banners = [],
}) {
  const visibleBanners = Array.isArray(banners)
    ? banners.filter((banner) => banner?.image?.url)
    : [];

  if (visibleBanners.length === 0) return null;

  return (
    <section className="bg-white py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4">
        {(title || description) ? (
          <div className="mb-4 max-w-2xl">
            {title ? (
              <h2 className="text-[1.7rem] font-bold tracking-[-0.05em] text-primary [text-wrap:balance] md:text-[2.15rem]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 text-sm text-muted-foreground [text-wrap:pretty] md:text-base">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        <div
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]"
          aria-label={title || 'Scrollable banner carousel'}
        >
          {visibleBanners.map((banner, index) => (
            <ScrollableBannerCard
              key={`${banner.image.url}-${index}`}
              banner={banner}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
