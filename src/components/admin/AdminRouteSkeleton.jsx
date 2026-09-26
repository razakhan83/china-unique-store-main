import { AdminTableSkeleton } from '@/components/AdminDashboardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-2 sm:p-4">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-4 w-80 max-w-full rounded-md" />
      <AdminTableSkeleton rows={6} />
    </div>
  );
}
