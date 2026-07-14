'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ProductCardAddToCartButtonClient = dynamic(
  () => import('@/components/ProductCardAddToCartButtonClient'),
  { ssr: false }
);

function AddToCartSkeleton({ mode }) {
  if (mode === 'icon') {
    return (
      <Skeleton className="size-9 sm:size-10 shrink-0 rounded-full" aria-hidden="true" />
    );
  }
  return <Skeleton className="w-full h-8 sm:h-9 rounded-md" aria-hidden="true" />;
}

export default function ProductCardAddToCartButton(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <AddToCartSkeleton mode={props.mode} />;
  }

  return (
    <Suspense fallback={<AddToCartSkeleton mode={props.mode} />}>
      <ProductCardAddToCartButtonClient {...props} />
    </Suspense>
  );
}
