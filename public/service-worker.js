// public/service-worker.js
// InferProbe Service Worker for offline support

const CACHE_NAME = 'inferprobe-v1';
const STATIC_CACHE = 'inferprobe-static-v1';
const DYNAMIC_CACHE = 'inferprobe-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE &&
                   name.startsWith('inferprobe-');
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response for caching
          const responseClone = response.clone();
          
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[Service Worker] Serving cached API response');
              return cachedResponse;
            }
            
            // Return offline response
            return new Response(
              JSON.stringify({
                offline: true,
                error: 'Network unavailable',
                message: 'Using cached data or mock responses'
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((response) => {
        // Don't cache if not successful
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        const responseClone = response.clone();
        
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        
        return response;
      });
    })
  );
});

// Background sync for pending data
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-pending-tests') {
    event.waitUntil(
      syncPendingTests()
    );
  }
});

// Sync pending tests to server
async function syncPendingTests() {
  try {
    // This would typically read from IndexedDB or postMessage to main thread
    console.log('[Service Worker] Syncing pending tests...');
    
    // Post message to all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_REQUESTED',
        timestamp: Date.now()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    return Promise.reject(error);
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
