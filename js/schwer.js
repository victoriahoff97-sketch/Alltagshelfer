// Schwerer-Tag-Modus: immer nur ein Schritt einer Routine, nie eine Auswahl.
// Bis 20:15 Uhr läuft "Notfall Wohnung", danach bis 4 Uhr "Abend".
// Die Oberfläche ruft vor jeder Anzeige starte auf und dann ansicht.
// Alle Funktionen geben einen neuen Zustand zurück; die Eingabe bleibt unverändert.
(function (root) {
  // Im Browser steht zeit.js schon als AH.zeit bereit, in Node wird es geladen.
  const inNode = typeof module !== 'undefined' && module.exports;
  const zeit = () => (inNode ? require('./zeit.js') : root.AH.zeit);

  const NAMEN = { wohnung: 'Notfall Wohnung', abend: 'Abend' };

  const heute = jetzt => zeit().tagUndStunde(jetzt).tag;
  const routineZu = jetzt => (zeit().istAbend(jetzt) ? 'abend' : 'wohnung');

  function istAn(state, jetzt) {
    return Boolean(state.schwer && state.schwer.an && state.schwer.tag === heute(jetzt));
  }

  // Am selben Tag bleiben die Läufe, an einem anderen Tag fängt alles frisch an.
  function ein(state, jetzt) {
    const s = structuredClone(state);
    const tag = heute(jetzt);
    if (s.schwer && s.schwer.tag === tag) s.schwer.an = true;
    else s.schwer = { tag, an: true, laeufe: {} };
    return s;
  }

  function aus(state) {
    const s = structuredClone(state);
    if (s.schwer) s.schwer.an = false;
    return s;
  }

  // Lauf der gerade gültigen Routine, wenn er schon angelegt ist.
  function aktuellerLauf(state, jetzt) {
    return state.schwer.laeufe[routineZu(jetzt)] || null;
  }

  // Ein Lauf, der mit leerer Routine begann (von 0), holt später am Tag hinzugefügte Schritte;
  // ein begonnener Lauf bleibt, wie er ist.
  function starte(state, jetzt) {
    if (!istAn(state, jetzt)) return state;
    const r = routineZu(jetzt);
    const lauf = state.schwer.laeufe[r];
    if (lauf && (lauf.von > 0 || state.routinen[r].length === 0)) return state;
    const s = structuredClone(state);
    s.schwer.laeufe[r] = { von: s.routinen[r].length, offen: [...s.routinen[r]], einmalVerschoben: [] };
    return s;
  }

  function ansicht(state, jetzt) {
    if (!istAn(state, jetzt)) return null;
    const lauf = aktuellerLauf(state, jetzt);
    if (!lauf) return null;
    if (lauf.offen.length === 0) return { art: 'reicht' };
    const routine = routineZu(jetzt);
    return {
      art: 'schritt',
      routine,
      name: NAMEN[routine],
      text: lauf.offen[0],
      nummer: lauf.von - lauf.offen.length + 1,
      von: lauf.von,
    };
  }

  // Gemeinsamer Ablauf: ohne offenen Schritt passiert nichts, sonst ändert aendere den Lauf.
  function schritt(state, jetzt, aendere) {
    const unveraendert = { state, fertig: false };
    if (!istAn(state, jetzt)) return unveraendert;
    const lauf = aktuellerLauf(state, jetzt);
    if (!lauf || lauf.offen.length === 0) return unveraendert;
    const s = structuredClone(state);
    const neu = s.schwer.laeufe[routineZu(jetzt)];
    aendere(neu);
    return { state: s, fertig: neu.offen.length === 0 };
  }

  function erledigt(state, jetzt) {
    return schritt(state, jetzt, lauf => {
      lauf.offen.shift();
    });
  }

  // Einmal geht der Schritt ans Ende, beim zweiten Mal fällt er für heute weg.
  function gehtNicht(state, jetzt) {
    return schritt(state, jetzt, lauf => {
      const text = lauf.offen.shift();
      if (lauf.einmalVerschoben.includes(text)) return;
      lauf.offen.push(text);
      lauf.einmalVerschoben.push(text);
    });
  }

  const api = { ein, aus, istAn, starte, ansicht, erledigt, gehtNicht };
  root.AH = root.AH || {};
  root.AH.schwer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
