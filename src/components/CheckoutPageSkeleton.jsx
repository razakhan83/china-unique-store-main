import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import styles from '@/app/(store)/(checkout-shell)/checkout/CheckoutClient.module.css';

export default function CheckoutPageSkeleton() {
  return (
    <>
      {/* ── TOP NAV BAR SKELETON ── */}
      <div className="sticky top-0 z-50 w-full bg-background px-4 py-5 flex justify-center lg:justify-start lg:pl-[15%] border-b border-border/40">
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>

      {/* ── MOBILE ACCORDION SKELETON ── */}
      <div className="w-full bg-[#f5f5f5] dark:bg-muted/10 px-4 py-5 lg:hidden border-b border-border/40 flex justify-between items-center">
        <Skeleton className="h-4 w-32 rounded-full bg-muted-foreground/20" />
        <Skeleton className="h-4 w-20 rounded-full bg-muted-foreground/20" />
      </div>

      <div className={cn(styles.checkoutShell, "max-w-7xl mx-auto")}>
        {/* ── LEFT PANEL (Forms) ── */}
        <div className={cn(styles.leftPanel, "bg-background xl:pr-12")}>
          <div className="pt-6 lg:pt-10 pb-24 w-full max-w-xl mx-auto xl:mr-0 xl:ml-auto px-4 lg:px-0">
            
            {/* Centered Pill (Title) */}
            <div className="flex justify-center mb-8">
              <Skeleton className="h-3.5 w-40 rounded-full bg-muted-foreground/15" />
            </div>

            {/* Contact Information Blocks */}
            <div className="mb-10 space-y-3">
              <Skeleton className="h-14 w-full rounded-xl bg-muted-foreground/15" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-14 w-full rounded-xl bg-muted-foreground/15" />
                <Skeleton className="h-14 w-full rounded-xl bg-muted-foreground/15" />
              </div>
            </div>

            <div className="border-b border-border/40 my-8" />

            {/* Delivery Section */}
            <div className="mb-10">
              <Skeleton className="h-4 w-24 rounded-full bg-muted-foreground/20 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-3 w-full rounded-full bg-muted-foreground/15" />
                <Skeleton className="h-3 w-[95%] rounded-full bg-muted-foreground/15" />
              </div>
            </div>

            <div className="border-b border-border/40 my-8" />

            {/* Payment Section */}
            <div className="mb-10">
              <Skeleton className="h-4 w-24 rounded-full bg-muted-foreground/20 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-3 w-full rounded-full bg-muted-foreground/15" />
                <Skeleton className="h-3 w-full rounded-full bg-muted-foreground/15" />
              </div>
            </div>
            
          </div>
        </div>

        {/* ── RIGHT PANEL (Order Summary) ── */}
        <div className={cn(styles.rightPanel, "hidden lg:block bg-[#fafafa] dark:bg-muted/5 xl:pl-12 border-l border-border/40 min-h-screen")}>
          <div className="pt-10 pb-24 w-full max-w-xl mx-auto xl:ml-0 xl:mr-auto pr-6">
            
            {/* Product Item */}
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="size-16 rounded-xl bg-muted-foreground/15 shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-3/4 rounded-full bg-muted-foreground/15" />
                <Skeleton className="h-3 w-1/3 rounded-full bg-muted-foreground/15" />
              </div>
              <Skeleton className="h-3 w-16 rounded-full bg-muted-foreground/15 shrink-0" />
            </div>

            {/* Subtotals */}
            <div className="space-y-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-3 w-28 rounded-full bg-muted-foreground/15" />
                  <Skeleton className="h-3 w-16 rounded-full bg-muted-foreground/15" />
                </div>
              ))}
            </div>

            <div className="border-b border-border/40 my-6" />

            {/* Grand Total */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded-full bg-muted-foreground/15" />
              <Skeleton className="h-5 w-24 rounded-full bg-muted-foreground/15" />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
