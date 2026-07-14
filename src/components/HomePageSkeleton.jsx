import { Skeleton } from '@/components/ui/skeleton';

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
                <div key={cardIndex} className="min-w-[160px] md:min-w-[220px] lg:min-w-[260px] flex-1 group relative flex h-full flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card">
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
          </section>
        ))}
      </div>
    </div>
  );
}
