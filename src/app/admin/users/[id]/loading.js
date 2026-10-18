import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function CustomerDetailLoading() {
  return (
    <div className="w-full space-y-6">
      {/* Back button & Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-28 rounded-xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-7 w-28 rounded-lg" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid: Info + Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <Card className="rounded-2xl border-border bg-card p-5 shadow-xs space-y-4">
            <Skeleton className="h-5 w-36 rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="rounded-2xl border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <Skeleton className="h-5 w-40 rounded-md" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
