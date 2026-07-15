'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';

const HERO_AUTOPLAY_DELAY_MS = 5000;
const HERO_SWIPE_THRESHOLD_PX = 40;

function extractSlideImages(slide) {
  const desktopAsset = slide?.desktopImage || null;
  const mobileAsset = slide?.mobileImage || null;

  const desktopSrc = desktopAsset?.url || slide?.pcSrc || slide?.image || slide?.src || '';
  const mobileSrc = mobileAsset?.url || slide?.mobileSrc || desktopSrc || '';

  return {
    desktopSrc,
    desktopBlur: desktopAsset?.blurDataURL || slide?.blurDataURL || '',
    mobileSrc,
    mobileBlur: mobileAsset?.blurDataURL || desktopAsset?.blurDataURL || slide?.blurDataURL || '',
  };
}

function SlideFrame({ href, children }) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="block h-full w-full">
      {children}
    </Link>
  );
}

export default function HeroSlider({ slides = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  const resolvedSlides = useMemo(
    () =>
      slides
        .map((slide, index) => ({
          ...slide,
          images: extractSlideImages(slide),
          alt: slide?.alt || `Slide ${index + 1}`,
        }))
        .filter((slide) => slide.images.mobileSrc || slide.images.desktopSrc),
    [slides]
  );

  const safeActiveIndex =
    resolvedSlides.length > 0 ? activeIndex % resolvedSlides.length : 0;

  const goToSlide = useCallback(
    (nextIndex) => {
      if (resolvedSlides.length === 0) return;
      const normalizedIndex =
        ((nextIndex % resolvedSlides.length) + resolvedSlides.length) %
        resolvedSlides.length;
      setActiveIndex(normalizedIndex);
    },
    [resolvedSlides.length]
  );

  const goToNextSlide = useCallback(
    () => goToSlide(safeActiveIndex + 1),
    [goToSlide, safeActiveIndex]
  );

  const goToPrevSlide = useCallback(
    () => goToSlide(safeActiveIndex - 1),
    [goToSlide, safeActiveIndex]
  );

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches?.[0];
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (!touch || startX == null || startY == null) return;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaX) < HERO_SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX < 0) goToNextSlide();
    else goToPrevSlide();
  }

  useEffect(() => {
    if (resolvedSlides.length <= 1) return;
    const autoplayTimer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % resolvedSlides.length);
    }, HERO_AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(autoplayTimer);
  }, [resolvedSlides.length, safeActiveIndex]);

  if (resolvedSlides.length === 0) return null;

  return (
    <section
      data-testid="hero-main-slider"
      className="relative w-full overflow-hidden bg-primary/10"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[54vh] min-h-[320px] w-full overflow-hidden bg-primary/10 md:h-[460px] lg:h-[560px]">
        {resolvedSlides.map((slide, index) => (
          <div
            key={slide.id || `${slide.images.mobileSrc}-${index}`}
            className={`hero-fade-slide ${safeActiveIndex === index ? 'is-active' : ''}`}
            aria-hidden={safeActiveIndex !== index}
          >
            <SlideFrame href={slide.link}>
              {/* Mobile Image */}
              {slide.images.mobileSrc && (
                <Image
                  src={slide.images.mobileSrc}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="object-cover md:hidden"
                  quality={85}
                  {...getBlurPlaceholderProps(slide.images.mobileBlur)}
                />
              )}
              {/* PC Image */}
              {slide.images.desktopSrc && (
                <Image
                  src={slide.images.desktopSrc}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="hidden object-cover md:block"
                  quality={85}
                  {...getBlurPlaceholderProps(slide.images.desktopBlur)}
                />
              )}
            </SlideFrame>

            {/* Gradient scrim for text legibility */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.18)_50%,rgba(0,0,0,0.04)_100%)]" />

            {/* Text + CTA overlay */}
            {(slide.title || slide.subtitle || slide.link) ? (
              <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-2 px-5 pb-14 md:px-10 md:pb-12 lg:px-16 lg:pb-14">
                {slide.title ? (
                  <h2 className="max-w-lg text-balance text-xl font-bold leading-tight text-white drop-shadow-lg md:text-3xl lg:text-4xl">
                    {slide.title}
                  </h2>
                ) : null}
                {slide.subtitle ? (
                  <p className="max-w-sm text-sm text-white/85 drop-shadow md:text-base">
                    {slide.subtitle}
                  </p>
                ) : null}
                <Link
                  href={slide.link || '/products'}
                  className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-[background-color,transform] duration-300 hover:bg-white/28 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Shop Now
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : null}
          </div>
        ))}

        {/* Prev/Next arrows — desktop only */}
        {resolvedSlides.length > 1 ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-4 md:flex lg:px-6">
            <button
              type="button"
              onClick={goToPrevSlide}
              className="hero-slider-control pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45"
              aria-label="Previous slide"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={goToNextSlide}
              className="hero-slider-control pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45"
              aria-label="Next slide"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : null}

        {/* Dot indicators */}
        {resolvedSlides.length > 1 ? (
          <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2">
            {resolvedSlides.map((slide, index) => (
              <button
                key={slide.id || `dot-${index}`}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-pressed={safeActiveIndex === index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full shadow-md transition-[width,background-color] duration-300 ${
                  safeActiveIndex === index ? 'w-6 bg-white' : 'w-2.5 bg-white/55 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
