import { Suspense } from 'react';

import CheckoutPageSkeleton from '@/components/CheckoutPageSkeleton';
import { getStoreSettings } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import CheckoutClient from './CheckoutClient';
import styles from './CheckoutClient.module.css';

export const metadata = {
  title: 'Checkout',
  description: 'Complete your order at China Unique Store.',
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutPageSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}

async function CheckoutContent() {
  const settings = await getStoreSettings();
  return (
    <main className="min-h-screen bg-background pb-36 pt-6 md:pb-16 md:pt-8">
      <div className={cn('container mx-auto max-w-6xl px-4', styles.pageShell)}>
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Checkout</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <section className={cn('mb-6 md:mb-8', styles.intro, styles.enter)} style={{ '--checkout-delay': '40ms' }}>
          <div className={styles.introHeader}>
            <h1 className={cn('text-3xl font-bold tracking-tight text-foreground sm:text-4xl', styles.title)}>Checkout</h1>
            <p className={styles.lede}>Delivery details and order summary.</p>
          </div>
        </section>

        <CheckoutClient settings={settings} />
      </div>
    </main>
  );
}
