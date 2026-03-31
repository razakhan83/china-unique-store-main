import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 pb-20 pt-8">
        <Skeleton className="mb-6 h-4 w-52 rounded-md" />

        <div className="flex flex-col gap-6 md:flex-row md:gap-10 lg:gap-14">
          <div className="w-full md:w-[55%] lg:w-[58%]">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-20 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="w-full space-y-5 md:w-[45%] lg:w-[42%]">
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

        <div className="mt-12 rounded-2xl border border-border p-6">
          <Skeleton className="mb-4 h-8 w-48 rounded-lg" />
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
