import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import styles from '@/app/(store)/(checkout-shell)/checkout/CheckoutClient.module.css';

/**
 * Rich Shopify-style checkout skeleton — perfectly mirrors the real layout
 * using the exact same CSS module classes as CheckoutClient.
 */
export default function CheckoutPageSkeleton() {
  return (
    <>
      {/* ── MOBILE ORDER SUMMARY (mobile only) ── */}
      <div className={styles.mobileOrderSummary}>
        <div className={styles.mobileOrderSummaryTrigger}>
          <div className={styles.mobileOrderSummaryTriggerLeft}>
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>

      <div className={styles.checkoutShell}>
        {/* ── LEFT PANEL ── */}
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelInner}>
            {/* Contact section */}
            <div className={styles.sectionBlock}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}><Skeleton className="h-6 w-24 rounded" /></h2>
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <div className={styles.inputGroup}>
                <Skeleton className="h-11 w-full rounded-md" />
                <div className={styles.checkboxRow}>
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3.5 w-48 rounded" />
                </div>
              </div>
            </div>

            {/* Delivery section */}
            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionTitle}><Skeleton className="h-6 w-24 rounded" /></h2>
              <div className={styles.inputGroup}>
                {/* Name / Phone */}
                <div className={styles.inputRow2}>
                  <Skeleton className="h-11 rounded-md" />
                  <Skeleton className="h-11 rounded-md" />
                </div>
                {/* Address */}
                <Skeleton className="h-11 w-full rounded-md" />
                {/* Apt */}
                <Skeleton className="h-11 w-full rounded-md" />
                {/* City / Postal */}
                <div className={styles.inputRow2}>
                  <Skeleton className="h-11 rounded-md" />
                  <Skeleton className="h-11 rounded-md" />
                </div>
                {/* Save checkbox */}
                <div className={styles.checkboxRow}>
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3.5 w-52 rounded" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className={styles.sectionBlock}>
              <h2 className={styles.sectionTitle}><Skeleton className="h-6 w-24 rounded" /></h2>
              <div className={styles.sectionSubtitle}><Skeleton className="h-3.5 w-56 rounded" /></div>
              
              <div className={styles.paymentOptions}>
                <div className={styles.paymentOptionHeader}>
                   <div className={styles.paymentOptionLeft}>
                     <Skeleton className="size-4 rounded-full" />
                     <Skeleton className="h-4 w-32 rounded" />
                   </div>
                </div>
                <div className="h-px bg-border/60" />
                <div className={styles.paymentOptionHeader}>
                   <div className={styles.paymentOptionLeft}>
                     <Skeleton className="size-4 rounded-full" />
                     <Skeleton className="h-4 w-40 rounded" />
                   </div>
                </div>
                <div className="h-px bg-border/60" />
                <div className={styles.paymentOptionHeader}>
                   <div className={styles.paymentOptionLeft}>
                     <Skeleton className="size-4 rounded-full" />
                     <Skeleton className="h-4 w-28 rounded" />
                   </div>
                </div>
                <div className={styles.billingRow}>
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-56 rounded" />
                </div>
              </div>
            </div>

            {/* Special notes */}
            <div className={styles.sectionBlock}>
              <div className={styles.inputGroup}>
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-3.5 w-40 rounded" />
              </div>
            </div>

            {/* CTA (desktop) */}
            <Skeleton className={cn(styles.ctaButton, 'hidden md:flex')} />

            {/* Trust links */}
            <div className={styles.trustLinks}>
               <Skeleton className="h-3 w-20 rounded" />
               <Skeleton className="h-3 w-16 rounded" />
               <Skeleton className="h-3 w-24 rounded" />
               <Skeleton className="h-3 w-28 rounded" />
               <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (desktop only) ── */}
        <div className={styles.rightPanel}>
          <div className={styles.rightPanelInner}>
            {/* Product list */}
            <div className={styles.summaryProductList}>
              {[1, 2].map((i) => (
                <div key={i} className={styles.summaryProduct}>
                  <div className={styles.summaryProductThumbWrapper}>
                    <Skeleton className={styles.summaryProductThumb} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-4 w-16 rounded ml-auto" />
                </div>
              ))}
            </div>

            <div className={styles.summaryDivider} />

            {/* Discount row */}
            <div className={styles.discountRow}>
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md shrink-0" />
            </div>

            <div className={styles.summaryDivider} />

            {/* Totals */}
            <div className={styles.totalsGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.totalRow}>
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
              ))}
            </div>

            <div className={styles.summaryDivider} />

            {/* Grand total */}
            <div className={styles.grandTotalRow}>
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-7 w-28 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE STICKY BAR SKELETON ── */}
      <div className={styles.mobileCheckoutBar}>
        <div className={styles.mobileCheckoutInner}>
          <div className={styles.mobileAmount}>
            <Skeleton className="h-2.5 w-10 rounded" />
            <Skeleton className="h-5 w-28 rounded" />
          </div>
          <Skeleton className={styles.mobilePlaceOrderBtn} />
        </div>
      </div>
    </>
  );
}
