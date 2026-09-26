import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsFormSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Skeleton className="mb-6 h-9 w-24 rounded-lg" />
      <Skeleton className="mb-2 h-9 w-52 rounded-lg" />
      <Skeleton className="mb-6 h-4 w-80 max-w-full rounded-md" />
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 p-6">
          <Skeleton className="mb-2 h-6 w-48 rounded-md" />
          <Skeleton className="mb-6 h-4 w-64 rounded-md" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 p-6">
          <Skeleton className="mb-2 h-6 w-56 rounded-md" />
          <Skeleton className="mb-6 h-4 w-72 rounded-md" />
          <div className="grid gap-4">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  );
}
