'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function HomeVideoCatalog({ title, pcVideo, mobileVideo }) {
  const [pcLoaded, setPcLoaded] = useState(false);
  const [mobileLoaded, setMobileLoaded] = useState(false);

  if (!pcVideo?.url && !mobileVideo?.url) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {title && (
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:mb-8">
          {title}
        </h2>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-muted/20">
        {/* Desktop Video */}
        {pcVideo?.url && (
          <div className={cn("relative hidden sm:block aspect-[21/9] xl:aspect-[3/1]", !pcVideo.url && "hidden")}>
            {!pcLoaded && (
              <Skeleton className="absolute inset-0 z-10 h-full w-full" />
            )}
            <video
              src={pcVideo.url}
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setPcLoaded(true)}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-500",
                pcLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
        )}

        {/* Mobile Video */}
        {mobileVideo?.url && (
          <div className={cn("relative sm:hidden aspect-square", !mobileVideo.url && "hidden")}>
            {!mobileLoaded && (
              <Skeleton className="absolute inset-0 z-10 h-full w-full" />
            )}
            <video
              src={mobileVideo.url}
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setMobileLoaded(true)}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-500",
                mobileLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
        )}
      </div>
    </section>
  );
}
