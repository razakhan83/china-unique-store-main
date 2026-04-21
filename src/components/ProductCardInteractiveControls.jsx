'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';

import ProductCardAddToCartButton from '@/components/ProductCardAddToCartButton';
import ProductCardWishlistSlot from '@/components/ProductCardWishlistSlot';

export default function ProductCardInteractiveControls({ product, isOutOfStock = false }) {
  const rootRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive || typeof window === 'undefined') return;

    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isActive]);

  return (
    <div ref={rootRef} className="contents">
      {isActive ? (
        <>
          <ProductCardWishlistSlot product={product} />
          <ProductCardAddToCartButton product={product} isOutOfStock={isOutOfStock} />
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="absolute right-2.5 top-2.5 z-10 hidden size-8 items-center justify-center rounded-full border border-border/60 bg-background/92 p-0 text-foreground/55 shadow-xs backdrop-blur-md md:inline-flex"
          >
            <Heart className="size-4" />
          </span>
          {isOutOfStock ? (
            <span
              aria-hidden="true"
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-border bg-muted/35 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Out of Stock
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex size-9 translate-y-0.5 items-center justify-center rounded-md bg-transparent p-0 text-primary/75 sm:size-8 sm:translate-y-0"
            >
              <ShoppingCart className="size-[1.25rem] sm:size-[1.125rem]" />
            </span>
          )}
        </>
      )}
    </div>
  );
}
