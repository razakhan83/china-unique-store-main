'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'completing'
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const isNavigatingRef = useRef(false);

  // Complete progress on pathname or searchParams change
  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      setProgress(100);
      setState('completing');

      const timeout = setTimeout(() => {
        setState('idle');
        setProgress(0);
      }, 250);

      return () => clearTimeout(timeout);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleLinkClick = (event) => {
      // Find closest anchor tag
      const anchor = event.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore external links, hash anchors, new tabs, downloads, mailto, tel
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.defaultPrevented
      ) {
        return;
      }

      // Check if same URL
      try {
        const url = new URL(anchor.href, window.location.href);
        const current = new URL(window.location.href);

        if (url.origin !== current.origin) return;
        if (url.pathname === current.pathname && url.search === current.search) {
          return;
        }

        // Internal navigation detected - trigger instant progress bar
        isNavigatingRef.current = true;
        setState('loading');
        setProgress(28);

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              clearInterval(timerRef.current);
              return 85;
            }
            return prev + Math.random() * 12;
          });
        }, 180);
      } catch {
        // Safe fail
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (state === 'idle') return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-0 z-[99999] h-[2.5px] overflow-hidden bg-transparent"
    >
      <div
        className="h-full bg-emerald-500 shadow-[0_0_12px_#10b981,0_0_4px_#064e3b] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: state === 'completing' ? '180ms' : '220ms',
          opacity: state === 'completing' ? 0.85 : 1,
        }}
      />
    </div>
  );
}

export default function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarInner />
    </Suspense>
  );
}
