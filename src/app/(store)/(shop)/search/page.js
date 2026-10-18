import { Suspense } from 'react';

import ProductsInfiniteGrid from '@/components/ProductsInfiniteGrid';
import { ProductsNavigationFeedbackProvider, ProductsPendingResults } from '@/components/ProductsNavigationFeedback';
import ProductsPageHeader from '@/components/ProductsPageHeader';
import ProductsToolbar from '@/components/ProductsToolbar';
import ProductsSidebar from '@/components/ProductsSidebar';
import { ProductsGridSkeleton } from '@/components/ProductsPageSkeleton';
import { getProductsList, getStoreCategories } from '@/lib/data';

const PRODUCTS_PAGE_SIZE = 20;

function buildSuspenseKey(searchParams) {
  return JSON.stringify({
    category: searchParams?.category || 'all',
    search: searchParams?.q || searchParams?.search || '',
    sort: searchParams?.sort || 'newest',
    price: searchParams?.price || 'all',
    layout: searchParams?.layout || 'grid4',
  });
}

export async function generateMetadata({ searchParams }) {
  const params = (await searchParams) || {};
  const query = (params.q || params.search || '').trim();

  if (query) {
    return {
      title: `Search results for "${query}" | China Unique Store`,
      description: `Browse matching products for "${query}" at China Unique Store with best prices and fast shipping across Pakistan.`,
    };
  }

  return {
    title: 'Search Products | China Unique Store',
    description: 'Search quality kitchenware, household items, tools, and unique lifestyle essentials at China Unique Store.',
  };
}

export default async function SearchPage({ searchParams }) {
  const resolvedSearchParams = (await searchParams) || {};
  const query = (resolvedSearchParams.q || resolvedSearchParams.search || '').trim();
  const category = resolvedSearchParams.category || 'all';
  const sort = resolvedSearchParams.sort || 'newest';
  const price = resolvedSearchParams.price || 'all';
  const layout = resolvedSearchParams.layout || 'grid4';

  const categories = await getStoreCategories();
  const productsPromise = getProductsList({
    category,
    search: query,
    sort,
    price,
    page: 1,
    limit: PRODUCTS_PAGE_SIZE,
  });

  return (
    <ProductsNavigationFeedbackProvider>
      <div className="products-page-shell">
        <ProductsPageHeader
          categories={categories}
          activeCategory={category}
          searchTerm={query}
          sort={sort}
          price={price}
        />
        <ProductsToolbar
          initialSearch={query}
          initialSort={sort}
          activeCategory={category}
        />
        <section className="mx-auto w-full max-w-[1600px] overflow-x-hidden px-3 py-2 sm:overflow-x-visible sm:px-6 md:px-8 lg:px-10 xl:px-14">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8 items-start relative">
            <ProductsSidebar 
              categories={categories} 
              activeCategory={category} 
            />
            <div className="w-full min-w-0 flex-1" data-store-reveal>
              <Suspense key={buildSuspenseKey(resolvedSearchParams)} fallback={<ProductsGridSkeleton />}>
                <div className="store-fade">
                  <SearchResultsContent 
                    productsPromise={productsPromise} 
                    layout={layout} 
                    category={category}
                    search={query}
                    sort={sort}
                    price={price}
                  />
                </div>
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </ProductsNavigationFeedbackProvider>
  );
}

async function SearchResultsContent({ productsPromise, layout, category, search, sort, price }) {
  const data = await productsPromise;

  return (
    <ProductsPendingResults>
      <ProductsInfiniteGrid
        initialProducts={data.items || []}
        total={data.total || 0}
        initialHasMore={Boolean(data.hasMore)}
        layout={layout}
        category={category}
        search={search}
        sort={sort}
        price={price}
      />
    </ProductsPendingResults>
  );
}
