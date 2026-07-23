import { cache, Suspense } from 'react';
import { Star } from 'lucide-react';
import { notFound } from 'next/navigation';

import CategoryProductSlider from '@/components/CategoryProductSlider';
import ProductCard from '@/components/ProductCard';
import ProductActions, { ProductSocialActions } from '@/components/ProductActions';
import ProductDescription from '@/components/ProductDescription';
import ProductDetailsTabs from '@/components/ProductDetailsTabs';
import ProductGallery from '@/components/ProductGallery';
import ProductViewTracking from '@/components/ProductViewTracking';
import ProductPageScrollReset from '@/components/ProductPageScrollReset';
import ProductMetaTags from './ProductMetaTags';
import ProductReviews from '@/components/ProductReviews';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { getProductBySlug, getProductPrerenderParams, getProductReviewSummary, getRelatedProducts, getStoreSettings } from '@/lib/data';
import { getCategoryColor } from '@/lib/categoryColors';
import { getProductCategories } from '@/lib/productCategories';
import { getProductTagById } from '@/lib/productTags';
import { formatRichTextDescriptionHtml, stripHtmlTags } from '@/lib/richText';
import { getSiteUrl } from '@/lib/siteUrl';
import { cn } from '@/lib/utils';

const formatPrice = (raw) => `Rs. ${Number(raw || 0).toLocaleString('en-PK')}`;
const getSellingPrice = (product) =>
  Number(product.discountedPrice ?? product.Price ?? 0);
const getVisibleCompareAtPrice = (product) => {
  const compareAtPrice = Number(product.compareAtPrice ?? 0);
  const sellingPrice = getSellingPrice(product);

  return compareAtPrice > sellingPrice ? compareAtPrice : null;
};
const siteUrl = getSiteUrl();
const PRODUCT_PRERENDER_LIMIT = 48;
const EMPTY_REVIEW_SUMMARY = {
  averageRating: 0,
  reviewCount: 0,
};

function getProductUrl(product) {
  return `${siteUrl}/products/${product.slug || product._id}`;
}

function getProductDescription(product) {
  return (
    product.seoDescription ||
    stripHtmlTags(product.Description) ||
    `Buy ${product.Name} from China Unique Store.`
  );
}

function getProductTitle(product) {
  return product.seoTitle || product.Name;
}

function getCanonicalUrl(product) {
  const canonicalUrl = product.seoCanonicalUrl?.trim();
  if (canonicalUrl) {
    return canonicalUrl;
  }

  return getProductUrl(product);
}

function getProductKeywords(product, categories) {
  const keywords = (product.seoKeywords || '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  if (keywords.length > 0) {
    return keywords;
  }

  return [product.Name, ...categories.map((category) => category.name).filter(Boolean)];
}

function getShareDescription(product) {
  const price = getSellingPrice(product);
  return `Price: ${formatPrice(price)}. ${getProductDescription(product)}`;
}

function getPrimaryImage(product) {
  return product.Images?.[0]?.url || `${siteUrl}/opengraph-image`;
}

function getProductJsonLd({ product, reviewSummary = null }) {
  const categories = getProductCategories(product);
  const categoryNames = categories.map((category) => category.name).filter(Boolean);
  const keywords = getProductKeywords(product, categories);
  const price = getSellingPrice(product);
  const productTitle = getProductTitle(product);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productTitle,
    description: getProductDescription(product),
    image: product.Images?.map((image) => image.url).filter(Boolean) || [],
    sku: product.slug || product._id,
    category: categoryNames[0] || undefined,
    keywords: keywords.join(', '),
    brand: {
      '@type': 'Brand',
      name: 'China Unique Store',
    },
    offers: {
      '@type': 'Offer',
      url: getCanonicalUrl(product),
      priceCurrency: 'PKR',
      price,
      availability:
        product.StockStatus === 'In Stock'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  if (reviewSummary?.reviewCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(reviewSummary.averageRating.toFixed(1)),
      reviewCount: reviewSummary.reviewCount,
    };
  }

  return jsonLd;
}

async function getProductPageData(slug) {
  const product = await getProductBySlug(slug);
  if (!product) return null;

  const settings = await getStoreSettings();

  return {
    product,
    settings,
  };
}

async function getProductReviewSummarySafe(productId) {
  try {
    return await getProductReviewSummary(productId);
  } catch (error) {
    console.error(`[storefront/product] review summary fallback for ${productId}:`, error.message);
    return EMPTY_REVIEW_SUMMARY;
  }
}

async function getRelatedProductsSafe(input) {
  try {
    return await getRelatedProducts(input);
  } catch (error) {
    console.error(
      `[storefront/product] related products fallback for ${input?.excludeSlug || 'unknown-product'}:`,
      error.message,
    );
    return [];
  }
}

const getCachedProductPageData = cache(async (slug) => getProductPageData(slug));
const getCachedProductBySlug = cache(async (slug) => getProductBySlug(slug));

export async function generateStaticParams() {
  return getProductPrerenderParams(PRODUCT_PRERENDER_LIMIT);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getCachedProductBySlug(id);

  if (!product) {
    return {
      title: 'Product not found',
    };
  }

  const reviewSummary = await getProductReviewSummarySafe(product._id);
  const categories = getProductCategories(product);
  const productTitle = getProductTitle(product);
  const productUrl = getCanonicalUrl(product);
  const productImage = getPrimaryImage(product);
  const shareDescription = getShareDescription(product);
  const keywords = getProductKeywords(product, categories);
  const price = Number(product.discountedPrice ?? product.Price ?? 0);
  const availability = product.StockStatus === 'In Stock' ? 'in stock' : 'out of stock';

  return {
    title: productTitle,
    description: shareDescription,
    keywords,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: productTitle,
      description: shareDescription,
      type: 'website',
      url: productUrl,
      siteName: 'China Unique Store',
      images: [
        {
          url: productImage,
          width: 1200,
          height: 630,
          alt: productTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: productTitle,
      description: shareDescription,
      images: [productImage],
    },
    other: {
      'product:price:amount': String(price),
      'product:price:currency': 'PKR',
      'product:availability': availability,
      ...(reviewSummary.reviewCount > 0
        ? {
            'product:rating:value': reviewSummary.averageRating.toFixed(1),
            'product:rating:count': String(reviewSummary.reviewCount),
          }
        : {}),
    },
  };
}

export default function ProductPage({ params }) {
  return (
    <div className="product-detail-shell min-h-screen bg-gray-50">
      <ProductPageScrollReset />

      <div className="container mx-auto max-w-7xl px-4 pb-1 pt-3 md:pt-7">
        <Suspense fallback={<ProductBreadcrumbSkeleton />}>
          <ProductBreadcrumb paramsPromise={params} />
        </Suspense>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-[calc(env(safe-area-inset-bottom)+var(--mobile-bottom-nav-offset)+3.5rem)] pt-1 md:pb-8 md:pt-4">
        <Suspense fallback={<ProductHeroSkeleton />}>
          <ProductHeroSection paramsPromise={params} />
        </Suspense>

        <Suspense fallback={<div className="mt-10 h-64 w-full animate-pulse rounded-xl bg-muted md:mt-16" />}>
          <ProductTabsWrapper paramsPromise={params} />
        </Suspense>
      </div>

      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProductsSection paramsPromise={params} />
      </Suspense>
    </div>
  );
}


async function ProductBreadcrumb({ paramsPromise }) {
  const { id: slug } = await paramsPromise;
  const pageData = await getCachedProductPageData(slug);

  if (!pageData?.product) {
    notFound();
  }

  const product = pageData.product;
  const primaryCategory = getProductCategories(product)[0];

  return (
    <Breadcrumb className="overflow-x-auto">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/products">Products</BreadcrumbLink>
        </BreadcrumbItem>
        {primaryCategory ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/products?category=${primaryCategory.id}`}>
                {primaryCategory.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        ) : null}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{pageData.product.Name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

async function ProductHeroSection({ paramsPromise }) {
  const { id: slug } = await paramsPromise;
  const pageData = await getCachedProductPageData(slug);

  if (!pageData) {
    notFound();
  }

  const { product, settings } = pageData;

  const primaryCategory = getProductCategories(product)[0];
  const categoryLabel = primaryCategory?.name || '';
  const reviewSummary = await getProductReviewSummarySafe(product._id);
  const colors = getCategoryColor(categoryLabel); // colors contains bg, text, etc.
  const productJsonLd = getProductJsonLd({ product });
  const price = getSellingPrice(product);
  const availability = product.StockStatus === 'In Stock' ? 'in stock' : 'out of stock';
  const isOutOfStock = product.StockStatus === 'Out of Stock' || product.showOnStore === false;
  const compareAtPrice = getVisibleCompareAtPrice(product);
  const descriptionHtml =
    formatRichTextDescriptionHtml(product.Description) ||
    'Discover the perfect addition to your collection. This premium item from China Unique Store is crafted with quality and elegance in mind.';

  return (
    <>
      <ProductMetaTags
        price={price}
        currency="PKR"
        availability={availability}
      />
      <ProductViewTracking
        enabled={settings.trackingEnabled === true}
        facebookPixelId={settings.facebookPixelId}
        tiktokPixelId={settings.tiktokPixelId}
        productId={product.slug || product._id}
        name={product.Name}
        category={categoryLabel || 'Product'}
        value={price}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-8 lg:gap-10">
        <div className="w-full md:w-[45%] lg:w-[42%]">
          <ProductGallery images={product.Images} primaryTag={product.primaryTag} />
        </div>

        <div className="w-full md:w-[55%] lg:w-[58%]">
          <div className="flex flex-col gap-4 md:gap-6 md:sticky md:top-[164px]">
            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[11px] sm:text-xs font-medium px-2.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground hover:bg-muted/80 border-0 shadow-sm">
                  {categoryLabel || 'Premium Item'}
                </Badge>
                {isOutOfStock ? (
                  <Badge variant="destructive" className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-md shadow-sm border-0">
                    Out of Stock
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-md border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-sm tracking-wide">
                    In Stock
                  </Badge>
                )}
              </div>

              <div className="flex items-start justify-between gap-4">
                <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-2xl md:text-4xl leading-tight sm:leading-tight md:leading-tight">
                  {product.Name}
                </h1>
                <ProductSocialActions product={product} className="md:hidden shrink-0 mt-0.5" />
              </div>

              {Array.isArray(product.tags) && product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {product.tags.filter(tagId => tagId !== product.primaryTag).map(tagId => {
                    const tag = getProductTagById(tagId);
                    if (!tag) return null;
                    const Icon = tag.icon;
                    return (
                      <Badge 
                        key={tag.id}
                        variant="outline" 
                        className={cn("text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md border-0 shadow-sm flex items-center gap-1.5", tag.bgColor, tag.color)}
                      >
                        <Icon className="size-3.5" />
                        {tag.label}
                      </Badge>
                    );
                  })}
                </div>
              )}

              <a 
                href="#product-reviews"
                className="flex items-center gap-2 group w-fit -mt-1"
              >
                 <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-4 ${i < Math.round(reviewSummary.averageRating || 0) ? 'fill-current' : 'text-muted-foreground/30'}`} />
                    ))}
                 </div>
                 <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                   ({reviewSummary.reviewCount} reviews)
                 </span>
              </a>

              <div className="hidden">
                {/* Static price block moved to ProductActions for dynamic pack options */}
              </div>
            </div>

            <div className="pt-2">
              <ProductActions 
                product={product} 
                whatsappNumber={settings.whatsappNumber} 
                storeName={settings.storeName} 
                basePrice={price}
                compareAtPrice={compareAtPrice}
              />
            </div>

            {product.shortDescription ? (
              <div
                className="text-base leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 border-t border-border pt-6 mt-6"
                dangerouslySetInnerHTML={{ __html: product.shortDescription }}
              />
            ) : <Separator className="my-6" />}
          </div>
        </div>
      </div>
    </>
  );
}

async function ProductTabsWrapper({ paramsPromise }) {
  const { id: slug } = await paramsPromise;
  const pageData = await getCachedProductPageData(slug);

  if (!pageData?.product) {
    return null;
  }

  const product = pageData.product;
  const reviewSummary = await getProductReviewSummarySafe(product._id);
  const descriptionHtml =
    formatRichTextDescriptionHtml(product.Description) ||
    'Discover the perfect addition to your collection. This premium item from China Unique Store is crafted with quality and elegance in mind.';

  return (
    <div id="product-reviews" className="scroll-mt-24 md:scroll-mt-32">
      <ProductDetailsTabs
        reviewCount={reviewSummary.reviewCount}
        descriptionContent={<ProductDescription html={descriptionHtml} />}
        reviewsContent={<ProductReviews productId={product._id} productName={product.Name} />}
      />
    </div>
  );
}

async function RelatedProductsSection({ paramsPromise }) {
  const { id: slug } = await paramsPromise;
  const pageData = await getCachedProductPageData(slug);

  if (!pageData?.product) {
    notFound();
  }

  const product = pageData.product;

  const primaryCategory = getProductCategories(product)[0];
  const categorySlug = primaryCategory?.id || '';
  const relatedProducts = await getRelatedProductsSafe({
    category: categorySlug,
    excludeSlug: product.slug,
    limit: 8,
  });

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border bg-primary/5 py-8 md:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <CategoryProductSlider
          categoryLabel="You May Also Like"
          kicker="More to Explore"
          viewAllHref={primaryCategory ? `/products?category=${primaryCategory.id}` : '/products'}
        >
          {relatedProducts.map((product, index) => (
            <ProductCard
              key={`${product.slug || product._id || product.id || 'item'}-${index}`}
              product={product}
              className="h-full shadow-none"
            />
          ))}
        </CategoryProductSlider>
      </div>
    </div>
  );
}

function ProductBreadcrumbSkeleton() {
  return <Skeleton className="h-4 w-52 rounded-md" />;
}

function ProductHeroSkeleton() {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-8 lg:gap-10">
      <div className="w-full md:w-[55%] lg:w-[58%]">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-20 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="w-full md:w-[45%] lg:w-[42%]">
        <div className="flex flex-col gap-4 md:sticky md:top-[164px]">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-10 w-3/4 rounded-lg" />
          <Skeleton className="h-12 w-40 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductReviewsSkeleton() {
  return (
    <div className="rounded-2xl border border-border p-6 md:p-8">
      <Skeleton className="mb-4 h-8 w-48 rounded-lg" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function RelatedProductsSkeleton() {
  return (
    <div className="border-t border-border bg-muted/35 py-10 md:py-14">
      <div className="container mx-auto max-w-7xl px-4">
        <Skeleton className="mb-6 h-8 w-56 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
