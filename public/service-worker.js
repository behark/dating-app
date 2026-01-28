// Service Worker for Dating App PWA
const IS_DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const log = (...args) => IS_DEV && console.log(...args);

const CACHE_NAME = 'dating-app-v1';
const STATIC_CACHE = 'dating-app-static-v1';
const DYNAMIC_CACHE = 'dating-app-dynamic-v1';
const IMAGE_CACHE = 'dating-app-images-v1';

// Static assets to cache on install
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.ico'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      log('[ServiceWorker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Force the waiting service worker to become active
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('dating-app-') &&
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== IMAGE_CACHE
            );
          })
          .map((name) => {
            log('[ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    // For images from external sources, use cache-first strategy
    if (request.destination === 'image') {
      event.respondWith(cacheFirstWithRefresh(request, IMAGE_CACHE));
    }
    return;
  }

  // API requests - network first with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE));
    return;
  }

  // Images - cache first
  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithRefresh(request, IMAGE_CACHE));
    return;
  }

  // HTML pages - network first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCache(request, STATIC_CACHE));
    return;
  }

  // Static assets - cache first
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// Cache strategies

// Cache first - try cache, fallback to network
async function cacheFirst(request, cacheName) {
  // Skip caching for HEAD requests (not supported by Cache API)
  if (request.method === 'HEAD') {
    return fetch(request).catch(() => new Response('Offline', { status: 503 }));
  }

  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    // Only cache GET requests
    if (request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Cache first with background refresh
async function cacheFirstWithRefresh(request, cacheName) {
  // Skip caching for HEAD requests (not supported by Cache API)
  if (request.method === 'HEAD') {
    return fetch(request).catch(() => new Response('', { status: 404 }));
  }

  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Start network request in background
  const networkPromise = fetch(request)
    .then((response) => {
      // Only cache GET requests
      if (request.method === 'GET') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Return placeholder for images
  return new Response('', { status: 404 });
}

// Network first with cache fallback
async function networkFirstWithCache(request, cacheName) {
  // Skip caching for HEAD requests (not supported by Cache API)
  if (request.method === 'HEAD') {
    return fetch(request).catch(() => new Response('Offline', { status: 503 }));
  }

  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);

    // Only cache successful GET responses
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  log('[ServiceWorker] Sync event:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }

  if (event.tag === 'sync-swipes') {
    event.waitUntil(syncSwipes());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  log('[ServiceWorker] Push received');

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'New notification';
  const options = {
    body: data.body || '',
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: data.renotify || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  log('[ServiceWorker] Notification click');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
      // Explicit return if no window can be opened (return undefined to satisfy promise/always-return)
      return undefined;
    })
  );
});

// Helper functions for background sync
async function syncMessages() {
  // This would sync pending messages from IndexedDB
  log('[ServiceWorker] Syncing messages...');
}

async function syncSwipes() {
  // This would sync pending swipes from IndexedDB
  log('[ServiceWorker] Syncing swipes...');
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
    );
  }
});
