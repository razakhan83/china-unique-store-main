import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailLoading() {
  return (
    <div className="product-detail-shell min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 pb-2 pt-8 md:pt-10">
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 pb-[calc(env(safe-area-inset-bottom)+var(--mobile-bottom-nav-offset)+3.5rem)] pt-3 md:pb-8 md:pt-5">
        <div className="flex flex-col gap-6 md:flex-row md:gap-10 lg:gap-14">
          <div className="w-full md:w-[55%] lg:w-[58%]">
            <Skeleton className="aspect-square w-full rounded-xl" />
          </div>

          <div className="w-full md:w-[45%] lg:w-[42%]">
            <div className="flex flex-col gap-5 md:sticky md:top-28">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-10 w-3/4 rounded-lg" />
              <Skeleton className="h-10 w-40 rounded-lg" />
              <Skeleton className="h-px w-full" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-[92%] rounded-md" />
                <Skeleton className="h-4 w-[78%] rounded-md" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
