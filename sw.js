// Service Worker der Web-Fassung: hält die App auf dem Gerät, damit sie ohne Netz startet.
// Version und Dateiliste trägt tools/web.js beim Bauen ein.
const VERSION = 'fd9d1c985c';
const CACHE = 'alltagshelfer-' + VERSION;
const DATEIEN = ['./', "index.html", "manifest.webmanifest", "css/app.css", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "js/app.js", "js/aufgaben.js", "js/auswahl.js", "js/drive.js", "js/offen.js", "js/pakete.js", "js/speicher.js", "js/start.js", "js/tagesform.js", "js/ui-aufgaben.js", "js/ui-einstellungen.js", "js/ui-jetzt.js", "js/ui-sticker.js", "js/ui-timer.js", "js/ui-zimmer.js", "js/wesen.js", "js/zeit.js", "js/zimmer.js", "js/zimmerbild.js"];

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
