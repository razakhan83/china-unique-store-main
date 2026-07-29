'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import SectionDoodleBackground from '@/components/home/SectionDoodleBackground';
import CategoryPillCard from '@/components/home/CategoryPillCard';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomeCategoriesGrid({ title = 'Shop by Category', categories = [] }) {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const carousel = carouselRef.current;
    if (!carousel) return undefined;

    const updateScrollState = () => {
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
      setCanScrollLeft(carousel.scrollLeft > 8);
      setCanScrollRight(maxScrollLeft - carousel.scrollLeft > 8);

      if (maxScrollLeft > 0) {
        setScrollProgress(carousel.scrollLeft / maxScrollLeft);
      } else {
        setScrollProgress(0);
      }
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

  const numDots = 4;
  const activeDotIndex = Math.min(
    Math.max(Math.round(scrollProgress * (numDots - 1)), 0),
    numDots - 1
  );

  return (
    <section className="relative border-b border-border bg-card/70 py-6 md:py-7">
      <SectionDoodleBackground categoryLabel={title} />
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-[1.25rem] leading-tight font-bold tracking-[-0.03em] text-primary [text-wrap:balance] sm:text-[1.5rem] md:text-[2.1rem]">
              {title}
            </h2>
          </div>

          <Link
            href="/categories"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/15 bg-background/80 bg-clip-padding px-4 text-sm font-semibold text-primary outline-none select-none shadow-[0_12px_30px_rgba(10,61,46,0.08)] transition-[transform,background-color,color,box-shadow] duration-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_16px_36px_rgba(10,61,46,0.14)] active:scale-[0.96]"
          >
            <span>View All</span>
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </div>

        {/* The clipping box allows 3D card elevation while containing overflow */}
        <div className="relative md:-mx-6 -my-4 overflow-visible py-4">
          <div
            className={cn(
              "pointer-events-none absolute inset-y-4 left-0 z-10 w-8 transition-opacity duration-300",
              canScrollLeft ? "opacity-100" : "opacity-0"
            )}
            style={{ background: 'linear-gradient(to right, var(--color-card) 20%, transparent)' }}
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-4 right-0 z-10 w-8 transition-opacity duration-300",
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
            {categories.map((category, index) => (
              <div key={`${category._id || category.id}-${index}`} className="category-icon-carousel-item">
                <CategoryPillCard category={category} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {categories.length > 1 && isMounted && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: numDots }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  activeDotIndex === i ? "w-8 bg-emerald-600" : "w-2 bg-slate-200"
                )}
              />
            ))}
          </div>
        )}

        {categories.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => scrollCategories('left')}
              disabled={!canScrollLeft}
              className="pointer-events-auto absolute -left-4 top-[58%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-white/92 text-foreground shadow-[0_12px_24px_rgba(10,61,46,0.16)] backdrop-blur-sm transition hover:scale-[1.03] hover:bg-white disabled:pointer-events-none disabled:opacity-0 lg:flex xl:-left-10"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => scrollCategories('right')}
              disabled={!canScrollRight}
              className="pointer-events-auto absolute -right-4 top-[58%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-white/92 text-foreground shadow-[0_12px_24px_rgba(10,61,46,0.16)] backdrop-blur-sm transition hover:scale-[1.03] hover:bg-white disabled:pointer-events-none disabled:opacity-0 lg:flex xl:-right-10"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
