'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function AuthModal({ open, onOpenChange, callbackUrl }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (open) {
      const resolvedCallbackUrl = callbackUrl || `${pathname || '/'}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(resolvedCallbackUrl)}`);
      if (onOpenChange) onOpenChange(false);
    }
  }, [open, router, callbackUrl, pathname, searchParams, onOpenChange]);

  return null;
}
