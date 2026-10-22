// Wo der Zustand liegt und woher Aktionen kommen: in der Android-Hülle (window.Huelle)
// oder im Browser (localStorage). Dazu die feste Uhrzeit für die Vorschau (?zeit=…).
(function (root) {
  // Notfalls ein Ort, der bei jedem Zugriff scheitert (etwa wenn der Browser den Speicher sperrt).
  function ort() {
    if (root.Huelle) return root.Huelle;
    try {
      return root.localStorage;
    } catch (e) {
      return { getItem() { throw e; }, setItem() { throw e; } };
    }
  }

  function istAndroid() {
    return Boolean(root.Huelle);
  }

  // Aktionen, die Widgets in die Warteschlange gelegt haben. Im Browser gibt es keine.
  // Lesen leert die Schlange nicht: erst aktionenLeeren, wenn der Zustand mit ihnen sicher gespeichert ist.
  function aktionenLesen() {
    if (!root.Huelle || typeof root.Huelle.aktionenHolen !== 'function') return [];
    try {
      const liste = JSON.parse(root.Huelle.aktionenHolen() || '[]');
      return Array.isArray(liste) ? liste : [];
    } catch (e) {
      return [];
    }
  }

  // Die ersten `anzahl` Aktionen sind angewandt und gespeichert: die Hülle nimmt sie aus der Schlange.
  // Was ein Widget inzwischen angehängt hat, bleibt stehen. Klappt es nicht, bleiben alle stehen.
  function aktionenLeeren(anzahl) {
    if (!(anzahl > 0) || !root.Huelle || typeof root.Huelle.aktionenBestaetigen !== 'function') return;
    try {
      root.Huelle.aktionenBestaetigen(anzahl);
    } catch (e) { /* bleiben in der Schlange */ }
  }

  // Feste Uhrzeit für Tests in der Vorschau: ?zeit=2026-10-22T20:30 (Ortszeit). Sonst null.
  function festeZeit(suche) {
    const m = /[?&]zeit=(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?:&|$)/.exec(suche || '');
    if (!m) return null;
    const [j, mo, t, st, mi] = m.slice(1).map(Number);
    const datum = new Date(j, mo - 1, t, st, mi);
    // 31. Februar o. Ä. würde still zum März; das ist keine gültige Eingabe
    const echt = datum.getFullYear() === j && datum.getMonth() === mo - 1 && datum.getDate() === t &&
      datum.getHours() === st && datum.getMinutes() === mi;
    return echt ? datum : null;
  }

  const api = { ort, istAndroid, aktionenLesen, aktionenLeeren, festeZeit };
  root.AH = root.AH || {};
  root.AH.ablage = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
