// Einträge anlegen, ändern, löschen und erledigen (Muss, Ziele, Gewohnheiten).
// Alle Funktionen geben einen neuen Zustand zurück; die Eingabe bleibt unverändert.
(function (root) {
  // Im Browser stehen speicher.js und zeit.js schon als AH.speicher / AH.zeit bereit, in Node werden sie geladen.
  const inNode = typeof module !== 'undefined' && module.exports;
  const speicher = () => (inNode ? require('./speicher.js') : root.AH.speicher);
  const zeit = () => (inNode ? require('./zeit.js') : root.AH.zeit);

  const LISTEN = ['muss', 'ziele', 'gewohnheiten'];
  const hat = (obj, feld) => Object.prototype.hasOwnProperty.call(obj, feld);

  // Text ohne Rand; alles, was kein Text ist, wird zu ''.
  const putze = x => (typeof x === 'string' ? x.trim() : '');

  // Gewohnheits-Ziel: ganze Zahl von 1 bis 7.
  function begrenze(ziel) {
    const n = Math.round(Number(ziel));
    if (!Number.isFinite(n)) return 1;
    return Math.min(7, Math.max(1, n));
  }

  function neuMuss(state, felder, heute) {
    const text = putze(felder && felder.text);
    if (!text) return state;
    const n = speicher().neueId(state, 'm');
    n.state.muss.push({ id: n.id, text, frist: (felder.frist || null), angelegt: heute });
    return n.state;
  }

  function neuZiel(state, felder, heute) {
    const text = putze(felder && felder.text);
    if (!text) return state;
    const n = speicher().neueId(state, 'z');
    n.state.ziele.push({ id: n.id, text, woche: zeit().montag(heute) });
    return n.state;
  }

  function neueGewohnheit(state, felder, heute) {
    const name = putze(felder && felder.name);
    if (!name) return state;
    const n = speicher().neueId(state, 'g');
    n.state.gewohnheiten.push({ id: n.id, name, ziel: begrenze(felder.ziel), woche: zeit().montag(heute), anzahl: 0 });
    return n.state;
  }

  // Ändert nur die bekannten Felder, die in `felder` vorkommen. Leerer Text oder
  // Name, unbekannte Liste oder id: Zustand unverändert.
  function aendere(state, liste, id, felder) {
    if (!LISTEN.includes(liste) || !felder) return state;
    if (!state[liste].some(e => e.id === id)) return state;
    const textFeld = liste === 'gewohnheiten' ? 'name' : 'text';
    if (hat(felder, textFeld) && !putze(felder[textFeld])) return state;
    const neu = structuredClone(state);
    const eintrag = neu[liste].find(e => e.id === id);
    if (hat(felder, textFeld)) eintrag[textFeld] = putze(felder[textFeld]);
    if (liste === 'muss' && hat(felder, 'frist')) eintrag.frist = felder.frist || null;
    if (liste === 'gewohnheiten' && hat(felder, 'ziel')) eintrag.ziel = begrenze(felder.ziel);
    return neu;
  }

  function loesche(state, liste, id) {
    if (!LISTEN.includes(liste) || !state[liste].some(e => e.id === id)) return state;
    const neu = structuredClone(state);
    neu[liste] = neu[liste].filter(e => e.id !== id);
    return neu;
  }

  // Erledigt = der Eintrag verschwindet. Das Rückgängig macht die Oberfläche mit dem alten Zustand.
  function erledige(state, liste, id) {
    if (liste !== 'muss' && liste !== 'ziele') return state;
    return loesche(state, liste, id);
  }

  const api = { neuMuss, neuZiel, neueGewohnheit, aendere, loesche, erledige };
  root.AH = root.AH || {};
  root.AH.eintraege = api;
  if (inNode) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
