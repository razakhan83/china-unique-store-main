import { Suspense } from 'react';
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pb-16 pt-8"><div className="container mx-auto max-w-4xl px-4 animate-pulse"><div className="h-10 w-48 bg-muted rounded mb-2"></div><div className="h-4 w-64 bg-muted rounded mb-8"></div><div className="h-96 w-full bg-muted rounded-xl"></div></div></div>}>
      <OrdersContent />
    </Suspense>
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
      <main className="min-h-screen bg-muted/10 pb-20 pt-10 sm:pt-16">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Track Your Order</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Use your order ID and phone number to track your package as a guest, or sign in to your account to view your complete order history.
            </p>
          </div>

          <div className="flex flex-col space-y-12">
            <div className="w-full">
              <GuestOrderLookupForm />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-muted/10 px-4 text-muted-foreground font-medium">Or</span>
              </div>
            </div>

            <div className="w-full">
              <Empty className="surface-card rounded-2xl border border-border/50 shadow-sm bg-background py-10 px-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 pointer-events-none blur-2xl"></div>
                <div className="absolute -left-8 -bottom-8 size-32 rounded-full bg-primary/5 pointer-events-none blur-2xl"></div>
                
                <EmptyHeader className="relative z-10 w-full flex flex-col items-center">
                  <EmptyMedia variant="icon" className="size-16 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm mb-4 mx-auto">
                    <ShoppingBag className="size-8" />
                  </EmptyMedia>
                  <EmptyTitle className="text-2xl font-bold text-foreground">Have an account?</EmptyTitle>
                  <EmptyDescription className="text-base mt-3 max-w-md mx-auto leading-relaxed">
                    Sign in to view all your past orders, save favorites, and enjoy a faster checkout experience.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="relative z-10 mt-8">
                  <Button render={<Link href="/auth/signin" />} nativeButton={false} className="h-12 px-10 rounded-full font-semibold shadow-sm transition-all duration-300 hover:shadow-md text-base">
                    Sign In to Your Account
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
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
