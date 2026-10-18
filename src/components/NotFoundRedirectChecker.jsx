'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFoundRedirectChecker() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname.toLowerCase().trim();

    // Check if there is a redirect rule configured
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success || !Array.isArray(data?.data?.urlRedirects)) return;
        const redirects = data.data.urlRedirects;
        const match = redirects.find((r) => {
          if (r.isEnabled === false) return false;
          const cleanSource = String(r.sourcePath || '').trim().toLowerCase();
          return cleanSource === currentPath || cleanSource.replace(/^\/+/, '') === currentPath.replace(/^\/+/, '');
        });

        if (match?.targetPath) {
          window.location.replace(match.targetPath);
        }
      })
      .catch(() => {});
  }, [router]);

  return null;
}
