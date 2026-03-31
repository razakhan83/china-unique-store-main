'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistClient() {
  const { items = [], isLoading } = useWishlist() || {};

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="aspect-[0.8] animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty className="surface-card rounded-xl border border-dashed border-border py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-16 rounded-full bg-muted text-muted-foreground">
            <Heart className="size-8" />
          </EmptyMedia>
          <EmptyTitle className="text-xl font-semibold text-foreground">Your wishlist is empty</EmptyTitle>
          <EmptyDescription>Save the products you love and come back to them anytime.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/products" />} nativeButton={false}>
            Continue Shopping
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((product) => (
        <ProductCard key={product._id || product.id || product.slug} product={product} />
      ))}
    </div>
  );
}
