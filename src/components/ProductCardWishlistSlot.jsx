'use client';

import dynamic from 'next/dynamic';

const ProductWishlistButton = dynamic(
  () => import('@/components/ProductWishlistButton'),
  {
    loading: () => null,
  }
);

export default function ProductCardWishlistSlot({ product }) {
  return <ProductWishlistButton product={product} mode="grid" />;
}
