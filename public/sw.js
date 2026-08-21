const CACHE_NAME = 'china-unique-shell-v1';
const ASSETS_CACHE = 'china-unique-assets-v1';

// Install event: cache core shell immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== ASSETS_CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event: Instant App Shell delivery
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip localhost/dev, non-GET, API requests, NextAuth, Admin routes, or Cloudinary uploads
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/auth')
  ) {
    return;
  }

  // 2. Static Chunks, Fonts, and Next Static Files: Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // 3. HTML Page Navigations: Stale-While-Revalidate (Instant 0ms Page Shell, No Blank Screen)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // If cached page exists, return it instantly (0ms blank time)
        // while fetchPromise runs in the background to update the cache
        return cachedResponse || fetchPromise;
      })
    );
  }
});
