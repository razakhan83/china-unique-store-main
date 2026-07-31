'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

function ConditionalLayoutInner({ children }) {
  const pathname = usePathname();
  if (pathname === '/checkout') return null;
  
  return <>{children}</>;
}

export default function ConditionalLayoutElements({ children }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <ConditionalLayoutInner>{children}</ConditionalLayoutInner>
    </Suspense>
  );
}
