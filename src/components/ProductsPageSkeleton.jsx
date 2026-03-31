import { Skeleton } from "@/components/ui/skeleton";

export function ProductsHeaderSkeleton() {
  return (
    <div>
      <div className="products-page-bar fixed inset-x-0 top-24 z-30 border-y border-border/70 bg-card/95 backdrop-blur">
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="relative flex gap-2 overflow-x-hidden py-4 hide-scrollbar">
            <Skeleton className="h-7 w-24 shrink-0 rounded-md" />
            <Skeleton className="h-7 w-30 shrink-0 rounded-md" />
            <Skeleton className="h-7 w-31 shrink-0 rounded-md" />
            <Skeleton className="h-7 w-28 shrink-0 rounded-md" />
            <Skeleton className="h-7 w-26 shrink-0 rounded-md" />
            <Skeleton className="h-7 w-32 shrink-0 rounded-md" />
          </div>
        </div>
      </div>

      <div className="h-22 md:h-24" aria-hidden="true" />

      <div className="container mx-auto mb-3 max-w-7xl px-4">
        <Skeleton className="products-page-meta mb-3 h-4 w-32 rounded-md" />
        <Skeleton className="products-page-heading h-9 w-44 rounded-md" />
      </div>
    </div>
  );
}

export function ProductsToolbarSkeleton() {
  return (
    <div className="products-page-toolbar mx-auto max-w-7xl px-4 pt-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="relative h-12 overflow-hidden rounded-xl border border-border/70 bg-background/80">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <Skeleton className="size-4 rounded-full" />
            </div>
            <div className="flex h-full items-center justify-between gap-3 pl-10 pr-2">
              <Skeleton className="h-4 w-40 rounded-md md:w-56" />
              <Skeleton className="h-9 w-22 shrink-0 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:w-64">
          <div className="relative h-12 w-full overflow-hidden rounded-xl border border-border/70 bg-background/80 px-4">
            <div className="flex h-full items-center gap-3">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsGridSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <ProductsGridSkeletonContent />
    </section>
  );
}

function ProductsGridSkeletonContent() {
  return (
    <>
      <div className="products-page-results-meta mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-5 rounded-md" />
          <Skeleton className="h-4 w-7 rounded-md" />
          <Skeleton className="h-4 w-5 rounded-md" />
          <Skeleton className="h-4 w-7 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
      </div>

      <div className="grid auto-rows-max grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="products-grid-skeleton-card overflow-hidden rounded-xl border border-border bg-card"
          >
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="flex flex-col gap-1.5 bg-card p-3 pt-3">
              <Skeleton className="h-4 w-[78%] rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <Skeleton className="size-10 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ProductsPaginationSkeleton() {
  return (
    <div className="products-page-footer mt-8 flex flex-col items-center gap-4">
      <div className="flex items-center gap-0.5">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-24 rounded-md" />
    </div>
  );
}

export function ProductsResultsSkeleton() {
  return (
    <>
      <ProductsToolbarSkeleton />
      <section className="mx-auto max-w-7xl px-4 py-6">
        <ProductsGridSkeletonContent />
        <ProductsPaginationSkeleton />
      </section>
    </>
  );
}

export default function ProductsPageSkeleton() {
  return (
    <>
      <ProductsHeaderSkeleton />
      <ProductsResultsSkeleton />
    </>
  );
}
