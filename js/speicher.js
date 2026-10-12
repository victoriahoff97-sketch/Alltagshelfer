// Laden, Speichern und Sicherung des einen Zustandsobjekts.
(function (root) {
  const SCHLUESSEL = 'alltagshelfer.v1';

  function leer(tag) {
    return {
      v: 1,
      naechsteNr: 1,
      aufgaben: [],
      pakete: [],
      offen: [],
      form: { stufe: 'mittel', andersFolge: 0 },
      heute: { tag, nicht: [], spaeter: [], stuecke: 0, letzterBereich: null },
      zimmer: [],
      wesen: 'axolotl',
      plan: {}, // je Tag die gewählte Variante oder 'frei'
    };
  }

  function istObjekt(x) {
    return !!x && typeof x === 'object' && !Array.isArray(x);
  }

  const GROESSEN = ['winzig', 'normal', 'gross'];
  const STUFEN = ['klein', 'mittel', 'gross'];
  const WESEN = ['axolotl', 'pilz'];
  const WESEN_FRUEHER = ['otter']; // gab es einmal, alte Stände bleiben lesbar
  const istText = x => typeof x === 'string';

  const RUNDEN = ['morgens', 'abends', 'nacht'];
  const fehlt = x => x === undefined || x === null;
  const textOderLeer = x => fehlt(x) || istText(x);
  const textliste = x => Array.isArray(x) && x.every(istText);

  const groessenOk = g => istObjekt(g) && GROESSEN.every(x => istObjekt(g[x]) && istText(g[x].text) && Number.isFinite(g[x].min) && g[x].min > 0);
  const schritteOk = s => istObjekt(s) && GROESSEN.every(x => textliste(s[x]));
  function variantenOk(v) {
    if (fehlt(v)) return true;
    return istObjekt(v) && istText(v.frage) && Array.isArray(v.liste) && v.liste.every(x =>
      istObjekt(x) && istText(x.id) && istText(x.name) && groessenOk(x.groessen) && schritteOk(x.schritte) &&
      (fehlt(x.zusatz) || (istObjekt(x.zusatz) && textliste(x.zusatz.schritte) && textliste(x.zusatz.nichtNach))));
  }

  // Die Felder aus Etappe 2 dürfen fehlen (ältere Stände), aber nicht verbogen sein.
  function zusatzOk(a) {
    return (fehlt(a.zeiten) || (Array.isArray(a.zeiten) && a.zeiten.every(z => RUNDEN.includes(z)))) &&
      (fehlt(a.tage) || (Array.isArray(a.tage) && a.tage.every(t => Number.isInteger(t) && t >= 0 && t <= 6))) &&
      variantenOk(a.varianten) &&
      (fehlt(a.runden) || (istObjekt(a.runden) && Object.values(a.runden).every(istText))) &&
      (fehlt(a.schritte) || (istObjekt(a.schritte) && GROESSEN.every(g => textliste(a.schritte[g])))) &&
      (a.rhythmus === undefined || (Number.isFinite(a.rhythmus) && a.rhythmus >= 1)) &&
      textOderLeer(a.ruhtBis) && textOderLeer(a.angelegt) && textOderLeer(a.danach) &&
      (fehlt(a.art) || a.art === 'muss' || a.art === 'will');
  }

  function aufgabeOk(a) {
    return istObjekt(a) && istText(a.id) && Number.isFinite(a.nr) && istText(a.bereich) && istText(a.titel) &&
      istObjekt(a.groessen) &&
      GROESSEN.every(g => istObjekt(a.groessen[g]) && istText(a.groessen[g].text) &&
        Number.isFinite(a.groessen[g].min) && a.groessen[g].min > 0) &&
      istText(a.fertig) && istText(a.notiz) && (a.zuletzt === null || istText(a.zuletzt)) && zusatzOk(a);
  }

  // Prüft die ganze Form, damit eine fremde Datei die Bildschirme nicht zum Absturz bringt.
  function pruefe(obj) {
    return formOk(obj) && stimmig(obj);
  }

  // Ein Stand kann die richtige Form haben und sich trotzdem selbst widersprechen.
  function stimmig(obj) {
    const ids = obj.aufgaben.map(a => a.id);
    return new Set(ids).size === ids.length &&
      obj.aufgaben.every(a => a.nr < obj.naechsteNr) &&
      obj.offen.every(o => ids.includes(o.aufgabeId));
  }

  function formOk(obj) {
    return istObjekt(obj) && obj.v === 1 && Number.isFinite(obj.naechsteNr) &&
      ['aufgaben', 'offen', 'zimmer', 'pakete'].every(k => Array.isArray(obj[k])) &&
      obj.aufgaben.every(aufgabeOk) &&
      obj.pakete.every(istText) &&
      obj.offen.every(o => istObjekt(o) && istText(o.aufgabeId) && GROESSEN.includes(o.groesse) && istText(o.satz)) &&
      obj.zimmer.every(z => istObjekt(z) && istText(z.bereich) && istText(z.stueck) && typeof z.besonders === 'boolean') &&
      (obj.wesen === undefined || WESEN.includes(obj.wesen) || WESEN_FRUEHER.includes(obj.wesen)) &&
      istObjekt(obj.form) && STUFEN.includes(obj.form.stufe) &&
      (obj.plan === undefined || (istObjekt(obj.plan) && Object.values(obj.plan).every(istText))) &&
      istObjekt(obj.heute) && istText(obj.heute.tag) &&
      Array.isArray(obj.heute.nicht) && Array.isArray(obj.heute.spaeter) && Number.isFinite(obj.heute.stuecke);
  }

  function ausText(text) {
    try {
      const state = JSON.parse(text);
      if (!pruefe(state)) return { ok: false };
      // Stände aus der Zeit vor der Wesenwahl oder mit einem Wesen, das es nicht mehr gibt
      if (!WESEN.includes(state.wesen)) state.wesen = 'axolotl';
      return { ok: true, state };
    } catch (e) {
      return { ok: false };
    }
  }

  // Wer eine Sicherung einspielt, ist schon eingezogen: die Begrüßung kommt nicht noch einmal.
  function eingespielt(state) {
    return Object.assign({}, state, { willkommen: true });
  }

  function alsText(state) {
    return JSON.stringify(state);
  }

  function lade(storage, tag) {
    let text;
    try {
      text = storage.getItem(SCHLUESSEL);
    } catch (e) {
      return { state: leer(tag), hinweis: 'kein-speicher' };
    }
    if (text === null || text === undefined) return { state: leer(tag), hinweis: null };
    const r = ausText(text);
    if (r.ok) return { state: r.state, hinweis: null };
    try { storage.setItem(SCHLUESSEL + '.alt', text); } catch (e) { /* alter Stand geht verloren */ }
    return { state: leer(tag), hinweis: 'beschaedigt' };
  }

  function speichere(storage, state) {
    try {
      storage.setItem(SCHLUESSEL, alsText(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  const api = { SCHLUESSEL, leer, pruefe, lade, speichere, alsText, ausText, eingespielt };
  root.AH = root.AH || {};
  root.AH.speicher = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
