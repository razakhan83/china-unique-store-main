'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminEmptyState({
  icon: Icon,
  title = 'No items found',
  description = 'There are currently no items in this view.',
  action,
  actionLabel,
  onAction,
  actionHref,
  actionIcon,
  secondaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionHref,
  secondaryActionIcon,
  className,
}) {
  const resolvedAction = action || (actionLabel ? {
    label: actionLabel,
    onClick: onAction,
    href: actionHref,
    icon: actionIcon,
  } : null);

  const resolvedSecondaryAction = secondaryAction || (secondaryActionLabel ? {
    label: secondaryActionLabel,
    onClick: onSecondaryAction,
    href: secondaryActionHref,
    icon: secondaryActionIcon,
  } : null);

  return (
    <div
      className={cn(
        'surface-card flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center text-balance',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
          <Icon className="size-7 stroke-[1.75]" />
        </div>
      )}

      <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {(resolvedAction || resolvedSecondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {resolvedAction && (
            resolvedAction.href ? (
              <Button asChild className="rounded-xl font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98]">
                <Link href={resolvedAction.href}>
                  {resolvedAction.icon && <resolvedAction.icon className="mr-1.5 size-4" />}
                  {resolvedAction.label}
                </Link>
              </Button>
            ) : resolvedAction.onClick ? (
              <Button
                onClick={resolvedAction.onClick}
                className="rounded-xl font-bold text-xs sm:text-sm shadow-xs active:scale-[0.98]"
              >
                {resolvedAction.icon && <resolvedAction.icon className="mr-1.5 size-4" />}
                {resolvedAction.label}
              </Button>
            ) : (
              resolvedAction
            )
          )}

          {resolvedSecondaryAction && (
            resolvedSecondaryAction.href ? (
              <Button asChild variant="outline" className="rounded-xl font-semibold text-xs sm:text-sm border-border active:scale-[0.98]">
                <Link href={resolvedSecondaryAction.href}>
                  {resolvedSecondaryAction.icon && <resolvedSecondaryAction.icon className="mr-1.5 size-4" />}
                  {resolvedSecondaryAction.label}
                </Link>
              </Button>
            ) : resolvedSecondaryAction.onClick ? (
              <Button
                variant="outline"
                onClick={resolvedSecondaryAction.onClick}
                className="rounded-xl font-semibold text-xs sm:text-sm border-border active:scale-[0.98]"
              >
                {resolvedSecondaryAction.icon && <resolvedSecondaryAction.icon className="mr-1.5 size-4" />}
                {resolvedSecondaryAction.label}
              </Button>
            ) : (
              resolvedSecondaryAction
            )
          )}
        </div>
      )}
    </div>
  );
}
