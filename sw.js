// Service Worker der Web-Fassung: hält die App auf dem Gerät, damit sie ohne Netz startet.
// Version und Dateiliste trägt tools/web.js beim Bauen ein.
const VERSION = '11be6585cb';
const CACHE = 'alltagshelfer-' + VERSION;
const DATEIEN = ['./', "index.html", "manifest.webmanifest", "css/app.css", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "js/ablage.js", "js/app.js", "js/aufnehmen.js", "js/eingang.js", "js/eintraege.js", "js/fristen.js", "js/schwer.js", "js/speicher.js", "js/start.js", "js/ui-alle.js", "js/ui-eingang.js", "js/ui-einstellungen.js", "js/ui-schwer.js", "js/ui-start.js", "js/widgetdaten.js", "js/woche.js", "js/zeit.js"];

self.addEventListener('install', e => {
  // cache: 'reload' holt jede Datei frisch vom Server, vorbei am Zwischenspeicher des Browsers.
  // Sonst könnte eine neue Version mit alten Dateien gefüllt werden.
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(DATEIEN.map(d => new Request(d, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(namen => Promise.all(namen.filter(n => n.startsWith('alltagshelfer-') && n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(treffer => treffer || fetch(e.request)));
});
