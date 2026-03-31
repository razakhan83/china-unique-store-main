'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

import AuthModal from '@/components/AuthModal';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';

export default function ProductWishlistButton({ product, mode = 'grid', className = '' }) {
  const { data: session } = useSession();
  const { isWishlisted, toggleWishlist } = useWishlist() || {};
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productId = String(product?._id || product?.id || product?.slug || '').trim();
  const active = typeof isWishlisted === 'function' ? isWishlisted(productId) : false;
  const callbackUrl = `/products/${product?.slug || product?._id || product?.id || ''}`;

  async function handleToggle(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!session) {
      await toggleWishlist?.(product);
      setIsAuthModalOpen(true);
      return;
    }

    if (!productId || typeof toggleWishlist !== 'function' || isSubmitting) return;

    setIsSubmitting(true);
    const nextAction = active ? 'removed from' : 'saved to';
    const result = await toggleWishlist(product);
    setIsSubmitting(false);

    if (result?.success) {
      toast.success(`${product?.Name || product?.name || 'Item'} ${nextAction} wishlist.`);
      return;
    }

    toast.error('Unable to update wishlist right now.');
  }

  if (mode === 'detail') {
    return (
      <>
        <button
          type="button"
          role="checkbox"
          aria-checked={active}
          aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleToggle}
          disabled={isSubmitting}
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[color:color-mix(in_oklab,var(--color-primary)_16%,var(--color-border))] bg-[color:color-mix(in_oklab,var(--color-input)_92%,white)] px-4 text-sm font-medium text-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--color-background)_65%,white)] transition-[border-color,background-color,box-shadow,color,transform] duration-200 hover:bg-[color:color-mix(in_oklab,var(--color-muted)_74%,white)] hover:text-foreground active:scale-[0.96]',
            active && 'border-destructive/25 text-destructive',
            isSubmitting && 'pointer-events-none',
            className,
          )}
        >
          <Heart className={cn('size-4', active && 'fill-destructive stroke-destructive')} />
          <span className="hidden sm:inline">{active ? 'Saved' : 'Save'}</span>
        </button>
        <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} callbackUrl={callbackUrl} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        role="checkbox"
        aria-checked={active}
        aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
        data-slot="checkbox"
        data-state={active ? 'checked' : 'unchecked'}
        value="on"
        onClick={handleToggle}
        disabled={isSubmitting}
        className={cn(
          "group/wishlist absolute right-2.5 top-2.5 z-10 hidden size-8 items-center justify-center rounded-full border border-border/60 bg-background/92 p-0 text-foreground shadow-xs backdrop-blur-md outline-none transition-[transform,opacity,border-color,box-shadow,color,background-color] duration-200 ease-out hover:scale-[1.03] active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring/50 md:inline-flex md:hover:border-destructive/30 md:hover:text-destructive md:hover:shadow-sm after:absolute after:-inset-2 after:content-['']",
          active
            ? 'border-destructive/30 bg-background text-destructive opacity-100'
            : 'md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100',
          isSubmitting && 'pointer-events-none',
          className,
        )}
      >
        <span className="relative block size-4">
          <Heart
            className={cn(
              'absolute inset-0 size-4 transition-all duration-200 ease-out md:group-hover/wishlist:text-destructive/70',
              active ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
            )}
          />
          <Heart
            className={cn(
              'absolute inset-0 size-4 fill-destructive stroke-destructive transition-all duration-200 ease-out',
              active ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            )}
          />
        </span>
      </button>
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} callbackUrl={callbackUrl} />
    </>
  );
}
