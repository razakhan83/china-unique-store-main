// @ts-nocheck
'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';

import { cn } from '@/lib/utils';

/** @typedef {import('embla-carousel').EmblaCarouselType} CarouselApi */
/** @typedef {import('embla-carousel').EmblaOptionsType} CarouselOptions */
/** @typedef {import('embla-carousel').EmblaPluginType} CarouselPlugin */

const CarouselContext = React.createContext(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }

  return context;
}

function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}) {
  const reactId = React.useId();
  const carouselId = React.useMemo(
    () => `embla-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    [reactId]
  );
  const contentId = `${carouselId}-container`;
  const [carouselRef, api, serverApi] = useEmblaCarousel(
    {
      axis: orientation === 'horizontal' ? 'x' : 'y',
      ...opts,
    },
    plugins
  );
  const ssrStyles =
    !api && serverApi && Array.isArray(opts?.ssr) && opts.ssr.length > 0
      ? serverApi.ssrStyles(`#${contentId}`, '[data-embla-slide]')
      : '';

  React.useEffect(() => {
    if (!api) {
      return;
    }

    if (setApi) {
      setApi(api);
    }

    return () => {
      if (setApi) {
        setApi(undefined);
      }
    };
  }, [api, setApi]);

  const value = React.useMemo(
    () => ({
      carouselRef,
      api,
      contentId,
      orientation,
      canGoToPrev: () => api?.canGoToPrev() ?? false,
      canGoToNext: () => api?.canGoToNext() ?? false,
      goToPrev: (instant) => api?.goToPrev(instant),
      goToNext: (instant) => api?.goToNext(instant),
      goTo: (index, instant, direction) => api?.goTo(index, instant, direction),
      selectedSnap: () => api?.selectedSnap() ?? 0,
      scrollPrev: (instant) => api?.goToPrev(instant),
      scrollNext: (instant) => api?.goToNext(instant),
      scrollTo: (index, instant, direction) => api?.goTo(index, instant, direction),
      selectedScrollSnap: () => api?.selectedSnap() ?? 0,
    }),
    [api, carouselRef, contentId, orientation]
  );

  return (
    <CarouselContext.Provider value={value}>
      <div
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {ssrStyles ? <style>{ssrStyles}</style> : null}
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, viewportClassName, ...props }) {
  const { carouselRef, contentId, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className={cn('overflow-hidden', viewportClassName)}>
      <div
        id={contentId}
        className={cn(
          'flex touch-pan-y',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          className
        )}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }) {
  const { orientation } = useCarousel();

  return (
    <div
      data-embla-slide
      role="group"
      aria-roledescription="slide"
      className={cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        className
      )}
      {...props}
    />
  );
}

export { Carousel, CarouselContent, CarouselItem, useCarousel };
