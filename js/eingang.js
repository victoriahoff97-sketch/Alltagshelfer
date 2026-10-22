// Eingang: Gedanken und Aufgaben, die schnell festgehalten und später sortiert werden
// (zu Muss, Wochenziel, Gewohnheit oder weg).
// Alle Funktionen geben einen neuen Zustand zurück; die Eingabe bleibt unverändert.
(function (root) {
  // Im Browser stehen die Module schon als AH.* bereit, in Node werden sie geladen.
  const inNode = typeof module !== 'undefined' && module.exports;
  const speicher = () => (inNode ? require('./speicher.js') : root.AH.speicher);
  const eintraege = () => (inNode ? require('./eintraege.js') : root.AH.eintraege);
  const zeit = () => (inNode ? require('./zeit.js') : root.AH.zeit);

  const putze = x => (typeof x === 'string' ? x.trim() : '');
  const grossAnfang = t => t.charAt(0).toUpperCase() + t.slice(1);

  // Text festhalten: ohne Rand, erster Buchstabe groß, Rest wie getippt. Leer: unverändert.
  function aufnehmen(state, text, heute) {
    const t = putze(text);
    if (!t) return state;
    const n = speicher().neueId(state, 'e');
    n.state.eingang.push({ id: n.id, text: grossAnfang(t), angelegt: heute });
    return n.state;
  }

  // Frist-Wahl in ein Datum 'YYYY-MM-DD' umrechnen. 'woche' = Sonntag dieser Woche.
  // Ein Datum wird durchgereicht, 'ohne' und alles Unbekannte ergibt null.
  function fristAus(wahl, heute) {
    if (wahl === 'heute') return heute;
    if (wahl === 'morgen') return zeit().plusTage(heute, 1);
    if (wahl === 'woche') return zeit().plusTage(zeit().montag(heute), 6);
    if (typeof wahl === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(wahl)) return wahl;
    return null;
  }

  // Einen Eingang-Eintrag einsortieren. `ziel`:
  //   { art: 'muss', frist: wahl, text? } | { art: 'ziel', text? } |
  //   { art: 'gewohnheit', ziel: n, text? } | { art: 'weg' }
  // Unbekannte id oder Art, oder ein leer gemachter Text: Zustand unverändert.
  function sortiere(state, id, ziel, heute) {
    const eintrag = state.eingang.find(e => e.id === id);
    if (!eintrag || !ziel) return state;
    const e = eintraege();
    const text = putze(ziel.text !== undefined && ziel.text !== null ? ziel.text : eintrag.text);
    let neu;
    if (ziel.art === 'weg') {
      neu = structuredClone(state);
    } else if (!text) {
      return state;
    } else if (ziel.art === 'muss') {
      neu = e.neuMuss(state, { text, frist: fristAus(ziel.frist, heute) }, heute);
    } else if (ziel.art === 'ziel') {
      neu = e.neuZiel(state, { text }, heute);
    } else if (ziel.art === 'gewohnheit') {
      neu = e.neueGewohnheit(state, { name: text, ziel: ziel.ziel }, heute);
    } else {
      return state;
    }
    if (neu === state) return state;
    neu = structuredClone(neu);
    neu.eingang = neu.eingang.filter(x => x.id !== id);
    return neu;
  }

  const api = { aufnehmen, fristAus, sortiere };
  root.AH = root.AH || {};
  root.AH.eingang = api;
  if (inNode) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
