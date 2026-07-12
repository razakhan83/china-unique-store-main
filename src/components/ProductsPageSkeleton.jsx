import { Skeleton } from "@/components/ui/skeleton";

export function ProductsHeaderSkeleton() {
  return (
    <div>
      <div className="products-page-bar fixed inset-x-0 top-24 z-30 border-b border-border/50 bg-background/86 backdrop-blur-xl">
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="relative flex gap-1.5 overflow-x-hidden py-3 hide-scrollbar">
            <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-30 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-31 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-28 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-26 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-32 shrink-0 rounded-full" />
          </div>
        </div>
      </div>

      <div className="h-18 md:h-20" aria-hidden="true" />

      <div className="container mx-auto mb-2 max-w-7xl px-4 pt-3">
        <Skeleton className="products-page-meta mb-2 h-4 w-32 rounded-md" />
        <Skeleton className="products-page-heading h-9 w-44 rounded-md" />
      </div>
    </div>
  );
}

export function ProductsToolbarSkeleton() {
  return (
    <div className="products-page-toolbar mx-auto max-w-7xl px-4 pt-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-card/70 p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="relative h-11 overflow-hidden rounded-xl bg-background/82">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Skeleton className="size-4 rounded-full" />
            </div>
            <div className="flex h-full items-center justify-between gap-3 pl-10 pr-2">
              <Skeleton className="h-4 w-40 rounded-md md:w-56" />
              <Skeleton className="h-8 w-22 shrink-0 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:w-[18.5rem]">
          <div className="relative h-11 w-full overflow-hidden rounded-xl bg-background/82 px-3">
            <div className="flex h-full items-center gap-3">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-11 w-22 shrink-0 rounded-xl" />
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
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card border border-border/40"
          >
            <div className="relative block aspect-square w-full overflow-hidden bg-muted/30">
              <Skeleton className="absolute inset-0 z-0 rounded-none bg-muted/60" />
            </div>
            <div className="flex flex-1 flex-col gap-2 bg-card px-3 pb-3 pt-3 @max-[220px]:p-2.5 @max-[220px]:gap-1.5 sm:p-4">
              <div className="block text-left pt-0.5">
                <Skeleton className="mb-1.5 h-3.5 w-[85%] rounded-md sm:h-4" />
                <Skeleton className="h-3.5 w-[50%] rounded-md sm:h-4" />
              </div>
              <div className="mt-auto flex items-end justify-between gap-2 pt-1 @max-[220px]:gap-1.5">
                <div className="flex min-w-0 flex-col justify-end gap-0.5">
                  <Skeleton className="h-[15px] w-16 rounded-md sm:h-[17px] sm:w-20" />
                </div>
                <Skeleton className="h-[34px] w-[34px] shrink-0 rounded-full sm:h-9 sm:w-[90px]" />
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
