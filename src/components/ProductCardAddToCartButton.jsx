'use client';

import { useEffect, useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function ProductCardAddToCartButton({ product, isOutOfStock = false }) {
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

  if (isOutOfStock) {
    return (
      <span className="inline-flex min-h-8 items-center justify-center rounded-md border border-border bg-muted/35 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Out of Stock
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={isBusy}
      onClick={handleAddToCart}
      data-state={animationState}
      aria-busy={isBusy}
      className="add-to-cart-button product-card-add-to-cart-button relative translate-y-0.5 size-9 cursor-pointer touch-manipulation rounded-md bg-transparent p-0 text-primary shadow-none transition-[transform,background-color,color,box-shadow] duration-200 ease-out hover:bg-primary/10 hover:text-primary active:scale-[0.96] active:bg-primary/10 active:text-primary disabled:pointer-events-none after:absolute after:-inset-2 after:content-[''] sm:size-8 sm:translate-y-0"
      aria-label="Add to cart"
    >
      <span className="relative inline-flex size-[1.25rem] items-center justify-center sm:size-[1.125rem]">
        <span
          className={cn(
            "add-to-cart-icon absolute inline-flex size-[1.25rem] items-center justify-center text-primary sm:size-[1.125rem]",
            isLoading ? "is-visible" : ""
          )}
          aria-hidden="true"
          data-cart-icon="loader"
        >
          <Spinner className="size-[1.25rem] [animation-duration:520ms] sm:size-[1.125rem]" />
        </span>
        <ShoppingCart
          className={cn(
            "add-to-cart-icon absolute size-[1.25rem] text-primary sm:size-[1.125rem]",
            !isLoading ? "is-visible" : ""
          )}
          aria-hidden="true"
          data-cart-icon="cart"
        />
      </span>
    </Button>
  );
}
