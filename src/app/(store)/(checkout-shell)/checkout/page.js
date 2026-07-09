import { Suspense } from 'react';

import CheckoutPageSkeleton from '@/components/CheckoutPageSkeleton';
import { getStoreSettings, getProductsList } from '@/lib/data';

import CheckoutClient from './CheckoutClient';

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
  const productsPromise = await getProductsList({ limit: 12 });
  const relatedProducts = (productsPromise?.items || []).filter(p => p.StockStatus === 'In Stock' && p.showOnStore !== false);
  
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <CheckoutClient settings={settings} relatedProducts={relatedProducts} />
    </div>
  );
}
