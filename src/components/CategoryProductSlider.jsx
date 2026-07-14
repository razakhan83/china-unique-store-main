'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from '@/components/ui/carousel';

// ─── Arrow Buttons ────────────────────────────────────────────────────────────

function CarouselArrows() {
  const { scrollPrev, scrollNext, canGoToPrev, canGoToNext } = useCarousel();
  return (
    <div className="hidden md:flex items-center gap-2">
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary shadow-[0_4px_12px_rgba(10,61,46,0.06)] transition-transform hover:scale-105 hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:pointer-events-none"
        disabled={!canGoToPrev}
        onClick={() => scrollPrev()}
        aria-label="Previous slide"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary shadow-[0_4px_12px_rgba(10,61,46,0.06)] transition-transform hover:scale-105 hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:pointer-events-none"
        disabled={!canGoToNext}
        onClick={() => scrollNext()}
        aria-label="Next slide"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CategoryProductSlider({ categoryLabel, children, viewAllHref }) {
  const slides = Array.isArray(children)
    ? children.flat().filter(Boolean)
    : children
    ? [children]
    : [];
  const slideCount = slides.length;
  const isInteractive = slideCount >= 5;

  // All hooks must be before any early return
  const [emblaApi, setEmblaApi] = useState(null);
  const isHoveredRef = useRef(false);
  const autoplayTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!emblaApi || !isInteractive) return;

    // ── Pure manual autoplay ──────────────────────────────────────────────────
    // We advance the carousel ourselves every 4.5 seconds.
    // This is independent of any plugin and guaranteed to work.

    const advance = () => {
      if (!emblaApi) return;
      // goToNext handles the loop automatically because loop: true is set
      emblaApi.goToNext();
    };

    const startAutoplay = () => {
      stopAutoplay();
      autoplayTimerRef.current = setInterval(advance, 8000);
    };

    const stopAutoplay = () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };

    const stopAndScheduleResume = () => {
      stopAutoplay();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      // Resume after 15 seconds of inactivity
      resumeTimerRef.current = setTimeout(() => {
        if (!isHoveredRef.current) startAutoplay();
      }, 15000);
    };

    // Pause when user hovers
    const el = wrapperRef.current;
    const onMouseEnter = () => {
      isHoveredRef.current = true;
      stopAutoplay();
    };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
      startAutoplay();
    };

    // Stop for 10s on user touch/drag
    emblaApi.on('pointerDown', stopAndScheduleResume);

    if (el) {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    }

    // Start!
    startAutoplay();

    return () => {
      stopAutoplay();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      emblaApi.off('pointerDown', stopAndScheduleResume);
      if (el) {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [emblaApi, isInteractive]);

  // Early return AFTER all hooks
  if (slideCount === 0) return null;

  return (
    <div className="w-full" ref={wrapperRef}>
      <Carousel
        setApi={setEmblaApi}
        opts={{
          align: 'start',
          loop: true,
          watchDrag: true,
          duration: 40,
        }}
        className="w-full"
      >
        {/* Section header */}
        <div className="mb-5 flex items-center justify-between gap-4 md:mb-6 md:items-end">
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.25rem] leading-tight font-bold tracking-[-0.03em] text-primary [text-wrap:balance] sm:text-[1.5rem] md:text-[2.1rem]">
              {categoryLabel}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isInteractive && <CarouselArrows />}
            {viewAllHref ? (
              <Link
                href={viewAllHref}
                className={cn(
                  'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/15 bg-background/80 bg-clip-padding px-4 text-sm font-semibold text-primary outline-none select-none shadow-[0_12px_30px_rgba(10,61,46,0.08)] transition-[transform,background-color,color,box-shadow] duration-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_16px_36px_rgba(10,61,46,0.14)] active:scale-[0.96] md:hidden'
                )}
              >
                View All
                <ArrowRight className="ml-1 size-4" />
              </Link>
            ) : null}
          </div>
        </div>

        {/* Slides */}
        <CarouselContent className="-ml-3 md:-ml-4" viewportClassName="pt-6 pb-6 -mt-6 -mb-6">
          {slides.map((slide, idx) => (
            <CarouselItem
              key={`product-slide-${idx}`}
              className="pl-3 md:pl-4 basis-[50%] md:basis-[33.33%] lg:basis-[25%]"
            >
              <div className="h-full min-w-0 pb-1">{slide}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Desktop "View All" */}
      {viewAllHref ? (
        <div className="mt-6 hidden justify-center md:flex">
          <Link
            href={viewAllHref}
            className={cn(
              'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-primary/15 bg-background/80 bg-clip-padding px-5 text-sm font-semibold text-primary outline-none select-none shadow-[0_12px_30px_rgba(10,61,46,0.08)] transition-[transform,background-color,color,box-shadow] duration-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:shadow-[0_16px_36px_rgba(10,61,46,0.14)] active:scale-[0.96]'
            )}
          >
            View All
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
