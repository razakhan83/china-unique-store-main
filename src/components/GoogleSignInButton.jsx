'use client';

import { Button } from '@/components/ui/button';
import { usePathname, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function GoogleSignInButton({ className }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = `${pathname || '/'}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  return (
    <Button
      variant="outline"
      className={`relative flex w-full items-center justify-center gap-3 border-border bg-background py-6 font-medium text-foreground transition-all hover:bg-muted/50 ${className}`}
      onClick={() => signIn('google', { callbackUrl })}
    >
      <svg
        className="size-5 text-primary"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" className="fill-primary/10 stroke-primary/25" strokeWidth="1.5" />
        <path
          d="M16.8 12.35c0-.46-.04-.89-.12-1.31H12v2.48h2.66c-.12.72-.54 1.33-1.15 1.74v1.98h1.86c1.09-1 1.73-2.48 1.73-4.89z"
          className="fill-primary"
        />
        <path
          d="M12 17.5c1.56 0 2.87-.51 3.82-1.39l-1.87-1.45c-.52.34-1.17.55-1.95.55-1.5 0-2.77-1.01-3.22-2.37H6.86v1.49c.95 1.88 2.89 3.17 5.14 3.17z"
          className="fill-primary/80"
        />
        <path
          d="M8.78 12.84A3.9 3.9 0 0 1 8.6 11.7c0-.39.06-.77.18-1.14V9.07H6.86a5.9 5.9 0 0 0 0 5.26l1.92-1.49z"
          className="fill-muted-foreground/80"
        />
        <path
          d="M12 8.18c.85 0 1.61.29 2.22.86l1.66-1.66C14.87 6.45 13.56 5.9 12 5.9c-2.25 0-4.19 1.29-5.14 3.17l1.92 1.49c.45-1.36 1.72-2.38 3.22-2.38z"
          className="fill-accent-foreground"
        />
      </svg>
      <span>Sign in with Google</span>
      
    </Button>
  );
}
