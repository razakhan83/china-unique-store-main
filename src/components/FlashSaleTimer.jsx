'use client';

import { useEffect, useState } from 'react';
import { Badge as BadgeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function getRemaining(targetDate) {
  const end = new Date(targetDate).getTime();
  if (!targetDate || Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function useFlashSaleActive(targetDate) {
  const [active, setActive] = useState(Boolean(targetDate));

  useEffect(() => {
    if (!targetDate) {
      setActive(false);
      return undefined;
    }

    const tick = () => {
      const end = new Date(targetDate).getTime();
      setActive(Number.isFinite(end) && end > Date.now());
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return active;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function timeParts(remaining) {
  return [
    remaining.days > 0 ? `${remaining.days}d` : null,
    pad(remaining.hours),
    pad(remaining.minutes),
    pad(remaining.seconds),
  ].filter(Boolean);
}

function timeLabel(remaining) {
  return timeParts(remaining).join(':');
}

export default function FlashSaleTimer({ targetDate, variant = 'compact' }) {
  const [remaining, setRemaining] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const tick = () => {
      const next = getRemaining(targetDate);
      setRemaining(next);
      setChecked(true);
      return next;
    };

    if (!tick()) return undefined;

    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!remaining) {
    if (variant === 'full' && !checked) {
      return <div className="h-7" aria-hidden="true" />;
    }
    return null;
  }

  const spoken = `Offer ends in ${timeLabel(remaining)}`;

  if (variant === 'full') {
    const parts = timeParts(remaining);

    return (
      <div className="flex items-center gap-2.5" aria-label={spoken}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Ends in
        </span>
        <span className="inline-flex items-baseline gap-1 rounded-md bg-muted px-2 py-1 text-[15px] font-semibold leading-none tabular-nums tracking-tight text-foreground">
          {parts.map((part, index) => (
            <span key={`${index}-${part}`} className="inline-flex items-baseline gap-1">
              {index > 0 ? <span className="font-medium text-muted-foreground/45" aria-hidden="true">:</span> : null}
              {part}
            </span>
          ))}
        </span>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <span
        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold leading-none tabular-nums text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-md"
        aria-label={spoken}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-red-600">Ends</span>
        <span>{timeLabel(remaining)}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex h-6 items-center rounded-full border border-border bg-card px-2 text-[11px] font-semibold tabular-nums text-foreground" aria-label={spoken}>
      {timeLabel(remaining)}
    </span>
  );
}

function formatRupee(raw) {
  return `Rs. ${Number(raw || 0).toLocaleString('en-PK')}`;
}

export function FlashSaleCardBadge({ percentage, endsAt }) {
  const active = useFlashSaleActive(endsAt);
  if (!active) return null;

  return (
    <div className="relative flex h-8 w-8 flex-col items-center justify-center text-white drop-shadow-md md:h-16 md:w-16">
      <BadgeIcon className="absolute inset-0 size-full fill-current text-red-600" strokeWidth={0} />
      <div className="relative z-10 mt-[1px] flex flex-col items-center justify-center leading-none">
        <span className="mt-[1px] text-[9px] font-bold tabular-nums md:text-base">{percentage}%</span>
        <span className="mt-[0.5px] text-[6px] font-extrabold md:text-xs">OFF</span>
      </div>
    </div>
  );
}

export function FlashSaleCardPrice({ basePrice, salePrice, endsAt }) {
  const active = useFlashSaleActive(endsAt);
  const price = active ? salePrice : basePrice;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:gap-1.5">
      <p className="text-[14px] font-bold leading-none tabular-nums text-foreground @min-[260px]:text-[15px] sm:text-[16px]">
        {formatRupee(price)}
      </p>
      {active && Number(basePrice) > Number(price) ? (
        <p className="text-[10px] font-normal leading-none text-muted-foreground/60 line-through @min-[260px]:text-[11px] sm:text-[13px]">
          {formatRupee(basePrice)}
        </p>
      ) : null}
    </div>
  );
}

export function FlashSaleDetailPrice({ basePrice, salePrice, endsAt, compareAtPrice, active }) {
  const price = active ? salePrice : basePrice;
  const compare = active ? compareAtPrice : null;

  return (
    <div className="flex flex-col gap-3">
      {active ? <FlashSaleTimer targetDate={endsAt} variant="full" /> : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-lg font-bold tracking-tight text-foreground tabular-nums sm:text-xl">
          {formatRupee(price)}
        </span>
        {compare && Number(compare) > Number(price) ? (
          <span className="text-sm font-medium text-muted-foreground line-through tabular-nums">
            {formatRupee(compare)}
          </span>
        ) : null}
        {active && compare && Number(compare) > Number(price) ? (
          <Badge className="rounded border-none bg-success/10 px-2 py-0 text-[11px] font-medium text-success shadow-none">
            Save {formatRupee(Number(compare) - Number(price))}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
