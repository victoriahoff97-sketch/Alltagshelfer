// Fristen-Schilder und Reihenfolge der Muss-Aufgaben.
(function (root) {
  // Im Browser steht zeit.js schon als AH.zeit bereit, in Node wird es geladen.
  const zeit = () => (typeof module !== 'undefined' && module.exports ? require('./zeit.js') : root.AH.zeit);

  // Das kleine Schild neben einer Muss-Aufgabe. Ohne Frist gibt es keins.
  // rot = überfällig, gelb = heute, grau = alles danach.
  function schild(frist, heute) {
    if (!frist) return null;
    const z = zeit();
    const tage = z.tageZwischen(heute, frist);
    if (tage < 0) return { text: tage === -1 ? 'seit gestern' : 'seit ' + -tage + ' Tagen', art: 'rot' };
    if (tage === 0) return { text: 'heute', art: 'gelb' };
    if (tage === 1) return { text: 'morgen', art: 'grau' };
    if (tage < 7) return { text: z.wochentagKurz(frist), art: 'grau' };
    return { text: z.datumKurz(frist), art: 'grau' };
  }

  // Neue Liste: mit Frist aufsteigend, danach die ohne Frist. Gleiches bleibt in
  // der Originalreihenfolge.
  function sortiere(muss) {
    return muss
      .map((m, i) => ({ m, i }))
      .sort((a, b) => {
        if (a.m.frist && b.m.frist) {
          if (a.m.frist !== b.m.frist) return a.m.frist < b.m.frist ? -1 : 1;
        } else if (a.m.frist || b.m.frist) {
          return a.m.frist ? -1 : 1;
        }
        return a.i - b.i;
      })
      .map(x => x.m);
  }

  const api = { schild, sortiere };
  root.AH = root.AH || {};
  root.AH.fristen = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
