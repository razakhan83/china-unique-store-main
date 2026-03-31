import { Skeleton } from '@/components/ui/skeleton';

export default function HomePageSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <Skeleton className="h-[44svh] w-full rounded-none md:h-[60svh]" />

      <div className="mx-auto flex max-w-7xl gap-3 overflow-hidden px-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-20 min-w-24 flex-1 rounded-2xl" />
        ))}
      </div>

      <div className="space-y-10">
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <section key={sectionIndex} className="mx-auto max-w-7xl space-y-4 px-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, cardIndex) => (
                <div key={cardIndex} className="overflow-hidden rounded-xl border border-border bg-card">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="space-y-3 p-3">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-md" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-24 rounded-md" />
                      <Skeleton className="size-8 rounded-lg" />
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
