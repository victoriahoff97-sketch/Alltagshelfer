// Tag, Woche, Tageszeit und Rechnen mit Tagen. Ein Tag beginnt um 4 Uhr früh,
// damit späte Abende noch zum selben Tag zählen.
(function (root) {
  const TAGESBEGINN = 4;
  const ABEND_STUNDE = 20;
  const ABEND_MINUTE = 15;
  const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MONATE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const zwei = n => String(n).padStart(2, '0');

  // stunde läuft von 4 bis 27: 1 Uhr nachts ist Stunde 25 des Vortags.
  function tagUndStunde(datum) {
    const d = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate(), datum.getHours() - TAGESBEGINN);
    return {
      tag: d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()),
      stunde: d.getHours() + TAGESBEGINN,
    };
  }

  // Abend für den Schwerer-Tag-Modus: ab 20:15 Uhr bis zum Tagesbeginn um 4 Uhr.
  function istAbend(datum) {
    const h = datum.getHours();
    return h < TAGESBEGINN || h > ABEND_STUNDE || (h === ABEND_STUNDE && datum.getMinutes() >= ABEND_MINUTE);
  }

  const alsZahl = tag => Date.UTC(Number(tag.slice(0, 4)), Number(tag.slice(5, 7)) - 1, Number(tag.slice(8, 10)));

  // 0 ist Sonntag, 6 ist Samstag
  function wochentag(tag) {
    return new Date(alsZahl(tag)).getUTCDay();
  }

  function plusTage(tag, n) {
    return new Date(alsZahl(tag) + n * 86400000).toISOString().slice(0, 10);
  }

  function tageZwischen(von, bis) {
    return Math.round((alsZahl(bis) - alsZahl(von)) / 86400000);
  }

  // Der Montag der Woche, in der tag liegt (die Woche beginnt am Montag). Zugleich der Wochenschlüssel.
  function montag(tag) {
    return plusTage(tag, -((wochentag(tag) + 6) % 7));
  }

  function wochentagKurz(tag) {
    return WOCHENTAGE[wochentag(tag)];
  }

  // z. B. '3. Nov'
  function datumKurz(tag) {
    return Number(tag.slice(8, 10)) + '. ' + MONATE[Number(tag.slice(5, 7)) - 1];
  }

  const api = { TAGESBEGINN, tagUndStunde, istAbend, wochentag, plusTage, tageZwischen, montag, wochentagKurz, datumKurz };
  root.AH = root.AH || {};
  root.AH.zeit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
