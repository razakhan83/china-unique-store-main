'use client';

import { useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function HomeVideoCatalog({ title, pcVideo, mobileVideo }) {
  const [pcLoaded, setPcLoaded] = useState(false);
  const [mobileLoaded, setMobileLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 640px)');
    setIsDesktop(mql.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadVideo(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!pcVideo?.url && !mobileVideo?.url) return null;

  return (
    <section ref={containerRef} className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl bg-muted/20">
        {/* Desktop Video */}
        {pcVideo?.url && isDesktop && (
          <div className="relative hidden sm:block aspect-[21/9] xl:aspect-[3/1]">
            {!pcLoaded && (
              <Skeleton className="absolute inset-0 z-10 h-full w-full" />
            )}
            {shouldLoadVideo && (
              <video
                src={pcVideo.url}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                onCanPlay={() => setPcLoaded(true)}
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-500",
                  pcLoaded ? "opacity-100" : "opacity-0"
                )}
              />
            )}
          </div>
        )}

        {/* Mobile Video */}
        {(mobileVideo?.url || pcVideo?.url) && !isDesktop && (
          <div className="relative sm:hidden aspect-square">
            {!mobileLoaded && (
              <Skeleton className="absolute inset-0 z-10 h-full w-full" />
            )}
            {shouldLoadVideo && (
              <video
                src={mobileVideo?.url || pcVideo?.url}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                onCanPlay={() => setMobileLoaded(true)}
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-500",
                  mobileLoaded ? "opacity-100" : "opacity-0"
                )}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
