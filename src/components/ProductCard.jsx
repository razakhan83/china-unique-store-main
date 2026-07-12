'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import ProductCardAddToCartButton from "@/components/ProductCardAddToCartButton";
import ProductCardWishlistSlot from "@/components/ProductCardWishlistSlot";
import { Skeleton } from "@/components/ui/skeleton";
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from "@/lib/cloudinaryImage";
import { normalizeProductImages } from "@/lib/productImages";
import { getBlurPlaceholderProps } from "@/lib/imagePlaceholder";

const formatPrice = (raw) => {
  let cleanNumbers = String(raw).replace(/[^\d.]/g, "");
  if (!cleanNumbers) return "Rs. 0";
  return `Rs. ${Number(cleanNumbers).toLocaleString("en-PK")}`;
};

function getSellingPrice(product) {
  const productPrice = Number(product.Price || product.price || 0);

  if (product.isDiscounted && product.discountPercentage > 0) {
    return product.discountedPrice != null
      ? Number(product.discountedPrice)
      : Math.round(productPrice * (1 - product.discountPercentage / 100));
  }

  return productPrice;
}

function getVisibleCompareAtPrice(product, sellingPrice) {
  const compareAtPrice = Number(product.compareAtPrice ?? 0);
  return compareAtPrice > sellingPrice ? compareAtPrice : null;
}

function getDiscountBadge(product) {
  if (product.isDiscounted && product.discountPercentage > 0) {
    return `${product.discountPercentage}% OFF`;
  }
  return null;
}

function getFeatureBadge(product) {
  if (product.isBestSelling) {
    return {
      label: "Best Seller",
      className:
        "pointer-events-auto rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 uppercase tracking-[0.08em]",
    };
  }

  return null;
}

export default function ProductCard({ product, className = "" }) {
  const productName = product.Name || product.name || "Unknown";
  const normalizedImages = normalizeProductImages(product?.Images);
  const primaryImage = normalizedImages[0] || null;
  const secondaryImage = normalizedImages[1] || null;

  const primaryImageSrc = primaryImage?.url
    ? optimizeCloudinaryUrl(primaryImage.url, CLOUDINARY_IMAGE_PRESETS.productCard)
    : "";
  const secondaryImageSrc = secondaryImage?.url
    ? optimizeCloudinaryUrl(secondaryImage.url, CLOUDINARY_IMAGE_PRESETS.productCard)
    : "";
  const productPrice = product.Price || product.price || 0;
  const sellingPrice = getSellingPrice(product);
  const compareAtPrice = getVisibleCompareAtPrice(product, sellingPrice);
  const productSlug = product.slug || product._id || product.id;
  const productHref = `/products/${productSlug}`;

  const router = useRouter();
  const [primaryLoaded, setPrimaryLoaded] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);

  const discountLabel = getDiscountBadge(product);
  const featureBadge = getFeatureBadge(product);
  const reviewCount = Number(product.reviewCount || 0);
  const averageRating = Number(product.averageRating || 0);
  const ratingLabel = reviewCount > 0 && averageRating > 0 ? averageRating.toFixed(1) : "";
  const isUnavailable = product.StockStatus === "Out of Stock" || product.showOnStore === false;

  return (
    <Card
      className={cn(
        "@container product-card-surface group relative flex flex-col h-full gap-0 overflow-hidden rounded-xl border border-border bg-card hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out",
        "py-0",
        className
      )}
      draggable={false}
    >
      <div className="relative">
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
          {ratingLabel ? (
            <Badge
              className={cn(
                "pointer-events-auto rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700 tabular-nums"
              )}
            >
              <Star className="mr-1 size-3.5 fill-current" />
              {ratingLabel}
            </Badge>
          ) : null}

          {featureBadge && (
            <Badge className={cn(featureBadge.className)}>
              {featureBadge.label}
            </Badge>
          )}

          {discountLabel && (
            <Badge
              className={cn(
                "pointer-events-auto rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 uppercase tracking-[0.08em]"
              )}
            >
              {discountLabel}
            </Badge>
          )}

          {isUnavailable && (
            <Badge
              className={cn(
                "pointer-events-auto rounded-full border-transparent bg-zinc-900/90 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-[0.1em] shadow-sm backdrop-blur-md"
              )}
            >
              Out of Stock
            </Badge>
          )}
        </div>

        <ProductCardWishlistSlot product={product} />

        <Link
          href={productHref}
          scroll={true}
          className="relative block aspect-square w-full overflow-hidden bg-muted/30"
          draggable={false}
        >
          {primaryImageSrc ? (
            <>
              {!primaryImage.blurDataURL && !primaryLoaded && (
                <Skeleton className="absolute inset-0 z-0 rounded-none bg-muted/60" />
              )}
              <Image
                src={primaryImageSrc}
                alt={productName}
                fill
                draggable={false}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                onLoad={() => setPrimaryLoaded(true)}
                className={cn(
                  "object-cover outline outline-1 outline-black/5 transition-all duration-500 ease-out transform-gpu",
                  (!primaryImage.blurDataURL && !primaryLoaded) ? "opacity-0" : "opacity-100",
                  "md:group-hover:scale-105",
                  isUnavailable && "scale-[1.01] saturate-[0.85] opacity-75",
                  secondaryImageSrc && "md:group-hover:opacity-0"
                )}
                {...getBlurPlaceholderProps(primaryImage.blurDataURL)}
              />
              {secondaryImageSrc && (
                <>
                  {!secondaryImage.blurDataURL && !secondaryLoaded && (
                    <Skeleton className="absolute inset-0 z-0 rounded-none bg-muted/60 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  <Image
                    src={secondaryImageSrc}
                    alt={`${productName} alternate view`}
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="lazy"
                    onLoad={() => setSecondaryLoaded(true)}
                    className={cn(
                      "object-cover outline outline-1 outline-black/5 transition-all duration-500 ease-out absolute inset-0 opacity-0",
                      (!secondaryImage.blurDataURL && !secondaryLoaded) ? "opacity-0" : "",
                      "md:group-hover:opacity-100 md:group-hover:scale-105",
                      isUnavailable && "scale-[1.01] saturate-[0.85]"
                    )}
                    {...getBlurPlaceholderProps(secondaryImage.blurDataURL)}
                  />
                </>
              )}
            </>
          ) : (
            <div className="flex size-full items-center justify-center bg-muted/50">
              <ShoppingCart className="size-10 text-muted-foreground/30" />
            </div>
          )}
        </Link>
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 bg-card px-3 pb-3 pt-3 @max-[220px]:p-2.5 @max-[220px]:gap-1.5 sm:p-4">
          <>
            <Link
              href={productHref}
              scroll={true}
              className="block text-left"
              draggable={false}
            >
              <h3
                className="line-clamp-2 text-[14px] font-semibold leading-[1.2rem] text-foreground/90 @min-[260px]:text-[15px]"
                title={productName}
                draggable={false}
              >
                {productName}
              </h3>
            </Link>

            <div className="mt-auto flex items-end justify-between gap-2 pt-1 @max-[220px]:gap-1.5">
              <div className="flex min-w-0 flex-col justify-end gap-0.5">
                {compareAtPrice ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p
                      className="text-[15px] font-bold leading-none text-black tabular-nums @min-[260px]:text-[17px]"
                      draggable={false}
                    >
                      {formatPrice(sellingPrice)}
                    </p>
                    <p
                      className="text-[11px] font-medium leading-none text-muted-foreground/75 line-through @min-[260px]:text-[13px]"
                      draggable={false}
                    >
                      {formatPrice(compareAtPrice)}
                    </p>
                  </div>
                ) : (
                  <p
                    className="text-[15px] font-bold leading-none text-black tabular-nums @min-[260px]:text-[17px]"
                    draggable={false}
                  >
                    {formatPrice(sellingPrice)}
                  </p>
                )}
              </div>
              <ProductCardAddToCartButton product={product} isOutOfStock={isUnavailable} />
            </div>
          </>
      </CardContent>
    </Card>
  );
}
