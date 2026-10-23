/**
 * Service Worker — Formations Servants de Messe
 * Cache-first pour les ressources statiques, réseau d'abord pour l'API.
 */

var CACHE_NAME = 'formations-sm-v7';

var STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './animations.css',
  './app.js',
  './animations.js',
  './manifest.json',
  './logoservantdemesse.jpg',
  './logoeglise.jpeg'
];

var CDN_ORIGINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(STATIC_ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) {
        if (name !== CACHE_NAME) return caches.delete(name);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  // API : réseau d'abord (données fraîches), pas de cache
  if (url.pathname.indexOf('/api/') === 0) {
    event.respondWith(
      fetch(req).catch(function () {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Statiques locaux + CDN (Google Fonts) : cache d'abord
  var isCdn = CDN_ORIGINS.indexOf(url.hostname) !== -1;
  var isLocal = url.origin === location.origin;
  if (!isLocal && !isCdn) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
        }
        return res;
      });
    })
  );
});
