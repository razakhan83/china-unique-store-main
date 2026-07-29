'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Armchair,
  Beef,
  Bolt,
  Car,
  Dumbbell,
  Flame,
  Gamepad2,
  Heart,
  PawPrint,
  PenTool,
  Shirt,
  Tag,
  UtensilsCrossed,
} from 'lucide-react';
import { getCategoryColorByIndex } from '@/lib/categoryColors';
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { getBlurPlaceholderProps } from '@/lib/imagePlaceholder';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS = {
  'kitchen accessories': UtensilsCrossed,
  kitchen: Flame,
  knives: UtensilsCrossed,
  pots: Beef,
  'home decor': Armchair,
  'health & beauty': Heart,
  stationery: PenTool,
  'toys & games': Gamepad2,
  electronics: Bolt,
  fashion: Shirt,
  'sports & fitness': Dumbbell,
  'pet supplies': PawPrint,
  automotive: Car,
};

export function getCategoryIcon(name) {
  return CATEGORY_ICONS[(name || '').toLowerCase().trim()] || Tag;
}

export default function CategoryPillCard({ category, index = 0, href }) {
  const colors = getCategoryColorByIndex(index);
  const Icon = getCategoryIcon(category.name || category.label);

  const img1 = category.image
    ? optimizeCloudinaryUrl(category.image, CLOUDINARY_IMAGE_PRESETS.categoryCircle)
    : '';
  const img2 = category.secondaryImage
    ? optimizeCloudinaryUrl(category.secondaryImage, CLOUDINARY_IMAGE_PRESETS.categoryCircle)
    : '';
  const img3 = category.tertiaryImage
    ? optimizeCloudinaryUrl(category.tertiaryImage, CLOUDINARY_IMAGE_PRESETS.categoryCircle)
    : '';

  const images = [img1, img2, img3].filter(Boolean);
  const hasThreeImages = Boolean(img1 && img2 && img3);
  const hasTwoImages = !hasThreeImages && images.length === 2;
  const hasOneImage = images.length === 1;
  const targetHref = href || `/products?category=${category.id || category._id}`;

  return (
    <Link
      href={targetHref}
      className="group flex w-full h-full flex-col items-center justify-start text-center select-none pt-8 md:pt-10"
    >
      {/* Main Container - Faded Background Box (Vertical Gradient) */}
      <div
        className={cn(
          'relative flex items-center justify-center w-3/4 md:w-2/3 aspect-square mx-auto rounded-3xl',
          'transition-all duration-300 ease-out border-none'
        )}
        style={{
          // Use selected category color or fallback to colors.hex, passed as CSS variable
          '--cat-color': category.bgColor || colors.hex,
          background: 'linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--cat-color) 40%, transparent) 50%, var(--cat-color) 100%)',
        }}
      >
        {/* Inner Container for Images */}
        <div className="absolute inset-0 z-10 flex items-center justify-center transition-transform duration-300 ease-in-out group-hover:scale-[1.12] group-hover:-translate-y-3">
          {hasThreeImages ? (
            <>
              {/* Left Image (Pot) */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/3 z-10 w-1/2 h-1/2 -rotate-12 transition-transform duration-500 group-hover:-rotate-45 group-hover:-translate-x-2">
                <Image src={img2} alt="Category" fill className="object-contain drop-shadow-md" {...getBlurPlaceholderProps(category.secondaryBlurDataURL)} />
              </div>
              
              {/* Center Image (Grinder) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-2/3 z-20 w-3/5 h-3/5 transition-transform duration-500 group-hover:-translate-y-3 group-hover:scale-105">
                <Image src={img1} alt="Category" fill className="object-contain drop-shadow-xl" {...getBlurPlaceholderProps(category.blurDataURL)} />
              </div>

              {/* Right Image (Spatula) */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/3 z-10 w-1/2 h-1/2 rotate-12 transition-transform duration-500 group-hover:rotate-45 group-hover:translate-x-2">
                <Image src={img3} alt="Category" fill className="object-contain drop-shadow-md" {...getBlurPlaceholderProps(category.tertiaryBlurDataURL)} />
              </div>
            </>
          ) : hasTwoImages ? (
            <>
              {/* Left Image */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-3/5 h-3/5 -rotate-6 transition-transform duration-500 group-hover:-rotate-12 group-hover:-translate-x-1">
                <Image src={img1 || images[0]} alt="Category" fill className="object-contain drop-shadow-md" {...getBlurPlaceholderProps(category.blurDataURL)} />
              </div>
              {/* Right Image */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-3/5 h-3/5 rotate-6 transition-transform duration-500 group-hover:rotate-12 group-hover:translate-x-1">
                <Image src={img2 || images[1]} alt="Category" fill className="object-contain drop-shadow-md" {...getBlurPlaceholderProps(category.secondaryBlurDataURL || category.blurDataURL)} />
              </div>
            </>
          ) : hasOneImage ? (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 transition-transform duration-500 group-hover:scale-105">
              <Image
                src={images[0]}
                alt={category.name || category.label || 'Category'}
                fill
                className="object-contain drop-shadow-xl"
                {...getBlurPlaceholderProps(category.blurDataURL || category.secondaryBlurDataURL)}
              />
            </div>
          ) : (
            <Icon className="w-[60%] h-[60%] drop-shadow-md" style={{ color: colors.accent }} />
          )}
        </div>
      </div>

      {/* Category Name Label */}
      <span className="mt-4 mb-1 line-clamp-2 text-[13px] md:text-sm font-semibold leading-tight text-foreground/80 transition-colors group-hover:text-primary">
        {category.name || category.label}
      </span>
    </Link>
  );
}
