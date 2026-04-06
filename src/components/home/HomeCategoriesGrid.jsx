import Image from 'next/image';
import Link from 'next/link';
import {
  Armchair,
  Beef,
  Bolt,
  Car,
  Dumbbell,
  Flame,
  Gamepad2,
  Heart,
  PawPrint,
  PenTool,
  Shirt,
  Tag,
  UtensilsCrossed,
} from 'lucide-react';

import { getCategoryColor } from '@/lib/categoryColors';
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';

const CATEGORY_ICONS = {
  'kitchen accessories': UtensilsCrossed,
  kitchen: Flame,
  knives: UtensilsCrossed,
  pots: Beef,
  'home decor': Armchair,
  'health & beauty': Heart,
  stationery: PenTool,
  'toys & games': Gamepad2,
  electronics: Bolt,
  fashion: Shirt,
  'sports & fitness': Dumbbell,
  'pet supplies': PawPrint,
  automotive: Car,
};

function getCategoryIcon(name) {
  return CATEGORY_ICONS[(name || '').toLowerCase().trim()] || Tag;
}

export default function HomeCategoriesGrid({ title = 'Shop by Category', categories = [] }) {
  if (!categories.length) return null;

  return (
    <section className="border-b border-border bg-card/70 py-6 md:py-7">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Browse</p>
          <h2 className="mt-2 text-[1.65rem] font-bold tracking-[-0.04em] text-primary md:text-[2.1rem]">
            {title}
          </h2>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 md:w-10"
            style={{ background: 'linear-gradient(to right, var(--color-card), transparent)' }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 md:w-10"
            style={{ background: 'linear-gradient(to left, var(--color-card), transparent)' }}
          />

          <div
            className="category-icon-carousel"
            data-interactive={categories.length > 1 ? 'true' : 'false'}
            aria-label="Shop by category"
            aria-roledescription="carousel"
          >
            {categories.map((category, index) => {
              const colors = getCategoryColor(category.label);
              const Icon = getCategoryIcon(category.label);
              const imageSrc = category.image
                ? optimizeCloudinaryUrl(category.image, CLOUDINARY_IMAGE_PRESETS.categoryCircle)
                : '';

              return (
                <div key={`${category.id}-${index}`} className="category-icon-carousel-item">
                  <Link
                    href={`/products?category=${category.id}`}
                    className="group flex w-full min-w-0 flex-col items-center gap-3 px-1 py-1 text-center"
                  >
                    <span
                      className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/80 shadow-[0_14px_28px_rgba(10,61,46,0.08)] transition-transform duration-300 group-hover:scale-[1.04] md:h-[6.75rem] md:w-[6.75rem]"
                      style={{
                        background: `radial-gradient(circle at 30% 25%, white, ${colors.hex})`,
                      }}
                    >
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={category.label}
                          fill
                          sizes="(max-width: 768px) 80px, 108px"
                          loading="lazy"
                          className="object-cover"
                          {...getBlurPlaceholderProps(category.blurDataURL)}
                        />
                      ) : (
                        <span className={`flex size-full items-center justify-center rounded-full ${colors.bg}`}>
                          <Icon className={`${colors.text} size-7 md:size-9`} />
                        </span>
                      )}
                    </span>

                    <span className="line-clamp-2 min-h-10 max-w-[112px] text-sm font-medium leading-tight text-muted-foreground transition-colors group-hover:text-foreground md:max-w-[132px]">
                      {category.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
