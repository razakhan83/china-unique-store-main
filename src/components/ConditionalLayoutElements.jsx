'use client';

import { usePathname } from 'next/navigation';

export default function ConditionalLayoutElements({ children }) {
  const pathname = usePathname();
  return <>{children}</>;
}
