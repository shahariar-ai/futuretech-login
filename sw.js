/* =========================================================
   FutureTech.ai service worker
   ---------------------------------------------------------
   - Caches this site's own static files (HTML, CSS, JS, icons)
     so the app opens quickly and shows a clear offline page.
   - NEVER caches or even touches requests to Supabase
     (*.supabase.co), auth endpoints, or any other site: those
     go straight to the network, handled by the browser.
   - Network first: when online you always get the newest
     files; the cache is only a fallback when offline.
   - Bump CACHE_VERSION when files change; old caches are
     deleted on activate.
   ========================================================= */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `futuretech-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  'index.html',
  'dashboard.html',
  'reset-password.html',
  'offline.html',
  'manifest.webmanifest',
  'css/tokens.css',
  'css/base.css',
  'css/lamp.css',
  'css/card.css',
  'css/dashboard.css',
  'js/vt-guard.js',
  'js/config.js',
  'js/validation.js',
  'js/auth/auth-service.js',
  'js/auth/errors.js',
  'js/auth/demo-provider.js',
  'js/auth/supabase-provider.js',
  'js/auth/firebase-provider.js',
  'js/ui/app-shell.js',
  'js/ui/feedback.js',
  'js/ui/lamp.js',
  'js/ui/panels.js',
  'js/ui/pwa.js',
  'js/ui/strength.js',
  'js/ui/transitions.js',
  'js/pages/login.js',
  'js/pages/dashboard.js',
  'js/pages/reset-password.js',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('futuretech-') && key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/** Only same-origin GET requests for our own files. Everything else is left alone. */
function isCacheable(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false; // Supabase, CDN, fonts: never cached
  if (url.hostname.endsWith('.supabase.co')) return false;
  if (/\/(auth|rest|realtime|storage|functions)\/v\d/.test(url.pathname)) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  if (!isCacheable(event.request)) return;
  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  } catch (error) {
    const isPage = request.mode === 'navigate';
    const cached = await cache.match(request, { ignoreSearch: isPage });
    if (cached) return cached;
    if (isPage) return (await cache.match('offline.html')) || Response.error();
    return Response.error();
  }
}
