import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailLoading() {
  return (
    <div className="product-detail-shell min-h-screen bg-background">
      {/* Top Header / Breadcrumb */}
      <div className="container mx-auto max-w-7xl px-4 pb-0 pt-2 md:pt-6">
        <div className="flex items-center justify-between md:hidden">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="hidden md:flex items-center gap-2 pb-1">
          <Skeleton className="h-4 w-12 rounded" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-16 rounded" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-28 rounded" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-4 w-44 rounded" />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-[calc(env(safe-area-inset-bottom)+var(--mobile-bottom-nav-offset)+3.5rem)] pt-2 md:pb-8 md:pt-4">
        <div className="flex flex-col gap-6 md:flex-row md:gap-10 lg:gap-14">
          
          {/* Gallery Column */}
          <div className="w-full md:w-[52%] lg:w-[55%] space-y-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-2.5 overflow-hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-20 rounded-xl shrink-0" />
              ))}
            </div>
          </div>

          {/* Details Column */}
          <div className="w-full md:w-[48%] lg:w-[45%]">
            <div className="flex flex-col gap-4 md:sticky md:top-24">
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-11/12 rounded-lg" />
                <Skeleton className="h-8 w-3/4 rounded-lg" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="size-4 rounded-sm" />
                  ))}
                </div>
                <Skeleton className="h-4 w-20 rounded" />
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 py-1">
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>

              <div className="h-px w-full bg-border/60" />

              {/* Pack Options */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>

              {/* Desktop Quantity & Action Buttons */}
              <div className="hidden md:flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-32 rounded-xl" />
                  <Skeleton className="h-11 flex-1 rounded-xl" />
                  <Skeleton className="h-11 flex-1 rounded-xl" />
                </div>
              </div>

              {/* WhatsApp Order Button */}
              <Skeleton className="h-12 w-full rounded-xl" />

              {/* Accordions */}
              <div className="mt-2 space-y-2 divide-y divide-border/60">
                <div className="pt-3 pb-2 flex items-center justify-between">
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="size-4 rounded" />
                </div>
                <div className="pt-3 pb-2 flex items-center justify-between">
                  <Skeleton className="h-5 w-24 rounded" />
                  <Skeleton className="size-4 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like Section */}
        <div className="mt-14 pt-8 border-t border-border/80 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2.5 rounded-2xl border border-border/60 p-2.5">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-5 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col gap-2 border-t border-border/80 bg-background p-2.5 md:hidden">
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 flex-[0.7] rounded-xl" />
          <Skeleton className="h-11 flex-[1.3] rounded-xl" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
