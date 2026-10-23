/**
 * Service Worker — Plateforme Servants de Messe St-Bernard
 * Cache-first pour les ressources statiques ; réseau direct pour Firebase.
 */

var CACHE_NAME = 'smsb-v2';

var STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './news.css',
  './animations.css',
  './animations.js',
  './firebase-config.js',
  './manifest.json',
  './logoservantdemesse.jpg',
  './logoeglise.jpeg'
];

var NETWORK_HOSTS = [
  'firestore.googleapis.com',
  'www.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebase.googleapis.com',
  'firebaseinstallations.googleapis.com'
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

  // Firebase / Auth / APIs : toujours le réseau, jamais de cache
  if (NETWORK_HOSTS.indexOf(url.hostname) !== -1) return;
  if (url.pathname.indexOf('/api/') === 0) return;

  var isLocal = url.origin === location.origin;
  var isCdn = ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'].indexOf(url.hostname) !== -1;
  if (!isLocal && !isCdn) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      var fetched = fetch(req).then(function (res) {
        if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || fetched;
    })
  );
});
