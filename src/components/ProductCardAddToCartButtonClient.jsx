'use client';

import { useEffect, useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function ProductCardAddToCartButtonClient({ product, isOutOfStock = false }) {
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

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={isBusy || isOutOfStock}
      onClick={handleAddToCart}
      data-state={animationState}
      aria-busy={isBusy}
      className={cn(
        "add-to-cart-button product-card-add-to-cart-button relative translate-y-0.5 size-9 rounded-md p-0 shadow-none transition-[transform,background-color,color,box-shadow,opacity] duration-200 ease-out sm:size-8 sm:translate-y-0",
        isOutOfStock
          ? "cursor-not-allowed text-muted-foreground opacity-40 bg-transparent"
          : "cursor-pointer touch-manipulation bg-transparent text-primary hover:bg-primary/10 hover:text-primary active:scale-[0.96] active:bg-primary/10 active:text-primary disabled:pointer-events-none after:absolute after:-inset-2 after:content-['']"
      )}
      aria-label="Add to cart"
    >
      <span className="relative inline-flex size-[1.25rem] items-center justify-center sm:size-[1.125rem]">
        <span
          className={cn(
            'add-to-cart-icon absolute inline-flex size-[1.25rem] items-center justify-center text-inherit sm:size-[1.125rem]',
            isLoading ? 'is-visible' : ''
          )}
          aria-hidden="true"
          data-cart-icon="loader"
        >
          <Spinner className="size-[1.25rem] [animation-duration:520ms] sm:size-[1.125rem]" />
        </span>
        <ShoppingCart
          className={cn(
            'add-to-cart-icon absolute size-[1.25rem] text-inherit sm:size-[1.125rem]',
            !isLoading ? 'is-visible' : ''
          )}
          aria-hidden="true"
          data-cart-icon="cart"
        />
      </span>
    </Button>
  );
}
