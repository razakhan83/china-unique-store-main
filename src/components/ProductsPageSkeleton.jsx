import { Skeleton } from "@/components/ui/skeleton";

export function ProductsHeaderSkeleton() {
  return (
    <div>
      <div className="products-page-bar fixed inset-x-0 top-[96px] md:top-[162px] z-30 border-b border-border/50 bg-background/86 backdrop-blur-xl translate-y-0">
        <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14">
          <div className="relative flex gap-1.5 overflow-x-hidden py-3 hide-scrollbar md:px-8">
            <Skeleton className="h-8 md:h-[40px] w-24 shrink-0 rounded-full" />
            <Skeleton className="h-8 md:h-[40px] w-30 shrink-0 rounded-full" />
            <Skeleton className="h-8 md:h-[40px] w-31 shrink-0 rounded-full" />
            <Skeleton className="h-8 md:h-[40px] w-28 shrink-0 rounded-full" />
            <Skeleton className="h-8 md:h-[40px] w-26 shrink-0 rounded-full" />
            <Skeleton className="h-8 md:h-[40px] w-32 shrink-0 rounded-full" />
          </div>
        </div>
      </div>

      <div className="h-[70px] md:h-[90px]" aria-hidden="true" />

      <div className="mx-auto w-full max-w-[1600px] mb-2 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 pt-3">
        <Skeleton className="products-page-meta mb-2 h-4 w-32 rounded-md" />
        <Skeleton className="products-page-heading h-9 w-44 rounded-md mt-2" />
      </div>
    </div>
  );
}

export function ProductsToolbarSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-2 md:pt-4 sm:px-6 md:px-8 lg:px-10 xl:px-14">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
        {/* Left side: Filters */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-[100px] rounded-md" />
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-[80px] rounded-md" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-8 w-[80px] rounded-md" />
            </div>
          </div>
        </div>

        {/* Right side: Sort and Layout */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-[100px] rounded-md" />
          </div>
          <div className="flex items-center gap-0.5 border-l border-border/50 pl-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsGridSkeleton() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-2 sm:px-6 md:px-8 lg:px-10 xl:px-14">
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

      <div className="grid auto-rows-max grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="@container product-card-surface group relative flex h-full flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="relative block aspect-square w-full overflow-hidden bg-muted/30">
              <Skeleton className="absolute inset-0 z-0 rounded-none bg-muted/60" />
            </div>
            <div className="flex flex-1 flex-col gap-2 bg-card px-3 pb-3 pt-3 @max-[220px]:p-2.5 @max-[220px]:gap-1.5 sm:p-4">
              <div className="block text-left pt-0.5">
                <Skeleton className="mb-1.5 h-3.5 w-[85%] rounded-md sm:h-4" />
                <Skeleton className="h-3.5 w-[50%] rounded-md sm:h-4" />
              </div>
              <div className="mt-auto flex flex-col gap-2.5 pt-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <Skeleton className="h-[15px] w-16 rounded-md sm:h-[16px] sm:w-20" />
                  <Skeleton className="h-[12px] w-12 rounded-md sm:h-[13px] sm:w-16" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
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
