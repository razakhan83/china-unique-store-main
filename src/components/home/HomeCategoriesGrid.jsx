'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import SectionDoodleBackground from '@/components/home/SectionDoodleBackground';
import {
  Armchair,
  Beef,
  Bolt,
  Car,
  ChevronLeft,
  ChevronRight,
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

import { getCategoryColor, getCategoryColorByIndex } from '@/lib/categoryColors';
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
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return undefined;

    const updateScrollState = () => {
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
      setCanScrollLeft(carousel.scrollLeft > 8);
      setCanScrollRight(maxScrollLeft - carousel.scrollLeft > 8);
    };

    updateScrollState();
    carousel.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      carousel.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categories.length]);

  if (!categories.length) return null;

  function scrollCategories(direction) {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const distance = Math.max(carousel.clientWidth * 0.72, 220);
    carousel.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  }

  return (
    <section className="relative border-b border-border bg-card/70 py-6 md:py-7">
      <SectionDoodleBackground categoryLabel={title} />
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Browse</p>
          <h2 className="mt-2 text-[1.65rem] font-bold tracking-[-0.04em] text-primary md:text-[2.1rem]">
            {title}
          </h2>
        </div>

        {/* The clipping box is expanded by 40px (2.5rem) on all sides to allow shadows to render on desktop, while preventing bleeding across the whole screen */}
        <div className="relative md:-mx-10 -my-8 overflow-hidden py-8">
          <div
            className={cn(
              "pointer-events-none absolute inset-y-8 left-0 z-10 w-10 transition-opacity duration-300",
              canScrollLeft ? "opacity-100" : "opacity-0"
            )}
            style={{ background: 'linear-gradient(to right, var(--color-card) 20%, transparent)' }}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-8 right-0 z-10 w-10 transition-opacity duration-300",
              canScrollRight ? "opacity-100" : "opacity-0"
            )}
            style={{ background: 'linear-gradient(to left, var(--color-card) 20%, transparent)' }}
          />

          <div
            ref={carouselRef}
            className="category-icon-carousel"
            data-interactive={categories.length > 1 ? 'true' : 'false'}
            aria-label="Shop by category"
            aria-roledescription="carousel"
          >
            {categories.map((category, index) => {
              const colors = getCategoryColorByIndex(index);
              const Icon = getCategoryIcon(category.label);
              const imageSrc = category.image
                ? optimizeCloudinaryUrl(category.image, CLOUDINARY_IMAGE_PRESETS.categoryCircle)
                : '';

              return (
                <div key={`${category.id}-${index}`} className="category-icon-carousel-item">
                  <Link
                    href={`/products?category=${category.id}`}
                    className="group flex w-full min-w-0 flex-col items-center gap-3 p-3 text-center"
                  >
                    <span
                      className="mac-dock-circle relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/80 shadow-[0_14px_28px_rgba(10,61,46,0.08)] md:h-[8.5rem] md:w-[8.5rem]"
                      style={{
                        background: `radial-gradient(circle at 30% 25%, white 10%, ${colors.hex})`,
                      }}
                    >
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={category.label}
                          fill
                          sizes="(max-width: 768px) 96px, 136px"
                          loading="lazy"
                          className="object-cover"
                          {...getBlurPlaceholderProps(category.blurDataURL)}
                        />
                      ) : (
                        <span
                          className="flex size-full items-center justify-center rounded-full"
                          style={colors.style}
                        >
                          <Icon className={`${colors.text} size-8 md:size-12`} />
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

        {categories.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollCategories('left')}
              disabled={!canScrollLeft}
              className="pointer-events-auto absolute -left-4 top-[55%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-white/92 text-foreground shadow-[0_12px_24px_rgba(10,61,46,0.16)] backdrop-blur-sm transition hover:scale-[1.03] hover:bg-white disabled:pointer-events-none disabled:opacity-0 lg:flex xl:-left-12"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollCategories('right')}
              disabled={!canScrollRight}
              className="pointer-events-auto absolute -right-4 top-[55%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-white/92 text-foreground shadow-[0_12px_24px_rgba(10,61,46,0.16)] backdrop-blur-sm transition hover:scale-[1.03] hover:bg-white disabled:pointer-events-none disabled:opacity-0 lg:flex xl:-right-12"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
