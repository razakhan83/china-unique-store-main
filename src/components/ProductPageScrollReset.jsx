'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

function isProductDetailPath(pathname) {
  return /^\/products\/[^/]+/.test(pathname || '');
}

export default function ProductPageScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (!isProductDetailPath(pathname)) return;

    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [pathname]);

  return null;
}
