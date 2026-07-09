import { Skeleton } from '@/components/ui/skeleton';

/**
 * Rich Shopify-style checkout skeleton — mirrors the two-panel layout
 * (white left form panel + grey right order summary) with labelled field rows.
 */
export default function CheckoutPageSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        minHeight: 'calc(100vh - 80px)',
        width: '100%',
      }}
      className="lg:[grid-template-columns:minmax(auto,650px)_minmax(auto,480px)] lg:justify-center lg:gap-0"
    >
      {/* ── LEFT PANEL ── */}
      <div
        style={{ padding: '2.5rem 1.25rem 8rem' }}
        className="bg-background sm:px-8 lg:flex lg:flex-col lg:items-end lg:px-14 lg:py-12"
      >
        <div className="w-full lg:max-w-[580px] space-y-8">

          {/* Contact section */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-11 w-full rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3.5 w-48 rounded" />
            </div>
          </div>

          {/* Delivery section */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-20 rounded" />

            {/* Name / Phone */}
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-11 rounded-md" />
              <Skeleton className="h-11 rounded-md" />
            </div>
            {/* Address */}
            <Skeleton className="h-11 w-full rounded-md" />
            {/* Apt */}
            <Skeleton className="h-11 w-full rounded-md" />
            {/* City / Postal */}
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-11 rounded-md" />
              <Skeleton className="h-11 rounded-md" />
            </div>
            {/* Save checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3.5 w-52 rounded" />
            </div>
          </div>



          {/* Payment */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
            <div className="rounded-md overflow-hidden border border-border/60 space-y-px">
              <Skeleton className="h-14 w-full rounded-none" />
              <Skeleton className="h-14 w-full rounded-none" />
              <Skeleton className="h-14 w-full rounded-none" />
            </div>
          </div>

          {/* CTA (desktop) */}
          <Skeleton className="hidden md:block h-13 w-full rounded-xl" />
        </div>
      </div>

      {/* ── RIGHT PANEL (desktop only) ── */}
      <div
        className="hidden lg:flex lg:flex-col"
        style={{
          background: 'oklch(0.962 0.006 95)',
          borderLeft: '1px solid oklch(0.91 0.008 95)',
          padding: '3rem 2rem 3rem 3.5rem',
        }}
      >
        <div className="w-full max-w-[420px] space-y-5">
          {/* Product rows */}
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-15 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}

          {/* Divider */}
          <Skeleton className="h-px w-full rounded" />

          {/* Discount row */}
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>

          {/* Divider */}
          <Skeleton className="h-px w-full rounded" />

          {/* Totals */}
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
            ))}
          </div>

          {/* Divider */}
          <Skeleton className="h-px w-full rounded" />

          {/* Grand total */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-7 w-28 rounded" />
          </div>

          {/* CTA */}
          <Skeleton className="h-13 w-full rounded-xl" />
        </div>
      </div>

      {/* ── MOBILE STICKY BAR SKELETON ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 border-t border-border bg-white px-5 py-3.5 lg:hidden"
      >
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-10 rounded" />
          <Skeleton className="h-5 w-28 rounded" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  );
}
