'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-md border-l bg-background shadow-xl sm:w-[26rem] flex flex-col p-6 pointer-events-none">
       <div className="flex items-center justify-between border-b pb-4 mb-4">
         <Skeleton className="h-6 w-32 rounded" />
         <Skeleton className="size-8 rounded-full" />
       </div>
       <div className="flex-1 space-y-6 mt-4">
         <Skeleton className="h-28 w-full rounded-xl" />
         <Skeleton className="h-28 w-full rounded-xl" />
         <Skeleton className="h-28 w-full rounded-xl" />
       </div>
    </div>
  ),
});

function scheduleDeferredMount(callback) {
  if (typeof window === 'undefined') return () => {};

  let cleanedUp = false;
  let timeoutId = null;
  let idleId = null;

  const detachListeners = () => {
    window.removeEventListener('pointerdown', run);
    window.removeEventListener('keydown', run);
    window.removeEventListener('focus', run);
  };

  const run = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    detachListeners();
    if (timeoutId != null) window.clearTimeout(timeoutId);
    if (idleId != null && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleId);
    }
    callback();
  };

  window.addEventListener('pointerdown', run, { once: true, passive: true });
  window.addEventListener('keydown', run, { once: true });
  window.addEventListener('focus', run, { once: true });

  if ('requestIdleCallback' in window) {
    idleId = window.requestIdleCallback(run, { timeout: 1000 });
  } else {
    timeoutId = window.setTimeout(run, 500);
  }

  return () => {
    cleanedUp = true;
    detachListeners();
    if (timeoutId != null) window.clearTimeout(timeoutId);
    if (idleId != null && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleId);
    }
  };
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
      <CartDrawer whatsappNumber={whatsappNumber} storeName={storeName} />
    </>
  );
}
