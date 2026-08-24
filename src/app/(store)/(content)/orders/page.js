import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import { authOptions } from '@/lib/auth';
import { getStoreSettings, getUserOrders } from '@/lib/data';
import { getSiteUrl } from '@/lib/siteUrl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import GuestOrderLookupForm from '@/components/GuestOrderLookupForm';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import LinkOrdersForm from '@/components/LinkOrdersForm';
import OrdersClient from './OrdersClient';

export const metadata = {
  title: 'My Orders | Kifayatly',
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersPageSkeleton() {
  return (
    <main className="w-full bg-background pt-4 pb-12 sm:pt-8 sm:pb-16 px-4">
      <div className="w-full max-w-xl mx-auto animate-pulse">
        <div className="text-center sm:text-left mb-5 sm:mb-6">
          <div className="h-7 sm:h-8 w-48 bg-muted rounded-md mb-1.5 mx-auto sm:mx-0" />
          <div className="h-4 w-64 bg-muted rounded-md mx-auto sm:mx-0" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="h-4 w-20 bg-muted rounded mb-1.5" />
            <div className="h-11 w-full bg-muted/60 rounded-lg" />
          </div>
          <div>
            <div className="h-4 w-28 bg-muted rounded mb-1.5" />
            <div className="h-11 w-full bg-muted/60 rounded-lg" />
          </div>
          <div className="h-11 w-full bg-primary/20 rounded-lg mt-2" />
        </div>

        <div className="mt-6 pt-5 border-t border-border/80 text-center">
          <div className="h-4 w-52 bg-muted rounded mx-auto" />
        </div>

        {/* Benefits Skeleton */}
        <div className="mt-8 pt-6 border-t border-border/80 space-y-3">
          <div className="h-4 w-36 bg-muted rounded mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                <div className="h-3.5 w-24 bg-muted rounded" />
                <div className="h-3 w-full bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

async function OrdersContent() {
  const [session, settings] = await Promise.all([
    getServerSession(authOptions),
    getStoreSettings(),
  ]);
  const siteUrl = getSiteUrl();
  const invoiceBranding = {
    storeName: settings.storeName,
    supportEmail: settings.supportEmail,
    businessAddress: settings.businessAddress,
    lightLogoUrl: settings.lightLogoUrl,
    darkLogoUrl: settings.darkLogoUrl,
    invoiceLogoScalePercent: settings.invoiceLogoScalePercent,
    baseUrl: siteUrl,
    returnPolicyUrl: `${siteUrl}/refund-policy`,
  };

  if (!session) {
    return (
      <main className="w-full bg-background pt-4 pb-12 sm:pt-8 sm:pb-16 px-4">
        <div className="w-full max-w-xl mx-auto">
          {/* Clean Page Header */}
          <div className="text-center sm:text-left mb-5 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Track Your Order
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Enter your details below to check live shipping and tracking updates.
            </p>
          </div>

          {/* Direct Clean Form */}
          <GuestOrderLookupForm />

          {/* Clean Account Link */}
          <div className="mt-6 pt-5 border-t border-border/80 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Have an account?{' '}
              <Link 
                href="/auth/signin" 
                className="font-semibold text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Sign in to view all your orders
              </Link>
            </p>
          </div>

          {/* Account Benefits Section */}
          <div className="mt-8 pt-6 border-t border-border/80">
            <div className="text-center sm:text-left mb-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Benefits of Having an Account
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <h3 className="text-xs font-semibold text-foreground">1-Click Tracking</h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Instant order status without typing details.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <h3 className="text-xs font-semibold text-foreground">PDF Invoices</h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Download digital receipts whenever needed.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <h3 className="text-xs font-semibold text-foreground">Faster Checkout</h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Save addresses for rapid ordering.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const rawOrders = await getUserOrders(session.user.email);
  const orders = rawOrders;

  return (
    <main className="min-h-screen bg-white pb-16 pt-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 hidden">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Orders</h1>
          <p className="mt-2 text-muted-foreground">Track and manage your previous orders.</p>
        </div>

        {orders.length === 0 ? (
          <div className="space-y-8">
            <Empty className="surface-card rounded-xl border border-dashed border-border py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="size-16 rounded-full bg-muted text-muted-foreground">
                  <ShoppingBag className="size-8" />
                </EmptyMedia>
                <EmptyTitle className="text-xl font-semibold text-foreground">No orders yet</EmptyTitle>
                <EmptyDescription>You haven&apos;t placed any orders with this account yet.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/products" />} nativeButton={false}>
                  Start Shopping
                </Button>
              </EmptyContent>
            </Empty>
            
            <div className="pt-4 border-t border-border">
              <LinkOrdersForm />
            </div>
          </div>
        ) : (
          <OrdersClient initialOrders={orders} invoiceBranding={invoiceBranding} />
        )}
      </div>
    </main>
  );
}
