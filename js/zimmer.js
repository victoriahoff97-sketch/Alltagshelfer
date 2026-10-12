// Erledigen und was dabei im Zimmer wächst.
(function (root) {
  const pakete = typeof require === 'function' ? require('./pakete.js') : root.AH.pakete;
  const GRENZE = 3;
  const kopie = x => JSON.parse(JSON.stringify(x));

  // Bereich, aus dem das nächste Stück kommt. Bereiche ohne eigene Stücke
  // (Erledigungen) füllen den Bereich, in dem noch am meisten fehlt.
  function stueckBereich(zimmer, bereich) {
    if (pakete.STUECKE[bereich]) return bereich;
    let bester = null;
    let meiste = 0;
    for (const b of pakete.BEREICHE) {
      const vorrat = pakete.STUECKE[b.id];
      if (!vorrat) continue;
      const fehlt = vorrat.length - zimmer.filter(z => !z.besonders && z.bereich === b.id).length;
      if (fehlt > meiste) { meiste = fehlt; bester = b.id; }
    }
    return bester;
  }

  // slot: die Runde (morgens, abends, nacht) bei Aufgaben mit Runden, sonst leer
  function erledigt(state, aufgabeId, tag, slot) {
    const vorhanden = state.aufgaben.find(a => a.id === aufgabeId);
    if (!vorhanden) return { state, stueck: null, grund: null };
    const schon = slot ? (vorhanden.runden || {})[slot] === tag : vorhanden.zuletzt === tag;
    if (schon) {
      if (!state.offen.some(o => o.aufgabeId === aufgabeId)) return { state, stueck: null, grund: 'schon' };
      const ohne = kopie(state);
      ohne.offen = ohne.offen.filter(o => o.aufgabeId !== aufgabeId);
      return { state: ohne, stueck: null, grund: 'schon' };
    }

    const s = kopie(state);
    const aufgabe = s.aufgaben.find(a => a.id === aufgabeId);
    const warOffen = s.offen.some(o => o.aufgabeId === aufgabeId);
    aufgabe.zuletzt = tag;
    aufgabe.notiz = '';
    aufgabe.ruhtBis = null;
    if (slot) aufgabe.runden = Object.assign({}, aufgabe.runden, { [slot]: tag });
    s.offen = s.offen.filter(o => o.aufgabeId !== aufgabeId);
    // Einmaliges (Reingeworfenes) ist mit dem Erledigen weg.
    if (aufgabe.einmal) {
      s.aufgaben = s.aufgaben.filter(a => a.id !== aufgabeId);
      s.heute.nicht = s.heute.nicht.filter(x => x !== aufgabeId);
      s.heute.spaeter = s.heute.spaeter.filter(x => x !== aufgabeId);
    }

    const bereich = stueckBereich(s.zimmer, aufgabe.bereich);
    const hat = (name, besonders) => s.zimmer.some(z => z.stueck === name && z.besonders === besonders &&
      (besonders || z.bereich === bereich));
    const stelle = (name, besonders) => {
      const wo = besonders ? aufgabe.bereich : bereich;
      s.zimmer.push({ bereich: wo, stueck: name, besonders, tag });
      return { state: s, stueck: { bereich: wo, stueck: name, besonders }, grund: null };
    };

    // Fertiggemachtes aus „Gerade offen“ zählt nicht auf die Tagesgrenze.
    if (warOffen) {
      const besonderes = pakete.BESONDERE.find(name => !hat(name, true));
      if (besonderes) return stelle(besonderes, true);
    }

    if (s.heute.stuecke >= GRENZE) return { state: s, stueck: null, grund: 'grenze' };
    const naechstes = bereich ? pakete.STUECKE[bereich].find(name => !hat(name, false)) : null;
    if (!naechstes) return { state: s, stueck: null, grund: 'vorrat' };
    s.heute.stuecke += 1;
    return stelle(naechstes, false);
  }

  const api = { GRENZE, erledigt };
  root.AH = root.AH || {};
  root.AH.zimmer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
