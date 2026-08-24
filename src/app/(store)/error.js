'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function StoreError({ error, reset }) {
  useEffect(() => {
    // Log client error to console
    console.error('Store route error:', error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This section failed to load properly. Your cart and session are safe.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => reset()} variant="default" size="default">
          <RotateCcw className="mr-1.5 size-4" />
          Try again
        </Button>
        <Button onClick={() => { window.location.href = '/'; }} variant="outline" size="default">
          Go to Homepage
        </Button>
      </div>
    </section>
  );
}
