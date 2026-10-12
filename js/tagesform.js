// Tagesform: drei Stufen, die nur von Hand oder am neuen Tag steigen.
(function (root) {
  const STUFEN = ['klein', 'mittel', 'gross'];
  const GROESSEN = { klein: 'winzig', mittel: 'normal', gross: 'gross' };
  const kopie = x => JSON.parse(JSON.stringify(x));

  function groesseFuer(stufe) {
    return GROESSEN[stufe] || 'normal';
  }

  function eineTiefer(stufe) {
    return STUFEN[Math.max(0, STUFEN.indexOf(stufe) - 1)];
  }

  function neuerTag(state, tag) {
    if (state.heute.tag === tag) return state;
    const s = kopie(state);
    s.form = { stufe: 'mittel', andersFolge: 0 };
    s.heute = { tag, nicht: [], spaeter: [], stuecke: 0, letzterBereich: null };
    return s;
  }

  function kleiner(state) {
    const s = kopie(state);
    s.form = { stufe: eineTiefer(s.form.stufe), andersFolge: 0 };
    return s;
  }

  // „Etwas anderes“: das zweite Mal direkt nacheinander senkt die Stufe.
  function anders(state) {
    const s = kopie(state);
    if (s.form.andersFolge >= 1) {
      s.form = { stufe: eineTiefer(s.form.stufe), andersFolge: 0 };
    } else {
      s.form.andersFolge = 1;
    }
    return s;
  }

  function ruhe(state) {
    const s = kopie(state);
    s.form.andersFolge = 0;
    return s;
  }

  function schlecht(state) {
    const s = kopie(state);
    s.form = { stufe: 'klein', andersFolge: 0 };
    return s;
  }

  function setze(state, stufe) {
    if (!STUFEN.includes(stufe)) return state;
    const s = kopie(state);
    s.form = { stufe, andersFolge: 0 };
    return s;
  }

  const api = { STUFEN, groesseFuer, neuerTag, kleiner, anders, ruhe, schlecht, setze };
  root.AH = root.AH || {};
  root.AH.tagesform = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
