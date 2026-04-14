'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LogIn, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function AuthModalContent({ open, onOpenChange, resolvedCallbackUrl }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center p-8">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LogIn className="size-8" />
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Track Your Orders</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            Please sign in to track your orders and enjoy faster checkouts with saved information.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-8 space-y-4">
          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={() => signIn('google', { callbackUrl: resolvedCallbackUrl })}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Sign in with Google
          </Button>
          
          <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            <span>It only takes a few seconds</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuthModalCurrentUrl(props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedCallbackUrl = `${pathname || '/'}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
  return <AuthModalContent {...props} resolvedCallbackUrl={resolvedCallbackUrl} />;
}

export default function AuthModal({ open, onOpenChange, callbackUrl }) {
  if (callbackUrl) {
    return <AuthModalContent open={open} onOpenChange={onOpenChange} resolvedCallbackUrl={callbackUrl} />;
  }

  return (
    <Suspense fallback={null}>
      <AuthModalCurrentUrl open={open} onOpenChange={onOpenChange} />
    </Suspense>
  );
}
