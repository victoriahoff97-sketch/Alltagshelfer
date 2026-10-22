// Wochenlogik: Gewohnheiten zählen pro Woche, Wochenziele bleiben liegen oder werden mitgenommen.
// Wochenschlüssel = Tag des Montags ('YYYY-MM-DD'); er lässt sich als Text vergleichen.
// Alle Funktionen geben einen neuen Zustand zurück; die Eingabe bleibt unverändert.
(function (root) {
  // Im Browser steht zeit.js schon als AH.zeit bereit, in Node wird es geladen.
  const inNode = typeof module !== 'undefined' && module.exports;
  const zeit = () => (inNode ? require('./zeit.js') : root.AH.zeit);

  // Zählung dieser Woche; eine veraltete Woche zählt als 0.
  function anzahl(g, heute) {
    return g.woche === zeit().montag(heute) ? g.anzahl : 0;
  }

  // Zählt die Gewohnheit um `schritt` weiter. Ist die gespeicherte Woche veraltet,
  // wird sie zuerst auf die aktuelle gesetzt und auf 0 zurückgestellt.
  function zaehle(state, id, heute, schritt) {
    if (!state.gewohnheiten.some(g => g.id === id)) return state;
    const neu = structuredClone(state);
    const g = neu.gewohnheiten.find(x => x.id === id);
    const woche = zeit().montag(heute);
    if (g.woche !== woche) {
      g.woche = woche;
      g.anzahl = 0;
    }
    g.anzahl = Math.max(0, g.anzahl + schritt);
    return neu;
  }

  const plus = (state, id, heute) => zaehle(state, id, heute, 1);
  const minus = (state, id, heute) => zaehle(state, id, heute, -1);

  function offeneZiele(state, heute) {
    const woche = zeit().montag(heute);
    return state.ziele.filter(z => z.woche === woche);
  }

  function liegenGeblieben(state, heute) {
    const woche = zeit().montag(heute);
    return state.ziele.filter(z => z.woche < woche);
  }

  function mitnehmen(state, id, heute) {
    if (!state.ziele.some(z => z.id === id)) return state;
    const neu = structuredClone(state);
    neu.ziele.find(z => z.id === id).woche = zeit().montag(heute);
    return neu;
  }

  function streichen(state, id) {
    if (!state.ziele.some(z => z.id === id)) return state;
    const neu = structuredClone(state);
    neu.ziele = neu.ziele.filter(z => z.id !== id);
    return neu;
  }

  const api = { anzahl, plus, minus, offeneZiele, liegenGeblieben, mitnehmen, streichen };
  root.AH = root.AH || {};
  root.AH.woche = api;
  if (inNode) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
