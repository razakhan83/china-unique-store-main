'use client';

import dynamic from 'next/dynamic';

import { Spinner } from '@/components/ui/spinner';

const ProductCardAddToCartButtonClient = dynamic(
  () => import('@/components/ProductCardAddToCartButtonClient'),
  {
    loading: () => (
      <span
        aria-hidden="true"
        className="inline-flex size-9 items-center justify-center rounded-md border border-border/70 bg-background/85 text-muted-foreground sm:size-8"
      >
        <Spinner className="size-4 opacity-70" />
      </span>
    ),
  }
);

export default function ProductCardAddToCartButton(props) {
  return <ProductCardAddToCartButtonClient {...props} />;
}
