'use client';

import { useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminErrorState({
  title = 'Unable to load data',
  description = 'An error occurred while fetching information from the server.',
  onRetry,
  className,
}) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className={cn(
        'surface-card flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 sm:p-12 text-center text-balance',
        className
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
        <AlertCircle className="size-7 stroke-[1.75]" />
      </div>

      <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {onRetry && (
        <div className="mt-6">
          <Button
            onClick={handleRetry}
            disabled={retrying}
            variant="outline"
            className="rounded-xl font-bold text-xs sm:text-sm border-destructive/30 hover:bg-destructive/10 text-destructive active:scale-[0.98]"
          >
            <RotateCcw className={cn('mr-1.5 size-4', retrying && 'animate-spin')} />
            {retrying ? 'Retrying...' : 'Try Again'}
          </Button>
        </div>
      )}
    </div>
  );
}
