import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutPageSkeleton() {
  return (
    <main className="min-h-screen bg-background pb-16 pt-8">
      <div className="container mx-auto max-w-6xl space-y-8 px-4">
        <Skeleton className="h-4 w-44 rounded-md" />
        <Skeleton className="h-10 w-56 rounded-lg" />

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Skeleton className="h-[420px] rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-[420px] rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
