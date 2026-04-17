import { Suspense } from 'react';
import { SearchX } from 'lucide-react';

import ProductCard from '@/components/ProductCard';
import ProductsPagination from '@/components/ProductsPagination';
import { ProductsNavigationFeedbackProvider, ProductsPendingResults } from '@/components/ProductsNavigationFeedback';
import ProductsPageHeader from '@/components/ProductsPageHeader';
import ProductsToolbar from '@/components/ProductsToolbar';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ProductsGridSkeleton } from '@/components/ProductsPageSkeleton';
import { getProductsList, getStoreCategories } from '@/lib/data';

const PRODUCTS_PAGE_SIZE = 12;

function buildSuspenseKey(searchParams) {
  return JSON.stringify({
    category: searchParams?.category || 'all',
    search: searchParams?.search || '',
    sort: searchParams?.sort || 'newest',
    page: searchParams?.page || '1',
  });
}

export async function generateMetadata({ searchParams }) {
  const params = (await searchParams) || {};
  const category = params.category || 'all';
  const search = params.search || '';

  if (search) {
    return {
      title: `Search results for "${search}"`,
      description: `Browse matching China Unique Store products for "${search}".`,
    };
  }

  if (category && category !== 'all') {
    return {
      title: category === 'new-arrivals' ? 'New Arrivals' : 'Products',
      description: 'Browse products by category at China Unique Store.',
    };
  }

  return {
    title: 'All Products',
    description: 'Browse the complete China Unique Store catalog.',
  };
}

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = (await searchParams) || {};
  const categories = await getStoreCategories();
  const productsPromise = getProductsList({
    category: resolvedSearchParams.category || 'all',
    search: resolvedSearchParams.search || '',
    sort: resolvedSearchParams.sort || 'newest',
    page: Number(resolvedSearchParams.page || 1),
    limit: PRODUCTS_PAGE_SIZE,
  });

  return (
    <ProductsNavigationFeedbackProvider>
      <div className="products-page-shell">
        <ProductsPageHeader
          categories={categories}
          activeCategory={resolvedSearchParams.category || 'all'}
          searchTerm={resolvedSearchParams.search || ''}
          sort={resolvedSearchParams.sort || 'newest'}
        />
        <ProductsToolbar
          initialSearch={resolvedSearchParams.search || ''}
          initialSort={resolvedSearchParams.sort || 'newest'}
          activeCategory={resolvedSearchParams.category || 'all'}
        />
        <section className="mx-auto max-w-7xl px-4 py-6">
          <Suspense key={buildSuspenseKey(resolvedSearchParams)} fallback={<ProductsGridSkeleton />}>
            <ProductsResultsContent productsPromise={productsPromise} />
          </Suspense>
          <Suspense fallback={null}>
            <ProductsPaginationContent productsPromise={productsPromise} />
          </Suspense>
        </section>
      </div>
    </ProductsNavigationFeedbackProvider>
  );
}

async function ProductsResultsContent({ productsPromise }) {
  const data = await productsPromise;
  const placeholderCount = Math.max(PRODUCTS_PAGE_SIZE - data.items.length, 0);

  return (
    <>
      <ProductsPendingResults>
        <div className="products-page-results-meta mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            Showing{' '}
            <span className="font-semibold text-foreground">{data.items.length}</span>
            {' '}of{' '}
            <span className="font-semibold text-foreground">{data.total}</span>
            {' '}products
          </p>
        </div>

        {data.items.length ? (
          <div className="grid auto-rows-max grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {data.items.map((product, index) => (
              <div
                key={`${product.slug || product._id || product.id || 'product'}-${index}`}
                className="products-grid-card"
                style={{ '--products-card-delay': `${Math.min(index, 7) * 48}ms` }}
              >
                <ProductCard
                  product={product}
                />
              </div>
            ))}
            {Array.from({ length: placeholderCount }).map((_, index) => (
              <ProductCardPlaceholder key={`placeholder-${index}`} index={data.items.length + index} />
            ))}
          </div>
        ) : (
          <div className="products-page-empty relative">
            <div aria-hidden="true" className="grid auto-rows-max grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {Array.from({ length: PRODUCTS_PAGE_SIZE }).map((_, index) => (
                <ProductCardPlaceholder key={`empty-placeholder-${index}`} index={index} />
              ))}
            </div>
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
              <Empty className="surface-card w-full rounded-xl px-6 py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-16 rounded-xl bg-primary/10 text-primary">
                  <SearchX className="size-7" />
                  </EmptyMedia>
                  <EmptyTitle className="text-lg font-semibold text-foreground">No products found</EmptyTitle>
                  <EmptyDescription className="max-w-sm">
                    Try adjusting your search, sort, or category to explore the catalog.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </div>
        )}
      </ProductsPendingResults>
    </>
  );
}

function ProductCardPlaceholder({ index }) {
  return (
    <div
      aria-hidden="true"
      className="products-grid-card pointer-events-none select-none opacity-0"
      style={{ '--products-card-delay': `${Math.min(index, 7) * 48}ms` }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-transparent">
        <div className="aspect-square w-full" />
        <div className="flex flex-1 flex-col gap-1.5 p-3 pt-3">
          <div className="h-5" />
          <div className="h-8" />
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="h-6 w-20" />
            <div className="size-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProductsPaginationContent({ productsPromise }) {
  const data = await productsPromise;

  return (
    <ProductsPagination
      pathname="/products"
      page={data.page}
      totalPages={data.totalPages}
      category={data.activeCategory}
      search={data.searchTerm}
      sort={data.sort}
    />
  );
}
