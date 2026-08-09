import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOrdersSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Tabs / Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg shrink-0" />
        ))}
      </div>

      {/* Action / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Orders Table Skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Order ID', 'Customer', 'City', 'Date', 'Payment', 'Tracking', 'Weight', 'Total', 'Status', ''].map((_, idx) => (
                  <th key={idx} className="p-3">
                    <Skeleton className="h-3 w-16 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="p-3"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="p-3 space-y-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </td>
                  <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="p-3 space-y-1">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-14 rounded" />
                  </td>
                  <td className="p-3"><Skeleton className="h-4 w-12 rounded" /></td>
                  <td className="p-3 space-y-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </td>
                  <td className="p-3"><Skeleton className="h-4 w-10 rounded" /></td>
                  <td className="p-3 text-right"><Skeleton className="h-4 w-16 rounded ml-auto" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="p-3 text-right"><Skeleton className="h-7 w-7 rounded-md ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
