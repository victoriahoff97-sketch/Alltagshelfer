// „Gerade offen“: höchstens zwei angefangene Sachen.
(function (root) {
  const MAX = 2;
  const SATZ_MAX = 120;
  const kopie = x => JSON.parse(JSON.stringify(x));

  function istOffen(state, aufgabeId) {
    return state.offen.some(o => o.aufgabeId === aufgabeId);
  }

  // Feste Aufgaben und Aufgaben mit Runden werden nicht geparkt: eine geparkte
  // Runde würde aus der Auswahl fallen und die nächste Runde blockieren.
  function darfParken(aufgabe) {
    return !aufgabe.fest && !(aufgabe.zeiten && aufgabe.zeiten.length);
  }

  function kannStarten(state, aufgabeId) {
    const aufgabe = state.aufgaben.find(a => a.id === aufgabeId);
    if (aufgabe && !darfParken(aufgabe)) return true; // belegt nie einen Platz in „Gerade offen“
    return state.offen.length < MAX || istOffen(state, aufgabeId);
  }

  function parken(state, aufgabeId, groesse, satz, tag) {
    const aufgabe = state.aufgaben.find(a => a.id === aufgabeId);
    if (!aufgabe || !darfParken(aufgabe) || !kannStarten(state, aufgabeId)) return state;
    const s = kopie(state);
    const text = String(satz || '').trim().slice(0, SATZ_MAX);
    const eintrag = s.offen.find(o => o.aufgabeId === aufgabeId);
    if (eintrag) {
      eintrag.satz = text;
      eintrag.groesse = groesse;
    } else {
      s.offen.push({ aufgabeId, groesse, satz: text, tag });
    }
    return s;
  }

  // Zurück in den Vorrat; der Satz bleibt als Notiz an der Aufgabe.
  function zuruecklegen(state, aufgabeId) {
    if (!istOffen(state, aufgabeId)) return state;
    const s = kopie(state);
    const eintrag = s.offen.find(o => o.aufgabeId === aufgabeId);
    const aufgabe = s.aufgaben.find(a => a.id === aufgabeId);
    if (aufgabe) aufgabe.notiz = eintrag.satz;
    s.offen = s.offen.filter(o => o.aufgabeId !== aufgabeId);
    return s;
  }

  const api = { MAX, istOffen, darfParken, kannStarten, parken, zuruecklegen };
  root.AH = root.AH || {};
  root.AH.offen = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
