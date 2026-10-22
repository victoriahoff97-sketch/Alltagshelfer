// Startet die App und meldet den Service Worker an.
(function (root) {
  root.AH.app.start();
  // Auf dem PC beim Entwickeln nur mit ?sw=1, sonst hält der Zwischenspeicher alte Dateien fest.
  // In der Android-Hülle liegen die Dateien in der APK, dort gibt es keinen Service Worker.
  const lokal = ['localhost', '127.0.0.1'].includes(root.location.hostname);
  const erwuenscht = root.location.protocol === 'https:' || (lokal && root.location.search.includes('sw=1'));
  if ('serviceWorker' in root.navigator && erwuenscht && !root.AH.ablage.istAndroid()) {
    root.navigator.serviceWorker.register('sw.js').catch(() => { /* ohne Service Worker läuft die App nur mit Netz */ });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
