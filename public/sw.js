// Summer Base Camp service worker — app-shell offline support.
// Strategy: network-first for navigation (so deploys land fast + Firebase data
// stays live), cache-first for static assets, with a cached shell fallback when
// offline. Bump CACHE on each release so old assets are evicted.
const CACHE = 'sbc-v2'
const SHELL = ['/', '/index.html', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Never intercept Firebase / Google API traffic — let it hit the network.
  if (url.origin !== self.location.origin) return
  // Never intercept Firebase's reserved auth handler (/__/auth/...). It must be
  // served first-party for popup/redirect sign-in to work.
  if (url.pathname.startsWith('/__/')) return

  // Navigations: try network, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => { caches.open(CACHE).then((c) => c.put('/index.html', res.clone())); return res })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // Static assets: cache-first, then network (and cache the result).
  e.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (res.ok && res.type === 'basic') caches.open(CACHE).then((c) => c.put(request, res.clone()))
      return res
    }).catch(() => hit)),
  )
})
