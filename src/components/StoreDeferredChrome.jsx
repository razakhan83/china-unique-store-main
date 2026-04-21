'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const FloatingWhatsApp = dynamic(() => import('@/components/FloatingWhatsApp'), {
  ssr: false,
  loading: () => null,
});

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), {
  ssr: false,
  loading: () => null,
});

function scheduleDeferredMount(callback) {
  if (typeof window === 'undefined') return () => {};

  if ('requestIdleCallback' in window) {
    const idleId = window.requestIdleCallback(callback, { timeout: 1200 });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(callback, 700);
  return () => window.clearTimeout(timeoutId);
}

export default function StoreDeferredChrome({ whatsappNumber = '', storeName = 'China Unique Store' }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    return scheduleDeferredMount(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) return null;

  return (
    <>
      <FloatingWhatsApp whatsappNumber={whatsappNumber} storeName={storeName} />
      <CartDrawer whatsappNumber={whatsappNumber} storeName={storeName} />
    </>
  );
}
