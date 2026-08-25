'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { optimizeCloudinaryUrl, CLOUDINARY_IMAGE_PRESETS } from '@/lib/cloudinaryImage';

const HERO_AUTOPLAY_DELAY_MS = 5000;
const HERO_SWIPE_THRESHOLD_PX = 40;

function extractSlideImages(slide) {
  const desktopAsset = slide?.desktopImage || null;
  const mobileAsset = slide?.mobileImage || null;

  const rawDesktopSrc =
    (typeof desktopAsset === 'string' ? desktopAsset : desktopAsset?.url || desktopAsset?.image?.url) ||
    slide?.pcSrc ||
    slide?.desktopSrc ||
    '';

  const rawMobileSrc =
    (typeof mobileAsset === 'string' ? mobileAsset : mobileAsset?.url || mobileAsset?.image?.url) ||
    slide?.mobileSrc ||
    '';

  const fallbackSrc = rawDesktopSrc || rawMobileSrc || slide?.image || slide?.src || '';

  const desktopSrc = rawDesktopSrc || fallbackSrc;
  const mobileSrc = rawMobileSrc || fallbackSrc;

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

  const containerRef = useRef(null);
  const isInViewportRef = useRef(true);

  useEffect(() => {
    if (resolvedSlides.length <= 1) return;

    const el = containerRef.current;
    let observer = null;

    if (typeof IntersectionObserver !== 'undefined' && el) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isInViewportRef.current = Boolean(entry && entry.isIntersecting);
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
    }

    const autoplayTimer = window.setTimeout(() => {
      if (isInViewportRef.current && typeof document !== 'undefined' && !document.hidden) {
        setActiveIndex((current) => (current + 1) % resolvedSlides.length);
      }
    }, HERO_AUTOPLAY_DELAY_MS);

    return () => {
      window.clearTimeout(autoplayTimer);
      if (observer) observer.disconnect();
    };
  }, [resolvedSlides.length, safeActiveIndex]);

  if (resolvedSlides.length === 0) return null;

  return (
    <section
      ref={containerRef}
      data-testid="hero-main-slider"
      className="relative w-full overflow-hidden bg-muted/40"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative h-[54vh] min-h-[320px] w-full overflow-hidden bg-muted/40 md:h-[460px] lg:h-[560px]">
        {resolvedSlides.map((slide, index) => (
          <div
            key={slide.id || `${slide.images.mobileSrc}-${index}`}
            className={`hero-fade-slide ${safeActiveIndex === index ? 'is-active' : ''}`}
            aria-hidden={safeActiveIndex !== index}
          >
            <SlideFrame href={slide.link}>
              {/* Mobile screen banner */}
              <div className="relative h-full w-full md:hidden">
                <Image
                  src={optimizeCloudinaryUrl(slide.images.mobileSrc || slide.images.desktopSrc, CLOUDINARY_IMAGE_PRESETS.heroMobile)}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="object-cover"
                  quality={80}
                  {...getBlurPlaceholderProps(slide.images.mobileBlur || slide.images.desktopBlur)}
                />
              </div>

              {/* Desktop screen banner */}
              <div className="relative hidden h-full w-full md:block">
                <Image
                  src={optimizeCloudinaryUrl(slide.images.desktopSrc || slide.images.mobileSrc, CLOUDINARY_IMAGE_PRESETS.heroFull)}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="object-cover"
                  quality={85}
                  {...getBlurPlaceholderProps(slide.images.desktopBlur || slide.images.mobileBlur)}
                />
              </div>
            </SlideFrame>
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
                className={`h-2 rounded-full shadow-md transition-all duration-300 origin-center ${
                  safeActiveIndex === index ? 'w-8 bg-white' : 'w-2 bg-white/55 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
