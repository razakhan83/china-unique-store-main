import Image from 'next/image';
import Link from 'next/link';
import { Store } from 'lucide-react';

import { cn } from '@/lib/utils';

function BrandFallback({ storeName = 'China Unique Store', invert = false, compact = false }) {
  const title = String(storeName || 'China Unique Store').trim() || 'China Unique Store';
  const shortName = title.replace(/\bstore\b/i, '').trim() || title;
  const iconClass = invert ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary';
  const titleClass = invert ? 'text-primary-foreground' : 'text-primary';
  const subtitleClass = invert ? 'text-primary-foreground/70' : 'text-muted-foreground';

  return (
    <>
      <div className={cn('flex items-center justify-center rounded-xl', compact ? 'size-11' : 'size-10', iconClass)}>
        <Store className="size-5" />
      </div>
      <div className="min-w-0">
        <p className={cn('truncate font-semibold uppercase tracking-[0.12em]', compact ? 'text-base' : 'text-sm', titleClass)}>
          {shortName}
        </p>
        <p className={cn('truncate text-xs', subtitleClass)}>Home and lifestyle store</p>
      </div>
    </>
  );
}

export default function StoreLogo({
  href = '/',
  storeName = 'China Unique Store',
  lightLogoUrl = '',
  darkLogoUrl = '',
  variant = 'dark-surface',
  className,
  priority = false,
  compact = false,
  onClick,
}) {
  const prefersLightLogo = variant === 'dark-surface';
  const preferredLogoUrl = prefersLightLogo ? lightLogoUrl : darkLogoUrl;
  const fallbackLogoUrl = prefersLightLogo ? darkLogoUrl : lightLogoUrl;
  const logoUrl = String(preferredLogoUrl || '').trim() || String(fallbackLogoUrl || '').trim();
  const hasLogo = Boolean(String(logoUrl || '').trim());
  const logoHeightClass = compact ? 'h-13' : 'h-12';

  return (
    <Link href={href} onClick={onClick} className={cn('flex min-w-0 items-center gap-3', className)}>
      {hasLogo ? (
        <Image
          src={logoUrl}
          alt={storeName || 'Store logo'}
          width={264}
          height={80}
          priority={priority}
          sizes={compact ? '208px' : '192px'}
          className={cn('w-auto shrink-0 object-contain', logoHeightClass)}
        />
      ) : (
        <BrandFallback storeName={storeName} invert={prefersLightLogo} compact={compact} />
      )}
    </Link>
  );
}
