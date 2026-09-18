'use client';

import { useLayoutEffect } from 'react';

export default function ProductPageScrollReset() {
  useLayoutEffect(() => {
    // Immediate pre-paint scroll reset to prevent post-mount visual jumps
    if (typeof window !== 'undefined' && window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, []);

  return null;
}
