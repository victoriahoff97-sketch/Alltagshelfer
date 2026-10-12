// Bestimmt die eine Sache, die der Jetzt-Bildschirm zeigt.
(function (root) {
  const lade = (name, datei) => (typeof require === 'function' ? require(datei) : root.AH[name]);
  const tagesform = lade('tagesform', './tagesform.js');
  const aufgaben = lade('aufgaben', './aufgaben.js');
  const kopie = x => JSON.parse(JSON.stringify(x));

  // Unter diesem Schlüssel stehen „Etwas anderes“, „Gleich“ und „Heute nicht“ in den Tageslisten.
  // Bei Aufgaben mit Runden gilt er nur für die eine Runde: „a7@morgens“.
  function schluessel(aufgabe, slot) {
    return slot ? aufgabe.id + '@' + slot : aufgabe.id;
  }

  // opt.ohneOffen: „Lieber etwas Neues“ überspringt den Vorschlag zum Fertigmachen.
  // opt.stunde: Stunde des Tages (4 bis 27), bestimmt die Runden morgens, abends, nachts.
  function waehle(state, opt) {
    if (!state.aufgaben.length) return { art: 'keine' };
    const o = opt || {};
    const stunde = o.stunde === undefined ? 12 : o.stunde;
    const heute = state.heute;
    const klein = state.form.stufe === 'klein';
    const groesse = tagesform.groesseFuer(state.form.stufe);
    const offeneIds = state.offen.map(x => x.aufgabeId);

    const dran = [];
    for (const a of state.aufgaben) {
      if (offeneIds.includes(a.id)) continue;
      const d = aufgaben.dran(a, heute.tag, stunde, state.plan);
      if (d) dran.push({ a, slot: d.slot });
    }

    // Aus der Liste „Heute dran“ gewählt: genau diese Aufgabe kommt auf die Karte.
    const gewaehlt = o.gewaehlt && dran.find(x => schluessel(x.a, x.slot) === o.gewaehlt);
    if (gewaehlt) return { art: 'aufgabe', aufgabe: gewaehlt.a, groesse, slot: gewaehlt.slot };

    // Feste Aufgaben kommen vor allem anderen, solange sie nicht auf „Gleich“ stehen.
    const fest = dran.filter(x => x.a.fest && !heute.spaeter.includes(schluessel(x.a, x.slot))).sort((x, y) => x.a.nr - y.a.nr)[0];
    if (fest) return { art: 'aufgabe', aufgabe: fest.a, groesse, slot: fest.slot };

    if (!klein && !o.ohneOffen) {
      for (const offen of state.offen) {
        const aufgabe = state.aufgaben.find(a => a.id === offen.aufgabeId);
        if (aufgabe) return { art: 'offen', offen, aufgabe };
      }
    }

    const kandidaten = dran.filter(x => x.a.fest || !heute.nicht.includes(schluessel(x.a, x.slot)));
    if (!kandidaten.length) return { art: 'leer' };

    const rang = x => [
      heute.spaeter.indexOf(schluessel(x.a, x.slot)),
      klein && !x.a.vorrang ? 1 : 0,
      x.a.bereich === heute.letzterBereich ? 1 : 0,
      x.a.art === 'muss' ? 0 : 1,
      x.a.zuletzt === null ? '' : x.a.zuletzt,
      x.a.nr,
    ];
    kandidaten.sort((x, y) => {
      const kx = rang(x), ky = rang(y);
      for (let i = 0; i < kx.length; i++) {
        if (kx[i] < ky[i]) return -1;
        if (kx[i] > ky[i]) return 1;
      }
      return 0;
    });
    return { art: 'aufgabe', aufgabe: kandidaten[0].a, groesse, slot: kandidaten[0].slot };
  }

  // Alles, was heute ansteht, zum Aussuchen: Festes zuerst, dann „Muss“, sonst in der Reihenfolge der Aufgaben.
  // Angefangenes steht bei „Gerade offen“, „Heute nicht“ bleibt weg.
  function heuteDran(state, opt) {
    const stunde = opt && opt.stunde !== undefined ? opt.stunde : 12;
    const groesse = tagesform.groesseFuer(state.form.stufe);
    const offeneIds = state.offen.map(x => x.aufgabeId);
    const liste = [];
    for (const a of state.aufgaben) {
      if (offeneIds.includes(a.id)) continue;
      const d = aufgaben.dran(a, state.heute.tag, stunde, state.plan);
      if (!d) continue;
      if (!a.fest && state.heute.nicht.includes(schluessel(a, d.slot))) continue;
      liste.push({ aufgabe: a, slot: d.slot, groesse });
    }
    const rang = x => (x.aufgabe.fest ? 0 : x.aufgabe.art === 'muss' ? 1 : 2);
    return liste.sort((x, y) => rang(x) - rang(y) || x.aufgabe.nr - y.aufgabe.nr);
  }

  // „Etwas anderes“ und „Gleich“: die Aufgabe stellt sich für heute hinten an.
  function weiter(state, eintrag) {
    const s = kopie(state);
    s.heute.spaeter = s.heute.spaeter.filter(x => x !== eintrag).concat(eintrag);
    return s;
  }

  // Nach einer erledigten Sache melden sich feste Aufgaben wieder, die auf „Gleich“ standen.
  function festZurueck(state) {
    const fest = state.aufgaben.filter(a => a.fest).map(a => a.id);
    const istFest = x => fest.includes(x.split('@')[0]);
    if (!state.heute.spaeter.some(istFest)) return state;
    const s = kopie(state);
    s.heute.spaeter = s.heute.spaeter.filter(x => !istFest(x));
    return s;
  }

  function heuteNicht(state, eintrag) {
    if (state.heute.nicht.includes(eintrag)) return state;
    const s = kopie(state);
    s.heute.nicht.push(eintrag);
    return s;
  }

  function gezeigt(state, aufgabe) {
    const s = kopie(state);
    s.heute.letzterBereich = aufgabe.bereich;
    return s;
  }

  const api = { schluessel, waehle, heuteDran, weiter, festZurueck, heuteNicht, gezeigt };
  root.AH = root.AH || {};
  root.AH.auswahl = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
