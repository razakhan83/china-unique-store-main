import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import ProductCardAddToCartButton from "@/components/ProductCardAddToCartButton";
import ProductCardWishlistSlot from "@/components/ProductCardWishlistSlot";
import { CLOUDINARY_IMAGE_PRESETS, optimizeCloudinaryUrl } from "@/lib/cloudinaryImage";
import { getPrimaryProductImage } from "@/lib/productImages";
import { getBlurPlaceholderProps } from "@/lib/imagePlaceholder";

const formatPrice = (raw) => {
  let cleanNumbers = String(raw).replace(/[^\d.]/g, "");
  if (!cleanNumbers) return "Rs. 0";
  return `Rs. ${Number(cleanNumbers).toLocaleString("en-PK")}`;
};

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
        "pointer-events-auto rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 uppercase tracking-[0.08em]",
    };
  }

  return null;
}

export default function ProductCard({ product, className = "" }) {
  const productName = product.Name || product.name || "Unknown";
  const primaryImage = getPrimaryProductImage(product);
  const primaryImageSrc = primaryImage?.url
    ? optimizeCloudinaryUrl(primaryImage.url, CLOUDINARY_IMAGE_PRESETS.productCard)
    : "";
  const productPrice = product.Price || product.price || 0;
  const productSlug = product.slug || product._id || product.id;
  const productHref = `/products/${productSlug}`;

  const discountLabel = getDiscountBadge(product);
  const featureBadge = getFeatureBadge(product);
  const reviewCount = Number(product.reviewCount || 0);
  const averageRating = Number(product.averageRating || 0);
  const ratingLabel = reviewCount > 0 && averageRating > 0 ? averageRating.toFixed(1) : "";
  const isUnavailable = product.StockStatus === "Out of Stock" || product.isLive === false;

  const hasRealDiscount = Boolean(product.isDiscounted && product.discountPercentage > 0);
  const discountedPrice = hasRealDiscount
    ? (product.discountedPrice != null
        ? product.discountedPrice
        : Math.round(productPrice * (1 - product.discountPercentage / 100)))
    : null;

  return (
    <Card
      className={cn(
        "product-card-surface group relative flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-300 md:hover:shadow-md",
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
        </div>

        <ProductCardWishlistSlot product={product} />

        <Link
          href={productHref}
          scroll={true}
          className="relative block aspect-square w-full overflow-hidden bg-muted/30"
          draggable={false}
        >
          {primaryImageSrc ? (
            <Image
              src={primaryImageSrc}
              alt={productName}
              fill
              draggable={false}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              className={cn(
                "object-cover outline outline-1 outline-black/5 transition-transform duration-500 ease-out md:group-hover:scale-105",
                isUnavailable && "scale-[1.01] saturate-[0.85] opacity-75"
              )}
              {...getBlurPlaceholderProps(primaryImage.blurDataURL)}
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted/50">
              <ShoppingCart className="size-10 text-muted-foreground/30" />
            </div>
          )}
        </Link>
      </div>

      <CardContent className="flex min-h-[6.25rem] flex-1 flex-col gap-2 bg-card px-3 pb-3 pt-3 sm:min-h-0 sm:gap-2 sm:p-4 sm:pt-4">
        <Link
          href={productHref}
          scroll={true}
          className="block text-left"
          draggable={false}
        >
          <h3
            className="line-clamp-2 min-h-9 text-[13px] font-semibold leading-[1.15rem] text-primary/80 sm:line-clamp-1 sm:min-h-5 sm:text-[15px] sm:leading-5"
            title={productName}
            draggable={false}
          >
            {productName}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1 sm:gap-3 sm:pt-0">
          <div className="flex min-w-0 min-h-[2.4rem] flex-col justify-end gap-0.5 sm:min-h-[2.75rem]">
            {hasRealDiscount ? (
              <div className="flex flex-col items-start justify-end gap-1">
                <p
                  className="text-xs font-medium leading-none text-muted-foreground/75 line-through sm:text-sm"
                  draggable={false}
                >
                  {formatPrice(productPrice)}
                </p>
                <p
                  className="text-lg font-semibold leading-none text-foreground tabular-nums sm:text-xl"
                  draggable={false}
                >
                  {formatPrice(discountedPrice)}
                </p>
              </div>
            ) : (
              <p
                className="pb-0.5 text-lg font-semibold leading-none text-foreground tabular-nums sm:pb-0 sm:text-xl"
                draggable={false}
              >
                {formatPrice(productPrice)}
              </p>
            )}
          </div>
          <ProductCardAddToCartButton product={product} isOutOfStock={isUnavailable} />
        </div>
      </CardContent>
    </Card>
  );
}
