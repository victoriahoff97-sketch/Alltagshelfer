// Zustand Version 2 (Aufgaben, Ziele, Gewohnheiten, Eingang, Routinen, Schwerer Tag):
// Form, Prüfung, Laden, Speichern und Sicherung. Der Zustand wird nie verändert,
// Änderungen geben einen neuen zurück.
(function (root) {
  const SCHLUESSEL = 'alltagshelfer.v2';
  const WIDGET_SCHLUESSEL = 'alltagshelfer.widget';
  const KAPUTT_SCHLUESSEL = SCHLUESSEL + '.kaputt';
  // Die alte App (v1) lag nur im Browser; ihr Schlüssel wird nur gelesen, nie geändert oder gelöscht.
  const ALT_SCHLUESSEL = 'alltagshelfer.v1';
  const ALT_GEFRAGT_SCHLUESSEL = ALT_SCHLUESSEL + '.gefragt'; // „Übernehmen“ oder „Nein danke“ gewählt

  function leer() {
    return {
      version: 2,
      nr: 1,
      muss: [],
      ziele: [],
      gewohnheiten: [],
      eingang: [],
      routinen: { wohnung: [], abend: [] },
      schwer: null,
    };
  }

  const istObjekt = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const istText = x => typeof x === 'string';
  const istTag = x => istText(x) && /^\d{4}-\d{2}-\d{2}$/.test(x);
  const liste = (x, ok) => Array.isArray(x) && x.every(ok);

  const mussOk = e => istObjekt(e) && istText(e.id) && istText(e.text) && (e.frist === null || istTag(e.frist)) && istText(e.angelegt);
  const zielOk = e => istObjekt(e) && istText(e.id) && istText(e.text) && istText(e.woche);
  const gewohnheitOk = e => istObjekt(e) && istText(e.id) && istText(e.name) &&
    Number.isInteger(e.ziel) && e.ziel >= 1 && e.ziel <= 7 && istText(e.woche) && Number.isInteger(e.anzahl) && e.anzahl >= 0;
  const eingangOk = e => istObjekt(e) && istText(e.id) && istText(e.text) && istText(e.angelegt);
  // Schwerer Tag: ein verbogener Lauf würde bei jedem Zeichnen werfen
  const laufOk = l => istObjekt(l) && Number.isInteger(l.von) && l.von >= 0 && liste(l.offen, istText) && liste(l.einmalVerschoben, istText);
  const schwerOk = s => s === null ||
    (istObjekt(s) && istText(s.tag) && typeof s.an === 'boolean' && istObjekt(s.laeufe) && Object.values(s.laeufe).every(laufOk));

  function pruefe(obj) {
    if (!istObjekt(obj) || obj.version !== 2 || !Number.isInteger(obj.nr) || obj.nr < 1) return false;
    if (!liste(obj.muss, mussOk) || !liste(obj.ziele, zielOk) || !liste(obj.gewohnheiten, gewohnheitOk) || !liste(obj.eingang, eingangOk)) return false;
    if (!istObjekt(obj.routinen) || !liste(obj.routinen.wohnung, istText) || !liste(obj.routinen.abend, istText)) return false;
    if (!schwerOk(obj.schwer)) return false;
    const ids = [].concat(obj.muss, obj.ziele, obj.gewohnheiten, obj.eingang).map(e => e.id);
    return new Set(ids).size === ids.length;
  }

  // Vergibt die nächste Nummer; die id besteht aus Vorsilbe ('m', 'z', 'g', 'e') und Nummer.
  function neueId(state, vorsilbe) {
    const neu = structuredClone(state);
    const id = vorsilbe + neu.nr;
    neu.nr += 1;
    return { state: neu, id };
  }

  function lade(ort) {
    try {
      const roh = ort.getItem(SCHLUESSEL);
      if (roh === null || roh === undefined) return null;
      const obj = JSON.parse(roh);
      return pruefe(obj) ? obj : null;
    } catch (e) {
      return null;
    }
  }

  // Laden beim Start, ohne gute Daten zu gefährden. Ergebnis: { state, speichern }.
  //  - state: der gültige Zustand, sonst null (die Oberfläche nimmt dann einen leeren)
  //  - speichern: false, wenn ein Speichern jetzt Daten zerstören könnte: der Speicher ließ sich nicht lesen,
  //    oder Unlesbares konnte nicht erst unter KAPUTT_SCHLUESSEL beiseitegelegt werden.
  function ladeGesichert(ort) {
    let roh;
    try {
      roh = ort.getItem(SCHLUESSEL);
    } catch (e) {
      return { state: null, speichern: false };
    }
    if (roh === null || roh === undefined) return { state: null, speichern: true };
    try {
      const obj = JSON.parse(roh);
      if (pruefe(obj)) return { state: obj, speichern: true };
    } catch (e) { /* unlesbar, siehe unten */ }
    try {
      ort.setItem(KAPUTT_SCHLUESSEL, roh);
      return { state: null, speichern: true };
    } catch (e) {
      return { state: null, speichern: false };
    }
  }

  function speichere(ort, state) {
    try {
      ort.setItem(SCHLUESSEL, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function alsSicherung(state) {
    return JSON.stringify(state, null, 2);
  }

  // Aus der alten App (Format v1) übernehmen wir nur die Texte der Aufgaben, die Muss oder Will waren, in den Eingang.
  function ausAltemFormat(obj, heute) {
    let z = leer();
    for (const a of obj.aufgaben) {
      if (!istObjekt(a) || !istText(a.titel) || (a.art !== 'muss' && a.art !== 'will')) continue;
      const n = neueId(z, 'e');
      z = n.state;
      z.eingang.push({ id: n.id, text: a.titel, angelegt: a.angelegt || heute });
    }
    return z;
  }

  // Liest eine Sicherung. Gültiges v2 wird übernommen, das alte v1 wird umgewandelt, alles andere ergibt null.
  function ausSicherung(text, heute) {
    let obj;
    try {
      obj = JSON.parse(text);
    } catch (e) {
      return null;
    }
    if (istObjekt(obj) && obj.v === 1 && Array.isArray(obj.aufgaben)) {
      const z = ausAltemFormat(obj, heute);
      return pruefe(z) ? z : null;
    }
    return pruefe(obj) ? obj : null;
  }

  // Die Startseite bietet die alten Einträge nur an, solange der Zustand keine Einträge hat
  // (Routinen zählen nicht), es alte Daten gibt und noch niemand gewählt hat.
  function altesAnbieten(state, altRoh, gefragt) {
    const eintraege = state.muss.length + state.ziele.length + state.gewohnheiten.length + state.eingang.length;
    return !gefragt && typeof altRoh === 'string' && altRoh !== '' && eintraege === 0;
  }

  // Die alten Einträge kommen mit neuen ids in den Eingang; die Routinen nur, wenn es noch keine gibt.
  // null, wenn sich die alten Daten nicht lesen lassen.
  function altesUebernehmen(state, altRoh, heute) {
    const alt = ausSicherung(altRoh, heute);
    if (!alt) return null;
    let z = structuredClone(state);
    for (const e of alt.eingang) {
      const n = neueId(z, 'e');
      z = n.state;
      z.eingang.push({ id: n.id, text: e.text, angelegt: e.angelegt });
    }
    if (z.routinen.wohnung.length + z.routinen.abend.length === 0) z.routinen = structuredClone(alt.routinen);
    return z;
  }

  const api = {
    SCHLUESSEL, WIDGET_SCHLUESSEL, KAPUTT_SCHLUESSEL, ALT_SCHLUESSEL, ALT_GEFRAGT_SCHLUESSEL,
    leer, pruefe, neueId, lade, ladeGesichert, speichere, alsSicherung, ausSicherung, altesAnbieten, altesUebernehmen,
  };
  root.AH = root.AH || {};
  root.AH.speicher = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
