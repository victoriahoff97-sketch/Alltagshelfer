// Tag, Tageszeit und Rechnen mit Tagen. Ein Tag beginnt um 4 Uhr früh,
// damit späte Abende noch zum selben Tag zählen.
(function (root) {
  const TAGESBEGINN = 4;
  const zwei = n => String(n).padStart(2, '0');

  // stunde läuft von 4 bis 27: 1 Uhr nachts ist Stunde 25 des Vortags.
  function tagUndStunde(datum) {
    const d = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate(), datum.getHours() - TAGESBEGINN);
    return {
      tag: d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()),
      stunde: d.getHours() + TAGESBEGINN,
    };
  }

  function slotAktiv(slot, stunde) {
    if (slot === 'morgens') return stunde < 12;
    if (slot === 'abends') return stunde >= 17;
    if (slot === 'nacht') return stunde >= 20;
    return false;
  }

  const BEGINN = { morgens: TAGESBEGINN, abends: 17, nacht: 20 };

  // Ist die Runde einer Aufgabe gerade offen? Gewöhnliche Runden gelten in ihrer
  // Tageszeit. Feste Runden bleiben offen, bis die nächste eigene
  // Runde beginnt, damit ein verschlafener Morgen sie nicht verschluckt.
  function rundeOffen(slot, stunde, fest, zeiten) {
    if (!(slot in BEGINN) || stunde < BEGINN[slot]) return false;
    if (!fest) return slotAktiv(slot, stunde);
    const naechste = (zeiten || []).map(z => BEGINN[z]).filter(b => b > BEGINN[slot]).sort((a, b) => a - b)[0];
    return naechste === undefined || stunde < naechste;
  }

  const ENDSPURT = 30; // Sekunden

  // Die laufende Zeit einer Aufgabe: Restsekunden, Anteil für den Ring, Anzeige und Abschnitt.
  function rest(start, dauerMs, jetzt) {
    const ms = Math.max(0, start + dauerMs - jetzt);
    const sek = Math.ceil(ms / 1000);
    const phase = sek === 0 ? 'um' : (sek <= ENDSPURT && dauerMs > ENDSPURT * 1000 ? 'endspurt' : 'laeuft');
    return { sek, anteil: dauerMs > 0 ? Math.min(1, ms / dauerMs) : 0, text: Math.floor(sek / 60) + ':' + zwei(sek % 60), phase };
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

  const api = { TAGESBEGINN, tagUndStunde, slotAktiv, rundeOffen, rest, wochentag, plusTage, tageZwischen };
  root.AH = root.AH || {};
  root.AH.zeit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
