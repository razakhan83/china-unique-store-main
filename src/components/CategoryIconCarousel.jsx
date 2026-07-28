'use client';

import { useEffect, useRef, useState } from 'react';
import Link from "next/link";
import CategoryPillCard from "@/components/home/CategoryPillCard";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoryIconCarousel({ categories }) {
  const categoryCount = categories?.length ?? 0;
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
  }, [categoryCount]);

  if (!categoryCount) return null;

  function scrollCategories(direction) {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const distance = Math.max(carousel.clientWidth * 0.72, 220);
    carousel.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  }

  // Calculate which dot is active based on scroll progress (0 to 1)
  const numDots = 4;
  const activeDotIndex = Math.min(
    Math.max(Math.round(scrollProgress * (numDots - 1)), 0),
    numDots - 1
  );

  return (
    <section className="relative border-b border-border bg-card/70 py-6 md:py-8">
      <div className="relative mx-auto max-w-7xl px-4">
        {/* Section header */}
        <div className="mb-6 flex items-center justify-between gap-4 md:mb-8 md:items-end">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Browse</p>
            <h2 className="mt-1 text-[1.65rem] font-bold tracking-[-0.04em] text-slate-800 md:text-[2.1rem]">
              Shop by Category
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Scroll arrows */}
            {categoryCount > 1 && isMounted && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  disabled={!canScrollLeft}
                  aria-label="Scroll categories left"
                  className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  disabled={!canScrollRight}
                  aria-label="Scroll categories right"
                  className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* Clean Text "View All" Link */}
            <Link
              href="/categories"
              className="group inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-lg font-semibold text-emerald-800 transition-colors duration-300 hover:text-emerald-950"
            >
              View All
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Carousel wrapper */}
        <div className="relative -my-4 overflow-visible py-4 md:-mx-6">
          {/* Left fade */}
          <div
            className={cn(
              "pointer-events-none absolute inset-y-4 left-0 z-10 w-8 transition-opacity duration-300",
              canScrollLeft ? "opacity-100" : "opacity-0"
            )}
            style={{ background: "linear-gradient(to right, var(--color-card) 20%, transparent)" }}
          />
          {/* Right fade */}
          <div
            className={cn(
              "pointer-events-none absolute inset-y-4 right-0 z-10 w-8 transition-opacity duration-300",
              canScrollRight ? "opacity-100" : "opacity-0"
            )}
            style={{ background: "linear-gradient(to left, var(--color-card) 20%, transparent)" }}
          />

          <div
            ref={carouselRef}
            className="category-icon-carousel"
            data-interactive={categoryCount > 1 ? "true" : "false"}
            aria-label="Shop by category"
            aria-roledescription="carousel"
          >
            {categories.map((category, index) => (
              <div
                key={`${category._id || category.id}-${index}`}
                className="category-icon-carousel-item"
              >
                <CategoryPillCard category={category} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {categoryCount > 1 && isMounted && (
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
      </div>
    </section>
  );
}
