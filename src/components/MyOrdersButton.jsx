'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { useCartActions } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import AuthModal from './AuthModal';
import { cn } from '@/lib/utils';

export default function MyOrdersButton({ className, isMobile = false }) {
  const { data: session } = useSession();
  const { setIsSidebarOpen } = useCartActions() || {};
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleClick = () => {
    if (session) {
      if (typeof setIsSidebarOpen === 'function') {
        setIsSidebarOpen(false);
      }
      router.push('/orders');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          onClick={handleClick}
          className={cn(
            'h-auto w-full justify-start rounded-xl bg-transparent px-3.5 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted',
            className
          )}
        >
          <ClipboardList className="size-4" />
          My Orders
        </Button>
        <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} callbackUrl="/orders" />
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
        <ClipboardList className="size-4" />
        My Orders
      </Button>
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} callbackUrl="/orders" />
    </>
  );
}
