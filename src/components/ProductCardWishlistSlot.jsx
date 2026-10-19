'use client';

import ProductWishlistButton from '@/components/ProductWishlistButton';

export default function ProductCardWishlistSlot({ product }) {
  return <ProductWishlistButton product={product} mode="grid" />;
}
