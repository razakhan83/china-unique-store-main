import { ProductsGridSkeleton } from '@/components/ProductsPageSkeleton';

export default function WishlistLoading() {
  return (
    <main className="min-h-screen bg-background pb-16 pt-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <div className="h-9 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-5 w-96 animate-pulse rounded bg-muted" />
        </div>
        <ProductsGridSkeleton />
      </div>
    </main>
  );
}
