import { cache, Suspense } from 'react';
import { BadgeCheck, PackageCheck, Truck } from 'lucide-react';
import { notFound } from 'next/navigation';

import CategoryProductSlider from '@/components/CategoryProductSlider';
import ProductCard from '@/components/ProductCard';
import ProductActions, { ProductSocialActions } from '@/components/ProductActions';
import ProductGallery from '@/components/ProductGallery';
import ProductViewTracking from '@/components/ProductViewTracking';
import ProductPageScrollReset from '@/components/ProductPageScrollReset';
import ProductMetaTags from './ProductMetaTags';
import ProductReviews from '@/components/ProductReviews';
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
import { formatRichTextDescriptionHtml, stripHtmlTags } from '@/lib/richText';
import { getSiteUrl } from '@/lib/siteUrl';

const formatPrice = (raw) => `Rs. ${Number(raw || 0).toLocaleString('en-PK')}`;
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
  const price = product.discountedPrice ?? product.Price ?? 0;
  return `Price: ${formatPrice(price)}. ${getProductDescription(product)}`;
}

function getPrimaryImage(product) {
  return product.Images?.[0]?.url || `${siteUrl}/opengraph-image`;
}

function getProductJsonLd({ product, reviewSummary = null }) {
  const categories = getProductCategories(product);
  const categoryNames = categories.map((category) => category.name).filter(Boolean);
  const keywords = getProductKeywords(product, categories);
  const price = Number(product.discountedPrice ?? product.Price ?? 0);
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
    <div className="product-detail-shell min-h-screen bg-background">
      <ProductPageScrollReset />

      <div className="container mx-auto max-w-7xl px-4 pb-2 pt-5 md:pt-7">
        <Suspense fallback={<ProductBreadcrumbSkeleton />}>
          <ProductBreadcrumb paramsPromise={params} />
        </Suspense>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-[calc(env(safe-area-inset-bottom)+var(--mobile-bottom-nav-offset)+3.5rem)] pt-2 md:pb-8 md:pt-4">
        <Suspense fallback={<ProductHeroSkeleton />}>
          <ProductHeroSection paramsPromise={params} />
        </Suspense>

        <Suspense fallback={<ProductReviewsSkeleton />}>
          <ProductReviewsSection paramsPromise={params} />
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
  const colors = getCategoryColor(categoryLabel);
  const productJsonLd = getProductJsonLd({ product });
  const price = Number(product.discountedPrice ?? product.Price ?? 0);
  const availability = product.StockStatus === 'In Stock' ? 'in stock' : 'out of stock';
  const isOutOfStock = product.StockStatus === 'Out of Stock' || product.isLive === false;
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

      <div className="flex flex-col gap-5 md:flex-row md:gap-8 lg:gap-10">
        <div className="w-full md:w-[55%] lg:w-[58%]">
          <ProductGallery images={product.Images} />
        </div>

        <div className="w-full md:w-[45%] lg:w-[42%]">
          <div className="flex flex-col gap-4 md:sticky md:top-24">
            <div>
              <Badge variant="outline" className={`${colors.badge} text-xs font-bold uppercase tracking-wider`}>
                {categoryLabel || 'Premium Item'}
              </Badge>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-start gap-3">
                <h1 className="text-xl font-medium tracking-tight text-foreground md:text-2xl lg:text-3xl">
                  {product.Name}
                </h1>
                {isOutOfStock ? (
                  <Badge variant="destructive" className="rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.14em]">
                    Out of Stock
                  </Badge>
                ) : null}
              </div>
              <ProductSocialActions product={product} className="md:hidden shrink-0" />
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5">
              {product.isDiscounted && product.discountPercentage > 0 ? (
                <>
                  <span className="text-xl font-normal text-black md:text-2xl">
                    {formatPrice(product.discountedPrice != null ? product.discountedPrice : Math.round(product.Price * (1 - product.discountPercentage / 100)))}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground line-through">
                    {formatPrice(product.Price)}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
                    {product.discountPercentage}% OFF
                  </span>
                </>
              ) : (
                <span className="text-xl font-normal text-black md:text-2xl">
                  {formatPrice(product.Price)}
                </span>
              )}
            </div>

            <Separator />
            <ProductActions product={product} whatsappNumber={settings.whatsappNumber} storeName={settings.storeName} />

            <div className="mt-1 border-t border-border pt-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 p-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <PackageCheck className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">Purchased</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 p-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Truck className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">Dispatch</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 p-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BadgeCheck className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">Delivered</span>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="pt-1">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Description
              </h2>
              <div className="text-[15px] leading-relaxed text-muted-foreground">
                <div
                  className="[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_img]:my-4 [&_img]:max-w-full [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-2xl [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_video]:my-4 [&_video]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

async function ProductReviewsSection({ paramsPromise }) {
  const { id: slug } = await paramsPromise;
  const product = await getCachedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const reviewSummary = await getProductReviewSummarySafe(product._id);

  if (reviewSummary.reviewCount === 0) {
    return null;
  }

  return (
    <div className="mb-4 mt-8">
      <ProductReviews productId={product._id} productName={product.Name} />
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
    <div className="border-t border-border bg-muted/35 py-8 md:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <CategoryProductSlider
          categoryLabel="You May Also Like"
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
        <div className="flex flex-col gap-4 md:sticky md:top-24">
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
            <Skeleton key={index} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
