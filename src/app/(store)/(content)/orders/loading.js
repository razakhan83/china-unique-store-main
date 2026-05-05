function OrderCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex flex-col gap-4 bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-full bg-muted" />
          <div className="h-8 w-28 rounded-full bg-muted" />
        </div>
      </div>

      <div className="space-y-4 p-6">
        {[0, 1].map((item) => (
          <div key={item} className="flex items-center gap-4">
            <div className="size-12 rounded-lg bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}

        <div className="h-px w-full bg-border" />

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
          </div>
          <div className="space-y-2 text-right">
            <div className="ml-auto h-3 w-24 rounded bg-muted" />
            <div className="ml-auto h-5 w-24 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-background pb-16 pt-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 space-y-3">
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>

        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      </div>
    </main>
  );
}
