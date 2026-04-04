'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { normalizeProductImage } from '@/lib/productImages';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';

export default function ProductGallery({ images }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mainApi, setMainApi] = useState();
  const [thumbsApi, setThumbsApi] = useState();
  const normalizedImages = useMemo(
    () => (Array.isArray(images) ? images.map(normalizeProductImage).filter(Boolean) : []),
    [images]
  );
  const hasMultipleImages = normalizedImages.length > 1;
  const mainOptions = useMemo(
    () => ({
      active: hasMultipleImages,
      align: 'start',
      focus: false,
      loop: hasMultipleImages,
      slideChanges: false,
      slidesToScroll: 1,
      ssr: Array.from({ length: normalizedImages.length }, () => 100),
    }),
    [hasMultipleImages, normalizedImages.length]
  );
  const thumbsOptions = useMemo(
    () => ({
      active: hasMultipleImages,
      align: 'start',
      containScroll: 'trimSnaps',
      dragFree: true,
      slideChanges: false,
      slidesToScroll: 1,
      ssr: Array.from({ length: normalizedImages.length }, () => 31.25),
      breakpoints: {
        '(min-width: 768px)': {
          ssr: Array.from({ length: normalizedImages.length }, () => 25),
        },
      },
    }),
    [hasMultipleImages, normalizedImages.length]
  );

  useEffect(() => {
    if (!mainApi) {
      return;
    }

    const syncSelection = () => {
      const nextIndex = mainApi.selectedSnap();
      setSelectedIndex(nextIndex);
      thumbsApi?.goTo(nextIndex);
    };

    syncSelection();
    mainApi.on('select', syncSelection);
    mainApi.on('reinit', syncSelection);

    return () => {
      mainApi.off('select', syncSelection);
      mainApi.off('reinit', syncSelection);
    };
  }, [mainApi, thumbsApi]);

  if (normalizedImages.length === 0) {
    return (
      <div className="surface-card relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl text-muted-foreground">
        <ImageIcon className="size-16" />
      </div>
    );
  }

  const handleThumbnailClick = (index) => {
    mainApi?.goTo(index);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="surface-card relative aspect-square overflow-hidden rounded-xl">
        <Carousel
          setApi={setMainApi}
          opts={mainOptions}
          className="h-full"
        >
          <CarouselContent viewportClassName="h-full" className="ml-0 h-full">
            {normalizedImages.map((image, index) => (
              <CarouselItem key={index} className="h-full basis-full pl-0">
                <div className="relative h-full min-h-0 w-full">
                  <Image
                    src={optimizeCloudinaryUrl(image.url, CLOUDINARY_IMAGE_PRESETS.productGalleryMain)}
                    alt={`Product Image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-105"
                    {...getBlurPlaceholderProps(image.blurDataURL)}
                    preload={index === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {hasMultipleImages ? (
        <Carousel
          setApi={setThumbsApi}
          opts={thumbsOptions}
          className="w-full"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {normalizedImages.map((image, index) => (
              <CarouselItem
                key={index}
                className="basis-[31.25%] pl-3 md:basis-[25%] md:pl-4"
              >
                <button
                  type="button"
                  onClick={() => handleThumbnailClick(index)}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={index === selectedIndex}
                  className={`relative block aspect-square w-full min-w-0 cursor-pointer overflow-hidden rounded-lg border transition-all duration-300 ease-out ${
                    index === selectedIndex
                      ? 'border-primary shadow-sm opacity-100'
                      : 'border-border opacity-60 hover:scale-[1.02] hover:opacity-100'
                  }`}
                >
                  <div className="absolute inset-0 bg-muted" />
                  <Image
                    src={optimizeCloudinaryUrl(image.url, CLOUDINARY_IMAGE_PRESETS.productGalleryThumb)}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    {...getBlurPlaceholderProps(image.blurDataURL)}
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : null}
    </div>
  );
}
