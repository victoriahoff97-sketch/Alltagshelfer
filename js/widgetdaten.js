// Widget-Datei und Widget-Aktionen. Die Android-Widgets enthalten keine Logik: Bei jedem Speichern
// legt die App eine fertig gerechnete Datei ab (was jedes Widget heute und an den nächsten 7 Tagen zeigt),
// und Taps auf dem Widget kommen als kleine Aktionen zurück, die die App beim nächsten Öffnen anwendet.
// Alle Funktionen geben einen neuen Zustand zurück; die Eingabe bleibt unverändert.
(function (root) {
  // Im Browser stehen die Module schon als AH.* bereit, in Node werden sie geladen.
  const inNode = typeof module !== 'undefined' && module.exports;
  const zeit = () => (inNode ? require('./zeit.js') : root.AH.zeit);
  const fristen = () => (inNode ? require('./fristen.js') : root.AH.fristen);
  const woche = () => (inNode ? require('./woche.js') : root.AH.woche);
  const eintraege = () => (inNode ? require('./eintraege.js') : root.AH.eintraege);
  const eingang = () => (inNode ? require('./eingang.js') : root.AH.eingang);

  const TAGE = 8;
  const MUSS_MAX = 6;
  const WOCHE_MAX = 4;

  // Für jeden der nächsten TAGE Tage (ab dem heutigen 4-Uhr-Tag) das, was die Widgets zeigen.
  // Muss nach Frist sortiert, Schilder und Wochenzählung je Tag neu gerechnet.
  // mehr: es gibt mehr Muss-Aufgaben, als in der Datei stehen (sind alle abgehakt, heißt es „App öffnen“).
  // montag: Wochenschlüssel des Tags; ein +1 im Widget zählt in allen Tagen mit demselben Montag.
  function baue(state, jetzt) {
    const z = zeit();
    const heute = z.tagUndStunde(jetzt).tag;
    const muss = fristen().sortiere(state.muss).slice(0, MUSS_MAX);
    const mehr = state.muss.length > MUSS_MAX;
    const gewohnheiten = state.gewohnheiten.slice(0, WOCHE_MAX);
    const tage = {};
    for (let i = 0; i < TAGE; i++) {
      const tag = z.plusTage(heute, i);
      tage[tag] = {
        montag: z.montag(tag),
        muss: muss.map(m => ({ id: m.id, text: m.text, schild: fristen().schild(m.frist, tag) })),
        mehr,
        woche: gewohnheiten.map(g => ({ id: g.id, name: g.name, anzahl: woche().anzahl(g, tag), ziel: g.ziel })),
      };
    }
    return { tage };
  }

  // Aktionen aus der Hülle: { art:'muss', id } | { art:'plus', id, zeit } | { art:'eingang', text, zeit }.
  // `zeit` sind Millisekunden. Unbekannte Arten und ids werden übersprungen; plus und eingang
  // ohne gültige Zeit ebenfalls, weil ihnen der Tag fehlt.
  function wendeAktionenAn(state, aktionen) {
    if (!Array.isArray(aktionen)) return state;
    let neu = state;
    for (const a of aktionen) {
      if (!a || typeof a !== 'object') continue;
      const tag = Number.isFinite(a.zeit) ? zeit().tagUndStunde(new Date(a.zeit)).tag : null;
      if (a.art === 'muss') neu = eintraege().erledige(neu, 'muss', a.id);
      else if (a.art === 'plus' && tag) neu = woche().plus(neu, a.id, tag);
      else if (a.art === 'eingang' && tag) neu = eingang().aufnehmen(neu, a.text, tag);
    }
    return neu;
  }

  const api = { TAGE, MUSS_MAX, WOCHE_MAX, baue, wendeAktionenAn };
  root.AH = root.AH || {};
  root.AH.widgetdaten = api;
  if (inNode) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
