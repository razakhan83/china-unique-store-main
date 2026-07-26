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

// ─── Carousel Dots ────────────────────────────────────────────────────────────

function CarouselDots({ slideCount }) {
  const { api, scrollTo, goTo } = useCarousel();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  useEffect(() => {
    if (!api) return;

    const updateSnaps = () => {
      try {
        const snaps = typeof api.scrollSnapList === 'function' 
          ? api.scrollSnapList() 
          : typeof api.snapList === 'function' 
          ? api.snapList() 
          : api.internalEngine()?.scrollSnaps || [];
        setScrollSnaps(snaps);
      } catch {
        setScrollSnaps([]);
      }
    };

    const updateSelect = () => {
      try {
        setSelectedIndex(api.selectedSnap());
      } catch {
        // ignore
      }
    };

    updateSnaps();
    updateSelect();

    api.on('init', updateSnaps);
    api.on('reInit', updateSnaps);
    api.on('select', updateSelect);

    return () => {
      try {
        api.off('init', updateSnaps);
        api.off('reInit', updateSnaps);
        api.off('select', updateSelect);
      } catch {
        // ignore
      }
    };
  }, [api]);

  const snapCount = scrollSnaps.length > 0 ? scrollSnaps.length : (slideCount > 1 ? slideCount : 0);

  if (snapCount <= 1) return null;

  const handleGoTo = (idx) => {
    try {
      if (typeof scrollTo === 'function') {
        scrollTo(idx);
      } else if (typeof goTo === 'function') {
        goTo(idx);
      } else if (api && typeof api.goTo === 'function') {
        api.goTo(idx);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative z-30 mt-6 flex items-center justify-center gap-1.5 pt-3 pb-1">
      {Array.from({ length: snapCount }, (_, idx) => (
        <button
          key={idx}
          type="button"
          aria-label={`Go to slide page ${idx + 1}`}
          onClick={() => handleGoTo(idx)}
          className={cn(
            'rounded-full transition-all duration-300 ease-out cursor-pointer',
            idx === selectedIndex
              ? 'w-6 h-2.5 bg-primary'
              : 'size-2.5 bg-background border-2 border-primary/60 hover:bg-primary/20'
          )}
        />
      ))}
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
  // isPausedRef tracks ALL pause signals (touch, hover, off-screen, hidden tab)
  const isPausedRef = useRef(false);
  const autoplayTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!emblaApi || !isInteractive) return;

    // ── Mobile-first GPU-accelerated autoplay engine ──────────────────────────
    const advance = () => {
      if (!emblaApi || isPausedRef.current) return;
      emblaApi.goToNext();
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (!isPausedRef.current) {
        autoplayTimerRef.current = setInterval(advance, 8000);
      }
    };

    const stopAutoplay = () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };

    const clearResumeTimer = () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    // Called on touch/pointer interaction — pauses and resumes after 10s idle
    const onPointerDown = () => {
      stopAutoplay();
      clearResumeTimer();
      resumeTimerRef.current = setTimeout(() => {
        if (!isPausedRef.current) startAutoplay();
      }, 10000);
    };

    // ── Desktop hover pause ───────────────────────────────────────────────────
    const el = wrapperRef.current;
    const onMouseEnter = () => {
      isHoveredRef.current = true;
      stopAutoplay();
    };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
      if (!isPausedRef.current) startAutoplay();
    };

    // ── Tab visibility pause (saves battery on inactive tabs) ─────────────────
    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAutoplay();
      } else if (!isPausedRef.current && !isHoveredRef.current) {
        startAutoplay();
      }
    };

    // ── IntersectionObserver: pause when carousel is off-screen ───────────────
    let observer = null;
    if (typeof IntersectionObserver !== 'undefined' && el) {
      observer = new IntersectionObserver(
        (entries) => {
          const isVisible = entries[0].isIntersecting;
          if (isVisible) {
            isPausedRef.current = false;
            if (!isHoveredRef.current && !document.hidden) startAutoplay();
          } else {
            isPausedRef.current = true;
            stopAutoplay();
            clearResumeTimer();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
    }

    // ── Wire up events ────────────────────────────────────────────────────────
    emblaApi.on('pointerDown', onPointerDown);
    document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });

    if (el) {
      el.addEventListener('mouseenter', onMouseEnter, { passive: true });
      el.addEventListener('mouseleave', onMouseLeave, { passive: true });
    }

    if (!observer) startAutoplay();

    return () => {
      stopAutoplay();
      clearResumeTimer();
      emblaApi.off('pointerDown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (observer) observer.disconnect();
      if (el) {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [emblaApi, isInteractive]);

  // Early return AFTER all hooks
  if (slideCount === 0) return null;

  return (
    <div
      className="w-full"
      ref={wrapperRef}
      style={{ isolation: 'isolate' }}
    >
      <Carousel
        setApi={setEmblaApi}
        opts={{
          align: 'start',
          loop: true,
          watchDrag: true,
          duration: 25,
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

        {/* Carousel Dots */}
        <CarouselDots slideCount={slideCount} />
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
