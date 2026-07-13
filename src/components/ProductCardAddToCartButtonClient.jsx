'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function ProductCardAddToCartButtonClient({ product, isOutOfStock = false, mode = "full" }) {
  const router = useRouter();
  const { addToCart } = useCartActions();
  const [animationState, setAnimationState] = useState('idle');
  const settleTimeoutRef = useRef(null);

  const isLoading = animationState === 'loading';
  const isBusy = animationState !== 'idle';

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) {
        window.clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  async function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();

    if (isOutOfStock || isBusy) return;

    setAnimationState('loading');
    try {
      const startedAt = performance.now();
      const [result] = await Promise.all([
        addToCart(product),
        new Promise((resolve) => {
          window.requestAnimationFrame(() => {
            const elapsed = performance.now() - startedAt;
            const remaining = Math.max(220 - elapsed, 0);
            window.setTimeout(resolve, remaining);
          });
        }),
      ]);

      if (!result?.success) {
        setAnimationState('idle');
        return;
      }

      setAnimationState('settling');
      settleTimeoutRef.current = window.setTimeout(() => {
        setAnimationState('idle');
        settleTimeoutRef.current = null;
      }, 80);
    } finally {
      if (settleTimeoutRef.current === null) {
        setAnimationState('idle');
      }
    }
  }

  if (mode === 'icon') {
    return (
      <button
        type="button"
        disabled={isBusy || isOutOfStock}
        onClick={handleAddToCart}
        data-state={animationState}
        aria-busy={isBusy}
        className={cn(
          "absolute right-2.5 top-[3.25rem] z-10 hidden size-8 items-center justify-center rounded-full border border-border/60 bg-background/92 p-0 text-foreground shadow-xs backdrop-blur-md outline-none transition-[transform,opacity,border-color,box-shadow,color,background-color] duration-200 ease-out hover:scale-[1.03] active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring/50 md:inline-flex md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:hover:border-emerald-600/50 md:hover:text-emerald-600 md:hover:shadow-sm",
          isOutOfStock && "pointer-events-none opacity-40",
          (isBusy || isLoading) && "pointer-events-none opacity-60"
        )}
        aria-label="Add to cart"
      >
        <span className="relative block size-4">
          {isLoading ? (
            <Spinner className="absolute inset-0 size-4" />
          ) : (
            <ShoppingCart className="absolute inset-0 size-4 transition-all duration-200 ease-out md:group-hover:text-emerald-600" />
          )}
        </span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      disabled={isBusy || isOutOfStock}
      onMouseEnter={() => {
        if (isOutOfStock) return;
        const productSlug = product.slug || product._id || product.id;
        router.prefetch(`/products/${productSlug}`);
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isOutOfStock || isBusy) return;
        setAnimationState('loading');
        const productSlug = product.slug || product._id || product.id;
        router.push(`/products/${productSlug}`);
      }}
      data-state={animationState}
      aria-busy={isBusy}
      className={cn(
        "w-full rounded-md font-semibold transition-colors duration-500 ease-out h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-[13px] border border-solid",
        isOutOfStock
          ? "cursor-not-allowed text-muted-foreground opacity-40 bg-muted border-border"
          : "bg-muted/20 text-foreground border-black/40 hover:bg-primary hover:text-primary-foreground hover:border-primary active:bg-primary active:text-primary-foreground active:border-primary active:scale-[0.98]"
      )}
      aria-label="Buy Now"
    >
      <span className="relative flex w-full items-center justify-center">
        {isLoading ? (
          <Spinner className="size-4 mr-2" />
        ) : null}
        <span>Buy Now</span>
      </span>
    </Button>
  );
}
