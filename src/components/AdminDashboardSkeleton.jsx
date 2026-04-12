import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function PageIntroSkeleton({ titleWidth = 'w-56', descriptionWidth = 'w-80', action = false }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className={`h-8 rounded-lg ${titleWidth}`} />
        <Skeleton className={`h-4 rounded-md ${descriptionWidth}`} />
      </div>
      {action ? <Skeleton className="h-10 w-36 rounded-xl" /> : null}
    </div>
  );
}

function SummaryCardSkeleton({ accent = false }) {
  return (
    <Card className={accent ? 'border-none bg-destructive/6 shadow-none' : 'border-none shadow-none'}>
      <CardHeader className="flex flex-col gap-2 pb-2">
        <Skeleton className={`h-4 rounded-md ${accent ? 'w-32' : 'w-28'}`} />
        <Skeleton className={`h-10 rounded-lg ${accent ? 'w-16' : 'w-20'}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Skeleton className="size-3 rounded-full" />
          <Skeleton className="h-3 w-36 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="admin-surface rounded-[1.4rem] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <Skeleton className="size-12 rounded-[1rem]" />
      </div>
      <div className="border-t border-border/70 pt-3">
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>
    </div>
  );
}

function PillRowSkeleton({ count = 2 }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-28 rounded-full" />
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 6, columns = 6, header = true, minWidth = 'min-w-[850px]' }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <div className={`w-full ${minWidth}`}>
          {header ? (
            <div className="grid grid-cols-1 gap-3 border-b border-border bg-muted/50 px-6 py-4 sm:grid-cols-6">
              {Array.from({ length: columns }).map((_, index) => (
                <Skeleton key={index} className="h-3 w-20 rounded-md" />
              ))}
            </div>
          ) : null}
          <div className="flex flex-col">
            {Array.from({ length: rows }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-b-0 sm:grid-cols-6"
              >
                {Array.from({ length: columns }).map((__, cellIndex) => (
                  <Skeleton
                    key={cellIndex}
                    className={`h-4 rounded-md ${cellIndex === 0 ? 'w-28' : cellIndex === columns - 1 ? 'w-24' : 'w-20'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterToolbarSkeleton({ withSearch = true, filters = 2, showDateRange = false, showActions = 1 }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {withSearch ? <Skeleton className="h-10 flex-1 rounded-xl" /> : null}
        {showDateRange ? (
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        ) : null}
        {Array.from({ length: filters }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-36 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: showActions }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ProductCardListSkeleton({ rows = 3 }) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="admin-surface rounded-[1.25rem] p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-16 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
                <Skeleton className="size-8 rounded-lg" />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-3">
            {Array.from({ length: 3 }).map((__, lineIndex) => (
              <div key={lineIndex} className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormFieldSkeleton({ tall = false }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-28 rounded-md" />
      <Skeleton className={`rounded-xl ${tall ? 'h-24' : 'h-11'}`} />
    </div>
  );
}

function ProductEditorSkeletonContent({ edit = false }) {
  return (
    <div className="w-full pb-10">
      <div className="mb-6 flex items-center gap-4 md:mb-8">
        <Skeleton className="size-9 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className={`h-8 rounded-lg ${edit ? 'w-44' : 'w-52'}`} />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
      </div>

      <div className="surface-card max-w-2xl rounded-xl p-4 shadow-lg md:p-8">
        <div className="flex flex-col gap-6">
          <FormFieldSkeleton />
          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
          {!edit ? (
            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <Skeleton className="h-3 w-24 rounded-md" />
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <div className="flex min-h-[52px] flex-wrap gap-2 rounded-xl border border-border bg-muted/35 p-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-24 rounded-lg" />
              ))}
            </div>
          </div>
          {!edit ? (
            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <Skeleton className="h-4 w-24 rounded-md" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/35 p-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-44 rounded-xl" />
          </div>
          <FormFieldSkeleton tall />
          <div className="space-y-4 rounded-xl border border-border bg-muted/35 p-4 md:p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-80 max-w-full rounded-md" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-9 w-32 rounded-full" />
                <Skeleton className="h-8 w-36 rounded-full" />
              </div>
            </div>
            <div className="grid gap-4">
              <FormFieldSkeleton />
              <FormFieldSkeleton tall />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-border bg-background p-4">
                <Skeleton className="h-3 w-28 rounded-md" />
                <div className="mt-3 flex flex-col gap-2">
                  <Skeleton className="h-5 w-64 max-w-full rounded-md" />
                  <Skeleton className="h-3 w-72 max-w-full rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <Skeleton className="h-3 w-28 rounded-md" />
                <div className="mt-3 flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <Skeleton className="h-3 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        <section className="admin-panel overflow-hidden rounded-[1.6rem] px-6 py-6 md:px-8 md:py-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)] xl:items-start">
            <div className="flex min-h-full flex-col justify-between gap-8">
              <div className="flex max-w-3xl flex-col gap-3">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-11 w-72 rounded-xl" />
              </div>
              <PillRowSkeleton count={2} />
            </div>
            <div className="admin-surface rounded-[1.35rem] p-4">
              <div className="mb-3">
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 rounded-[1rem] border border-border/80 bg-white px-4 py-3">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="size-4 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="grid gap-5">
            <div className="admin-surface rounded-[1.5rem] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <div className="flex h-[260px] flex-col justify-between rounded-[1.3rem] border border-border/80 p-6">
                <Skeleton className="h-16 w-32 rounded-xl" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
            </div>
            <div className="admin-surface rounded-[1.5rem] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-32 rounded-md" />
              </div>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-[1.2rem] border border-border/80 bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <Skeleton className="h-3 w-16 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="admin-surface rounded-[1.5rem] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
              <div className="rounded-[1.3rem] border border-border/80 p-6">
                <Skeleton className="h-12 w-40 rounded-xl" />
                <Skeleton className="mt-3 h-4 w-28 rounded-md" />
              </div>
            </div>
            <div className="admin-surface rounded-[1.5rem] p-5">
              <div className="mb-4">
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-[1.15rem] border border-border/80 bg-background px-4 py-3">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="mt-2 h-4 w-28 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="admin-surface flex flex-col gap-4 rounded-[1.5rem] p-5 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </section>
      </div>
    </div>
  );
}

export function AdminCategoriesSkeleton() {
  return (
    <div className="max-w-4xl pb-24 md:pb-0">
      <div className="flex flex-col gap-6">
        <PageIntroSkeleton titleWidth="w-36" descriptionWidth="w-[26rem]" />
        <div className="surface-card rounded-2xl p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-4">
              <FormFieldSkeleton />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-12 w-36 rounded-xl" />
                  <Skeleton className="size-16 rounded-2xl" />
                </div>
              </div>
            </div>
            <div className="flex items-end">
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="surface-card rounded-2xl border border-border/70 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="surface-card flex items-center gap-4 rounded-2xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.07)]">
              <Skeleton className="size-16 rounded-2xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <div className="hidden md:block">
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-3 w-10 rounded-md" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <Skeleton className="size-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminCoverPhotosSkeleton() {
  return (
    <div className="max-w-5xl">
      <div className="flex flex-col gap-6">
        <PageIntroSkeleton titleWidth="w-44" descriptionWidth="w-[28rem]" />
        <div className="surface-card rounded-xl p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-3 w-72 max-w-full rounded-md" />
              </div>
            </div>
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                <div className="border-b border-border bg-muted/25 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-3 w-16 rounded-md" />
                      <Skeleton className="h-4 w-40 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-9 rounded-lg" />
                      <Skeleton className="size-9 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-4">
                  <FormFieldSkeleton />
                  <div className="grid gap-3 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((__, tileIndex) => (
                      <div key={tileIndex} className="rounded-2xl border border-border bg-background/70 p-3">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Skeleton className="size-10 rounded-xl" />
                            <div className="flex flex-col gap-2">
                              <Skeleton className="h-4 w-24 rounded-md" />
                              <Skeleton className="h-3 w-40 rounded-md" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-20 rounded-xl" />
                        </div>
                        <Skeleton className="aspect-[16/9] rounded-xl" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-4 w-52 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminOrdersSkeleton() {
  return (
    <div className="space-y-6">
      <PageIntroSkeleton titleWidth="w-28" descriptionWidth="w-0" />
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-32 rounded-full" />
        ))}
      </div>
      <FilterToolbarSkeleton filters={0} showDateRange showActions={3} />
      <TableSkeleton rows={8} columns={8} />
    </div>
  );
}

export function AdminProductsSkeleton() {
  return (
    <div className="pb-24 md:pb-0">
      <div className="flex flex-col gap-6">
        <PageIntroSkeleton titleWidth="w-32" descriptionWidth="w-40" action />
        <div className="admin-surface rounded-[1.35rem] p-4">
          <div className="flex flex-col gap-3">
            <FilterToolbarSkeleton filters={1} showActions={0} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
              <Skeleton className="h-9 w-36 rounded-xl" />
              <Skeleton className="h-9 w-36 rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <TableSkeleton rows={8} columns={7} minWidth="min-w-[1000px]" />
        </div>
        <ProductCardListSkeleton rows={4} />
      </div>
    </div>
  );
}

export function AdminReviewsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntroSkeleton titleWidth="w-60" descriptionWidth="w-80" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SummaryCardSkeleton key={index} />
        ))}
      </div>
      <FilterToolbarSkeleton filters={0} showActions={0} />
      <TableSkeleton rows={8} columns={6} minWidth="min-w-[900px]" />
    </div>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div className="max-w-5xl">
      <div className="flex flex-col gap-6">
        <PageIntroSkeleton titleWidth="w-44" descriptionWidth="w-[26rem]" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="surface-card rounded-xl p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40 rounded-md" />
                <Skeleton className="h-3 w-72 max-w-full rounded-md" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {index === 1 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {Array.from({ length: 2 }).map((__, tileIndex) => (
                    <div key={tileIndex} className="rounded-2xl border border-border bg-background/75 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-32 rounded-md" />
                          <Skeleton className="h-3 w-48 rounded-md" />
                        </div>
                        <Skeleton className="h-9 w-24 rounded-xl" />
                      </div>
                      <Skeleton className="mt-4 h-36 rounded-2xl" />
                      <Skeleton className="mt-4 h-11 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : index === 3 ? (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/35 px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-56 rounded-md" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-44 rounded-md" />
                      <Skeleton className="h-11 rounded-xl" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-xl" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((__, messageIndex) => (
                      <div key={messageIndex} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <Skeleton className="h-3 w-20 rounded-md" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-16 rounded-lg" />
                            <Skeleton className="h-8 w-20 rounded-lg" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                </>
              ) : index === 4 ? (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-3 w-60 rounded-md" />
                  </div>
                  <Skeleton className="h-10 w-40 rounded-xl" />
                </div>
              ) : (
                <>
                  <FormFieldSkeleton />
                  <FormFieldSkeleton />
                  <FormFieldSkeleton tall />
                </>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-4 pb-4">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-4 w-52 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function AdminShippingSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageIntroSkeleton titleWidth="w-52" descriptionWidth="w-[26rem]" />
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-3 w-52 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
          <Skeleton className="h-px w-full" />
          <FormFieldSkeleton />
          <Skeleton className="h-11 w-48 rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminUsersSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntroSkeleton titleWidth="w-52" descriptionWidth="w-[30rem]" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton accent />
      </div>
      <FilterToolbarSkeleton filters={1} showActions={1} />
      <TableSkeleton rows={8} columns={5} minWidth="min-w-[900px]" />
      <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/40 p-4">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function AdminHomePageBuilderSkeleton() {
  return (
    <div className="max-w-6xl pb-12 md:pb-0">
      <div className="sticky top-0 z-50 -mx-3 mb-3 border-b border-border/80 bg-background/95 px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:mx-0 sm:px-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="surface-card rounded-2xl border border-border/70 p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="size-8 rounded-xl" />
              </div>
            </div>
            <Skeleton className="my-3 h-px w-full" />
            <div className="flex flex-col gap-4">
              <FormFieldSkeleton />
              <FormFieldSkeleton tall />
              <div className="grid gap-3 xl:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/80 p-3">
                  <Skeleton className="h-40 rounded-xl" />
                  <div className="mt-3 grid gap-3">
                    <FormFieldSkeleton />
                    <FormFieldSkeleton />
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-background/80 p-3">
                  <Skeleton className="h-40 rounded-xl" />
                  <div className="mt-3 grid gap-3">
                    <FormFieldSkeleton />
                    <FormFieldSkeleton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminProductEditorSkeleton() {
  return <ProductEditorSkeletonContent />;
}

export function AdminEditProductSkeleton() {
  return <ProductEditorSkeletonContent edit />;
}

export function AdminOrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card rounded-xl p-5 lg:col-span-1">
          <Skeleton className="h-5 w-24 rounded-md" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
            ))}
          </div>
        </section>
        <section className="surface-card rounded-xl p-5">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid gap-3">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </section>
        <section className="surface-card rounded-xl p-5 lg:col-span-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-4 gap-3 border-b border-border bg-muted/50 px-4 py-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-3 w-20 rounded-md" />
              ))}
            </div>
            <div className="flex flex-col">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="grid grid-cols-4 gap-3 border-b border-border px-4 py-4 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-14 rounded-lg" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-10 rounded-md self-center" />
                  <Skeleton className="h-4 w-20 rounded-md self-center" />
                  <Skeleton className="h-4 w-24 rounded-md self-center" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="surface-card rounded-xl border border-border p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-border/50 pb-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="relative flex items-start">
              <Skeleton className="absolute left-0 size-10 rounded-full" />
              <div className="ml-14 flex-1 rounded-xl border border-border/40 bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="mt-2 h-4 w-5/6 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 5 }) {
  return <TableSkeleton rows={rows} columns={6} />;
}
