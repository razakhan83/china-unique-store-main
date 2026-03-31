'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import AuthModal from './AuthModal';
import { cn } from '@/lib/utils';

export default function MyWishlistButton({ className, isMobile = false }) {
  const { data: session } = useSession();
  const { setIsSidebarOpen } = useCartActions() || {};
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  function handleClick() {
    if (session) {
      if (typeof setIsSidebarOpen === 'function') {
        setIsSidebarOpen(false);
      }
      router.push('/wishlist');
    } else {
      setIsAuthModalOpen(true);
    }
  }

  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          onClick={handleClick}
          className={cn(
            'h-auto w-full justify-start rounded-xl bg-muted/60 px-3.5 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted',
            className
          )}
        >
          <Heart className="size-4" />
          Wishlist
        </Button>
        <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} callbackUrl="/wishlist" />
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={handleClick}
        className={cn('text-muted-foreground hover:bg-muted hover:text-foreground gap-2', className)}
      >
        <Heart className="size-4" />
        Wishlist
      </Button>
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} callbackUrl="/wishlist" />
    </>
  );
}
