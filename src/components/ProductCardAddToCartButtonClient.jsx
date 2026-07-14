'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

  const pathname = usePathname();

  useEffect(() => {
    setAnimationState('idle');
    return () => {
      if (settleTimeoutRef.current) {
        window.clearTimeout(settleTimeoutRef.current);
      }
    };
  }, [pathname]);

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
          "absolute right-2.5 top-[3.25rem] z-10 hidden size-9 items-center justify-center rounded-full border border-border/60 bg-background/92 p-0 text-foreground shadow-xs backdrop-blur-md outline-none transition-all duration-300 ease-out hover:scale-[1.1] hover:-translate-y-0.5 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring/50 md:inline-flex md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-[0_4px_12px_rgba(16,185,129,0.2)]",
          isOutOfStock && "pointer-events-none opacity-40",
          (isBusy || isLoading) && "pointer-events-none opacity-60"
        )}
        aria-label="Add to cart"
      >
        <span className="relative block size-4.5">
          {isLoading ? (
            <Spinner className="absolute inset-0 size-4.5" />
          ) : (
            <ShoppingCart className="absolute inset-0 size-4.5 transition-all duration-300 ease-out text-emerald-600" />
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
        
        // Reset loading state after a delay in case navigation takes too long or user navigates back
        settleTimeoutRef.current = window.setTimeout(() => {
          setAnimationState('idle');
        }, 1200);
      }}
      data-state={animationState}
      aria-busy={isBusy}
      className={cn(
        "group w-full rounded-lg font-semibold transition-all duration-300 ease-out h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-[13px] border border-solid shadow-sm relative overflow-hidden",
        isOutOfStock
          ? "cursor-not-allowed text-muted-foreground/80 bg-[#f3f4f6] border-transparent"
          : "bg-primary text-white border-transparent hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(1,83,71,0.3)] hover:-translate-y-0.5 active:scale-[0.98]"
      )}
      aria-label={isOutOfStock ? "Out of Stock" : "Buy Now"}
    >
      <span className="relative flex items-center justify-center">
        {isLoading ? (
          <Spinner className="size-4 mr-1.5" />
        ) : null}
        <span>{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
        {!isOutOfStock && !isLoading && (
          <ShoppingCart className="absolute left-full ml-1.5 size-3.5 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
        )}
      </span>
    </Button>
  );
}
