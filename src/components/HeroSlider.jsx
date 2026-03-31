'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';

const HERO_AUTOPLAY_DELAY_MS = 5000;
const HERO_SWIPE_THRESHOLD_PX = 40;

function resolveViewport() {
  if (typeof window === 'undefined') return 'desktop';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

function isPreloadCandidate(index, activeIndex, total) {
  if (total <= 1) return true;
  const prevIndex = (activeIndex - 1 + total) % total;
  const nextIndex = (activeIndex + 1) % total;
  return index === activeIndex || index === prevIndex || index === nextIndex;
}

function getActiveAsset(slide, viewport) {
  const desktopAsset = slide?.desktopImage || null;
  const tabletAsset = slide?.tabletImage || desktopAsset;
  const mobileAsset = slide?.mobileImage || desktopAsset;

  if (viewport === 'mobile') {
    return {
      src: optimizeCloudinaryUrl(
        mobileAsset?.url || slide?.mobileSrc || slide?.image || slide?.src || '',
        CLOUDINARY_IMAGE_PRESETS.heroOriginal
      ),
      blurDataURL: mobileAsset?.blurDataURL || desktopAsset?.blurDataURL || slide?.blurDataURL || '',
    };
  }

  if (viewport === 'tablet') {
    return {
      src: optimizeCloudinaryUrl(
        tabletAsset?.url || slide?.tabletSrc || slide?.pcSrc || slide?.image || slide?.src || '',
        CLOUDINARY_IMAGE_PRESETS.heroOriginal
      ),
      blurDataURL: tabletAsset?.blurDataURL || desktopAsset?.blurDataURL || slide?.blurDataURL || '',
    };
  }

  return {
    src: optimizeCloudinaryUrl(
      desktopAsset?.url || slide?.pcSrc || slide?.image || slide?.src || '',
      CLOUDINARY_IMAGE_PRESETS.heroOriginal
    ),
    blurDataURL: desktopAsset?.blurDataURL || slide?.blurDataURL || '',
  };
}

export default function HeroSlider({ slides = [] }) {
  const [viewport, setViewport] = useState('desktop');
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const queries = [
      window.matchMedia('(max-width: 767px)'),
      window.matchMedia('(min-width: 768px) and (max-width: 1023px)'),
    ];

    const syncViewport = () => {
      const nextViewport = queries[0].matches ? 'mobile' : queries[1].matches ? 'tablet' : 'desktop';
      setViewport((current) => (current === nextViewport ? current : nextViewport));
    };

    syncViewport();
    queries.forEach((query) => query.addEventListener('change', syncViewport));

    return () => {
      queries.forEach((query) => query.removeEventListener('change', syncViewport));
    };
  }, []);

  const resolvedSlides = useMemo(
    () =>
      slides
        .map((slide, index) => ({
          ...slide,
          asset: getActiveAsset(slide, viewport),
          alt: slide?.alt || `Slide ${index + 1}`,
        }))
        .filter((slide) => slide.asset?.src),
    [slides, viewport]
  );
  const safeActiveIndex =
    resolvedSlides.length > 0 ? activeIndex % resolvedSlides.length : 0;

  function goToSlide(nextIndex) {
    if (resolvedSlides.length === 0) return;
    const normalizedIndex = ((nextIndex % resolvedSlides.length) + resolvedSlides.length) % resolvedSlides.length;
    setActiveIndex(normalizedIndex);
  }

  function goToNextSlide() {
    goToSlide(safeActiveIndex + 1);
  }

  function goToPrevSlide() {
    goToSlide(safeActiveIndex - 1);
  }

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

    if (Math.abs(deltaX) < HERO_SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      goToNextSlide();
      return;
    }

    goToPrevSlide();
  }

  useEffect(() => {
    if (resolvedSlides.length <= 1) {
      return;
    }

    const autoplayTimer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % resolvedSlides.length);
    }, HERO_AUTOPLAY_DELAY_MS);

    return () => window.clearTimeout(autoplayTimer);
  }, [resolvedSlides.length, safeActiveIndex]);

  if (resolvedSlides.length === 0) return null;

  return (
    <section
      data-testid="hero-main-slider"
      className="relative w-full overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[54vh] min-h-[320px] w-full overflow-hidden bg-black md:h-[460px] lg:h-[560px]">
        {resolvedSlides.map((slide, index) => (
          <div
            key={slide.id || `${slide.asset.src}-${viewport}-${index}`}
            className={`hero-fade-slide ${safeActiveIndex === index ? 'is-active' : ''}`}
            aria-hidden={safeActiveIndex !== index}
          >
            <Image
              src={slide.asset.src}
              alt={slide.alt}
              fill
              sizes="100vw"
              priority={index === 0}
              loading={index === 0 ? undefined : isPreloadCandidate(index, safeActiveIndex, resolvedSlides.length) ? 'eager' : 'lazy'}
              className="object-cover"
              {...getBlurPlaceholderProps(slide.asset.blurDataURL)}
            />

            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.16))]" />
          </div>
        ))}

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

        {resolvedSlides.length > 1 ? (
          <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2">
            {resolvedSlides.map((slide, index) => (
              <button
                key={slide.id || `dot-${index}`}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-pressed={safeActiveIndex === index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  safeActiveIndex === index ? 'w-5 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
