import { Suspense } from 'react';
import { connection } from 'next/server';
import CartPageClient from './CartPageClient';
import { getStoreSettings } from '@/lib/data';

export const metadata = {
  title: 'Shopping Cart | China Unique Store',
  description: 'Review your items, calculate delivery rates, and proceed to checkout.',
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background pb-16 pt-6 sm:pt-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<CartPageSkeleton />}>
          <CartPageContent />
        </Suspense>
      </div>
    </main>
  );
}

async function CartPageContent() {
  await connection();
  const settings = await getStoreSettings().catch(() => ({}));

  return (
    <CartPageClient
      whatsappNumber={settings?.whatsappNumber || ''}
      storeName={settings?.storeName || 'China Unique Store'}
    />
  );
}

function CartPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-9 w-52 rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/60" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-muted/60 lg:col-span-4" />
      </div>
    </div>
  );
}
