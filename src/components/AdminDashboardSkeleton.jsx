import { Skeleton } from '@/components/ui/skeleton';

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-72 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-card rounded-xl p-5">
            <Skeleton className="mb-4 size-11 rounded-xl" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="mt-3 h-8 w-20 rounded-md" />
            <Skeleton className="mt-3 h-3 w-36 rounded-md" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="surface-card rounded-xl p-5">
            <Skeleton className="mb-4 h-6 w-40 rounded-md" />
            <Skeleton className="h-[280px] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="space-y-4 p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
