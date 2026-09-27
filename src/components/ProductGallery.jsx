'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ImageIcon, Maximize2, Badge as BadgeIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { normalizeProductImage } from '@/lib/productImages';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { getProductTagById } from '@/lib/productTags';
import { cn } from '@/lib/utils';
import ProductWishlistButton from '@/components/ProductWishlistButton';
import { useFlashSaleActive } from '@/components/FlashSaleTimer';

export default function ProductGallery({ images, primaryTag, product }) {
  const flashLive = useFlashSaleActive(product?.discountType === 'time-based' ? product.discountEndsAt : null);
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
    }),
    [hasMultipleImages]
  );
  const mainSsr = useMemo(
    () =>
      hasMultipleImages
        ? {
            slideSizes: Array.from({ length: normalizedImages.length }, () => 100),
          }
        : undefined,
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
    }),
    [hasMultipleImages]
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
      <div className="surface-card relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl text-muted-foreground" style={{ backgroundColor: '#ffffff' }}>
        <ImageIcon className="size-16" />
      </div>
    );
  }

  const handleThumbnailClick = (index) => {
    mainApi?.goTo(index);
  };

  const mainTag = primaryTag ? getProductTagById(primaryTag) : null;
  const discountOn = product?.discountType === 'time-based'
    ? flashLive
    : Boolean(product?.isDiscounted && product?.discountPercentage > 0);
  const discountLabel = discountOn ? `${product.discountPercentage}% OFF` : null;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="surface-card relative aspect-square overflow-hidden rounded-xl" style={{ backgroundColor: '#ffffff' }}>
        
        {discountLabel ? (
          <div className="absolute left-3 top-3 z-20 pointer-events-auto">
            <Badge className="pointer-events-auto rounded bg-destructive text-destructive-foreground px-2.5 py-1 text-[11px] sm:text-xs font-bold tracking-wide shadow-sm border-none">
              {product.discountPercentage}% OFF
            </Badge>
          </div>
        ) : (
          mainTag && (
            <div className="absolute left-3 top-3 z-20 pointer-events-auto">
              <div 
                className={`flex items-center justify-center rounded-full p-2 shadow-sm border border-white/20 bg-background/95 ${mainTag.bgColor} ${mainTag.color}`}
                title={mainTag.label}
              >
                <mainTag.icon className="size-5 drop-shadow-sm" />
              </div>
            </div>
          )
        )}

        {product && (
          <div className="absolute right-3 top-3 z-20 pointer-events-auto md:hidden">
            <ProductWishlistButton
              product={product}
              mode="detail"
              className="!bg-transparent !border-transparent !shadow-none text-foreground hover:text-red-500 [&>span]:hidden flex items-center justify-center transition-colors [&_svg]:!size-6 p-0"
            />
          </div>
        )}

        <Carousel
          setApi={setMainApi}
          opts={mainOptions}
          ssr={mainSsr}
          className="h-full"
        >
          <CarouselContent viewportClassName="h-full" className="ml-0 h-full">
            {normalizedImages.map((image, index) => {
              const productName = product?.Name || product?.name || 'Product';
              return (
                <CarouselItem key={index} className="h-full basis-full pl-0">
                  <div className="relative h-full min-h-0 w-full bg-white rounded-2xl overflow-hidden flex items-center justify-center">
                    <Image
                      src={optimizeCloudinaryUrl(image.url, CLOUDINARY_IMAGE_PRESETS.productGalleryMain)}
                      alt={`${productName} - View ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain transition-transform duration-[700ms] ease-[cubic-bezier(0.25,1,0.5,1)] lg:hover:scale-105"
                      priority={index === 0}
                    />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        {hasMultipleImages && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center items-center gap-1.5 md:hidden z-10 pointer-events-none">
            {normalizedImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleThumbnailClick(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-pressed={index === selectedIndex}
                className="group relative inline-flex items-center justify-center p-1 pointer-events-auto cursor-pointer focus:outline-none"
              >
                <span
                  className={cn(
                    'rounded-full transition-all duration-300 pointer-events-none block shadow-xs',
                    index === selectedIndex
                      ? 'w-4 h-1.5 bg-primary'
                      : 'size-1.5 bg-background border-[1.5px] border-primary/60 group-hover:bg-primary/20'
                  )}
                />
              </button>
            ))}
          </div>
        )}

        {/* Full View Button */}
        {normalizedImages.length > 0 && (
          <Dialog>
            <DialogTrigger 
              className="absolute bottom-3 right-3 z-20 pointer-events-auto flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm border border-border/40 text-foreground hover:bg-white hover:scale-105 active:scale-95 transition-all md:bottom-4 md:right-4 md:size-9"
              title="View Full Size"
            >
              <Maximize2 className="size-4" />
            </DialogTrigger>
            <DialogContent className="max-w-[100vw] h-[100dvh] sm:max-w-4xl sm:h-[90vh] p-0 bg-black border-none shadow-none [&>button]:text-black [&>button]:bg-white/80 [&>button]:hover:bg-white [&>button]:size-10 [&>button]:top-4 [&>button]:right-4 z-[510]">
              <div className="relative size-full flex items-center justify-center rounded-none overflow-hidden bg-white">
                <Image
                  src={optimizeCloudinaryUrl(normalizedImages[selectedIndex]?.url || normalizedImages[selectedIndex], CLOUDINARY_IMAGE_PRESETS.productModal)}
                  alt="Full view"
                  fill
                  sizes="100vw"
                  className="object-contain" 
                  draggable={false} 
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {hasMultipleImages ? (
        <Carousel
          setApi={setThumbsApi}
          opts={thumbsOptions}
          className="hidden w-full md:block"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {normalizedImages.map((image, index) => (
              <CarouselItem
                key={index}
                className="basis-[31.25%] pl-3 md:basis-[33.33%] md:pl-4"
              >
                <button
                  type="button"
                  onClick={() => handleThumbnailClick(index)}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={index === selectedIndex}
                  className={`relative block aspect-square w-full min-w-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-[opacity,transform,border-color,box-shadow] duration-300 ease-out ${
                    index === selectedIndex
                      ? 'border-primary shadow-sm shadow-primary/30 opacity-100'
                      : 'border-transparent opacity-60 hover:scale-[1.02] hover:opacity-100'
                  }`}
                >
                  <div className="absolute inset-0 bg-white" />
                  <Image
                    src={optimizeCloudinaryUrl(image.url, CLOUDINARY_IMAGE_PRESETS.productGalleryThumb)}
                    alt={`${product?.Name || product?.name || 'Product'} thumbnail ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 20vw"
                    className="object-contain"
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
