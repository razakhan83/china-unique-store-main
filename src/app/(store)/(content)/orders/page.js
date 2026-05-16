import { getServerSession } from 'next-auth';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import { authOptions } from '@/lib/auth';
import { getStoreSettings, getUserOrders } from '@/lib/data';
import { getSiteUrl } from '@/lib/siteUrl';
import { Button } from '@/components/ui/button';
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

export default async function OrdersPage() {
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
      <main className="min-h-screen bg-background pb-16 pt-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Orders</h1>
            <p className="mt-2 text-muted-foreground">Track your order with your order ID and checkout phone number.</p>
          </div>

          <div className="space-y-8">
            <GuestOrderLookupForm />
            <Empty className="surface-card rounded-xl border border-dashed border-border py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="size-16 rounded-full bg-muted text-muted-foreground">
                  <ShoppingBag className="size-8" />
                </EmptyMedia>
                <EmptyTitle className="text-xl font-semibold text-foreground">Want your order history in one place?</EmptyTitle>
                <EmptyDescription>
                  Sign in to automatically connect your orders, save favorites, and check out faster next time.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/admin/login" />} nativeButton={false}>
                  Sign In
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        </div>
      </main>
    );
  }

  const rawOrders = await getUserOrders(session.user.email);
  const orders = rawOrders;

  return (
    <main className="min-h-screen bg-background pb-16 pt-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
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
