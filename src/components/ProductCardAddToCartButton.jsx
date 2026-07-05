'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

const ProductCardAddToCartButtonClient = dynamic(
  () => import('@/components/ProductCardAddToCartButtonClient'),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="inline-flex size-9 sm:size-8 rounded-md" aria-hidden="true" />
    ),
  }
);

export default function ProductCardAddToCartButton(props) {
  return <ProductCardAddToCartButtonClient {...props} />;
}
