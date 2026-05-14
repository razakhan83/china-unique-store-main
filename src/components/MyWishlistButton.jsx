'use client';

import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function MyWishlistButton({ className, isMobile = false }) {
  const { setIsSidebarOpen } = useCartActions() || {};
  const router = useRouter();

  function handleClick() {
    if (typeof setIsSidebarOpen === 'function') {
      setIsSidebarOpen(false);
    }
    router.push('/wishlist');
  }

  if (isMobile) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={handleClick}
        className={cn(
          'h-auto w-full justify-start rounded-xl bg-transparent px-3.5 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted',
          className
        )}
      >
        <Heart className="size-4" />
        Wishlist
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn('text-muted-foreground hover:bg-muted hover:text-foreground gap-2', className)}
    >
      <Heart className="size-4" />
      Wishlist
    </Button>
  );
}
