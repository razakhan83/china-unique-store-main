import { Skeleton } from '@/components/ui/skeleton';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

export default function HomePageSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <Skeleton className="h-[44svh] w-full rounded-none md:h-[60svh]" />

      <div className="mx-auto flex w-full max-w-[1500px] gap-3 overflow-hidden px-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20 min-w-[120px] flex-1 rounded-2xl" />
        ))}
      </div>

      <div className="space-y-10">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <section key={sectionIndex} className="mx-auto w-full max-w-[1500px] space-y-4 px-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }).map((_, cardIndex) => (
                <div key={cardIndex} className="min-w-[160px] md:min-w-[220px] lg:min-w-[260px] flex-1">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
