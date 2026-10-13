// Aufgaben anlegen, ändern, löschen; wann eine Aufgabe dran ist; Reinwerfen.
(function (root) {
  const lade = (name, datei) => (typeof require === 'function' ? require(datei) : root.AH[name]);
  const pakete = lade('pakete', './pakete.js');
  const zeit = lade('zeit', './zeit.js');
  // Die eigenen Aufgaben liegen nur auf dem PC; in der Web-Fassung fehlt die Datei.
  const meine = (() => { try { return lade('meine', './meine.js') || null; } catch (e) { return null; } })();

  const TITEL_MAX = 80;
  const FERTIG_MAX = 120;
  const MIN_MAX = 180;
  const RHYTHMUS_MAX = 90;
  const WILL_TAGE = 28;
  const kopie = x => JSON.parse(JSON.stringify(x));

  function vorschlag(titel) {
    return {
      winzig: { text: 'Nur anfangen: ' + titel, min: 2 },
      normal: { text: titel, min: 10 },
      gross: { text: titel + ' und gründlich', min: 25 },
    };
  }

  function rhythmusAus(wert) {
    const n = Math.round(Number(wert));
    return n >= 1 ? Math.min(RHYTHMUS_MAX, n) : 1;
  }

  function neu(state, felder) {
    const t = String(felder.titel || '').trim().slice(0, TITEL_MAX);
    if (!t || !pakete.BEREICHE.some(b => b.id === felder.bereich)) return state;
    const s = kopie(state);
    s.aufgaben.push({
      id: 'a' + s.naechsteNr,
      nr: s.naechsteNr,
      bereich: felder.bereich,
      titel: t,
      groessen: felder.groessen ? kopie(felder.groessen) : vorschlag(t),
      fertig: felder.fertig || '',
      notiz: '',
      zuletzt: null,
      rhythmus: rhythmusAus(felder.rhythmus),
      zeiten: felder.zeiten ? kopie(felder.zeiten) : null, // Runden: 'morgens', 'abends', 'nacht'
      tage: felder.tage ? kopie(felder.tage) : null,        // Wochentage, an denen sie dran ist (0 = Sonntag); leer = jeden Tag
      varianten: felder.varianten ? kopie(felder.varianten) : null, // mehrere Fassungen; welche gilt, steht je Tag in state.plan
      runden: {},                                           // je Runde der Tag, an dem sie erledigt wurde
      fest: !!felder.fest,                                  // kommt vor allem anderen
      geteilt: !!felder.geteilt,                            // „Hat schon jemand gemacht“
      vorrang: !!felder.vorrang,                            // Geruch und Chaos: bei wenig Energie zuerst
      schritte: felder.schritte ? kopie(felder.schritte) : null,
      danach: felder.danach || '',
      ruhtBis: null,
      art: felder.art || null,                              // 'muss' | 'will' für Reingeworfenes
      einmal: !!felder.einmal,
      angelegt: felder.angelegt || null,
      irgendwann: false,
    });
    s.naechsteNr += 1;
    return s;
  }

  function aendere(state, id, felder) {
    const s = kopie(state);
    const aufgabe = s.aufgaben.find(a => a.id === id);
    if (!aufgabe) return state;
    const titel = String(felder.titel || '').trim().slice(0, TITEL_MAX);
    if (titel) aufgabe.titel = titel;
    if (pakete.BEREICHE.some(b => b.id === felder.bereich)) aufgabe.bereich = felder.bereich;
    if (felder.groessen) aufgabe.groessen = kopie(felder.groessen);
    if ('fertig' in felder) aufgabe.fertig = String(felder.fertig || '').trim().slice(0, FERTIG_MAX);
    if ('rhythmus' in felder) aufgabe.rhythmus = rhythmusAus(felder.rhythmus);
    return s;
  }

  // Formulareingaben zu Größen; was leer oder unbrauchbar ist, kommt aus der Vorlage.
  function groessenAus(eingabe, basis) {
    const r = {};
    for (const g of ['winzig', 'normal', 'gross']) {
      const e = (eingabe && eingabe[g]) || {};
      const text = String(e.text || '').trim().slice(0, TITEL_MAX);
      const min = Math.round(Number(e.min));
      r[g] = {
        text: text || basis[g].text,
        min: min >= 1 ? Math.min(MIN_MAX, min) : basis[g].min,
      };
    }
    return r;
  }

  function loesche(state, id) {
    const s = kopie(state);
    s.aufgaben = s.aufgaben.filter(a => a.id !== id);
    s.offen = s.offen.filter(o => o.aufgabeId !== id);
    // Einträge können rundenbezogen sein: „a7@morgens“
    const fremd = x => x !== id && !x.startsWith(id + '@');
    s.heute.nicht = s.heute.nicht.filter(fremd);
    s.heute.spaeter = s.heute.spaeter.filter(fremd);
    return s;
  }

  // Ist die Aufgabe jetzt dran? null oder { slot }, slot ist die Runde oder null.
  function dran(aufgabe, tag, stunde, plan) {
    if (aufgabe.irgendwann) return null;
    if (aufgabe.ruhtBis && tag < aufgabe.ruhtBis) return null;
    if (aufgabe.tage && !aufgabe.tage.includes(zeit.wochentag(tag))) return null;
    // Aufgaben mit Varianten bereiten den nächsten Tag vor; ist der als frei eingetragen, entfallen sie.
    if (aufgabe.varianten && plan && plan[zeit.plusTage(tag, 1)] === 'frei') return null;
    if (aufgabe.zeiten && aufgabe.zeiten.length) {
      const runden = aufgabe.runden || {};
      const offen = aufgabe.zeiten.filter(z => zeit.rundeOffen(z, stunde, aufgabe.fest, aufgabe.zeiten) && runden[z] !== tag);
      return offen.length ? { slot: offen[offen.length - 1] } : null;
    }
    if (aufgabe.zuletzt === tag) return null;
    if (aufgabe.zuletzt && zeit.tageZwischen(aufgabe.zuletzt, tag) < (aufgabe.rhythmus || 1)) return null;
    return { slot: null };
  }

  // „Noch nicht nötig“: die Aufgabe meldet sich in ein paar Tagen wieder.
  // tage: wie lange die Aufgabe ruht; ohne Angabe ein paar Tage
  function nochNicht(state, id, tag, tage) {
    if (!state.aufgaben.some(a => a.id === id)) return state;
    const s = kopie(state);
    const aufgabe = s.aufgaben.find(a => a.id === id);
    aufgabe.ruhtBis = zeit.plusTage(tag, tage >= 1 ? Math.round(tage) : KURZ(aufgabe));
    return s;
  }

  const KURZ = aufgabe => ((aufgabe.rhythmus || 1) > 7 ? 3 : 2);

  // Die Wege für „Wann wieder?“: ein paar Tage, eine Woche, zwei Wochen, ein ganzer Rhythmus.
  function ruheWege(aufgabe) {
    const r = aufgabe.rhythmus || 1;
    const kurz = KURZ(aufgabe);
    const wege = [{ tage: kurz, text: 'In ' + kurz + ' Tagen' }];
    for (const [tage, text] of [[7, 'In einer Woche'], [14, 'In 2 Wochen']]) {
      if (tage <= r && tage > kurz) wege.push({ tage, text });
    }
    if (r > kurz && !wege.some(w => w.tage === r)) wege.push({ tage: r, text: 'In ' + r + ' Tagen' });
    return wege;
  }

  // „Hat schon jemand gemacht“: erledigt, ohne dass im Zimmer etwas wächst.
  function abgenommen(state, id, tag, slot) {
    if (!state.aufgaben.some(a => a.id === id)) return state;
    const s = kopie(state);
    const aufgabe = s.aufgaben.find(a => a.id === id);
    if (slot) aufgabe.runden = Object.assign({}, aufgabe.runden, { [slot]: tag });
    aufgabe.zuletzt = tag;
    s.offen = s.offen.filter(o => o.aufgabeId !== id);
    return s;
  }

  function reinwerfen(state, { titel, art }, tag) {
    return neu(state, { titel, bereich: 'erledigungen', art: art === 'will' ? 'will' : 'muss', einmal: true, angelegt: tag });
  }

  // „Will“ wandert nach vier Wochen still in „Vielleicht irgendwann“. „Muss“ bleibt immer.
  // Reingeworfenes nachträglich zu „Muss“ oder „Will“ machen.
  function setzeArt(state, id, art) {
    if (!state.aufgaben.some(a => a.id === id) || (art !== 'muss' && art !== 'will')) return state;
    const s = kopie(state);
    const aufgabe = s.aufgaben.find(a => a.id === id);
    aufgabe.art = art;
    // Ein „Muss“ liegt nie bei „Vielleicht irgendwann“.
    if (art === 'muss') aufgabe.irgendwann = false;
    return s;
  }

  function aufraeumen(state, tag) {
    const alt = a => a.art === 'will' && !a.irgendwann && a.angelegt &&
      zeit.tageZwischen(a.angelegt, tag) >= WILL_TAGE && !state.offen.some(o => o.aufgabeId === a.id);
    if (!state.aufgaben.some(alt)) return state;
    const s = kopie(state);
    for (const a of s.aufgaben) if (alt(a)) a.irgendwann = true;
    return s;
  }

  function zurueckholen(state, id, tag) {
    if (!state.aufgaben.some(a => a.id === id)) return state;
    const s = kopie(state);
    const aufgabe = s.aufgaben.find(a => a.id === id);
    aufgabe.irgendwann = false;
    aufgabe.angelegt = tag;
    return s;
  }

  // Einmalige Umstellung auf den eigenen Aufgabensatz. Zimmer und Wesen bleiben.
  function meineEinsetzen(state, tag) {
    // Greift nur bei einem leeren Stand oder bei Aufgaben aus der Zeit der Startpakete (ohne
    // Rhythmus). Was nach dem neuen Muster angelegt wurde, bleibt unangetastet, auch Stände
    // vom Handy und Stände mit einem anderen Satz.
    if (!meine || state.satz !== undefined) return state;
    if (state.aufgaben.some(a => 'rhythmus' in a)) return state;
    let s = kopie(state);
    s.aufgaben = [];
    s.pakete = [];
    s.offen = [];
    s.heute = { tag: s.heute.tag || tag, nicht: [], spaeter: [], stuecke: s.heute.stuecke || 0, letzterBereich: null };
    for (const a of meine.AUFGABEN) s = neu(s, a);
    s.satz = meine.SATZ;
    return s;
  }

  // Was der Bildschirm von einer Aufgabe zeigt: Text, Dauer und Schritte der Größe.
  // Bei Aufgaben mit Varianten gilt die Fassung, die für den nächsten Tag eingetragen ist.
  // Steht dort nichts, kommt statt dessen die Frage mit den Wahlmöglichkeiten.
  function ansicht(aufgabe, groesse, state, tag) {
    if (!aufgabe.varianten) {
      const g = aufgabe.groessen[groesse];
      return { text: g.text, min: g.min, schritte: aufgabe.schritte ? aufgabe.schritte[groesse] || null : null };
    }
    const plan = state.plan || {};
    const zieltag = zeit.plusTage(tag, 1);
    const v = aufgabe.varianten.liste.find(x => x.id === plan[zieltag]);
    if (!v) {
      return { frage: aufgabe.varianten.frage, wahl: aufgabe.varianten.liste.map(x => ({ id: x.id, name: x.name })), zieltag };
    }
    let schritte = v.schritte[groesse].slice();
    // Zusatzschritte entfallen, wenn heute schon eine der genannten Fassungen galt.
    if (v.zusatz && !v.zusatz.nichtNach.includes(plan[tag])) schritte = schritte.concat(v.zusatz.schritte);
    return { text: v.groessen[groesse].text, min: v.groessen[groesse].min, schritte, variante: v.name, zieltag };
  }

  // Trägt für einen Tag eine Variante oder 'frei' ein; ein leerer Wert löscht den Eintrag.
  function setzePlan(state, tag, wert) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tag))) return state;
    const erlaubt = ['frei'];
    for (const a of state.aufgaben) if (a.varianten) for (const v of a.varianten.liste) erlaubt.push(v.id);
    if (wert !== null && wert !== undefined && !erlaubt.includes(wert)) return state;
    const s = kopie(state);
    s.plan = Object.assign({}, s.plan);
    if (wert === null || wert === undefined) delete s.plan[tag];
    else s.plan[tag] = wert;
    return s;
  }

  // Die kommenden Tage, die diese Aufgabe am Vorabend vorbereitet.
  function planTage(aufgabe, tag, anzahl) {
    const tage = [];
    for (let i = 1; i <= anzahl; i++) {
      const d = zeit.plusTage(tag, i);
      if (!aufgabe.tage || aufgabe.tage.includes(zeit.wochentag(zeit.plusTage(d, -1)))) tage.push(d);
    }
    return tage;
  }

  // Trägt Angaben nach, die der eigene Satz später dazubekommen hat.
  // Gefunden wird über den Titel; was an der Aufgabe schon steht, bleibt.
  const NACHTRAG = ['tage', 'varianten'];
  function nachtragen(state) {
    if (!meine) return state;
    const vorlage = (a, feld) => (feld in a ? null : meine.AUFGABEN.find(m => m[feld] && m.titel === a.titel));
    if (!state.aufgaben.some(a => NACHTRAG.some(feld => vorlage(a, feld)))) return state;
    const s = kopie(state);
    for (const a of s.aufgaben) {
      for (const feld of NACHTRAG) {
        const m = vorlage(a, feld);
        if (m) a[feld] = kopie(m[feld]);
      }
    }
    return s;
  }

  const api = { vorschlag, neu, aendere, groessenAus, loesche, dran, nochNicht, ruheWege, abgenommen, reinwerfen, setzeArt, aufraeumen, zurueckholen, meineEinsetzen, nachtragen, ansicht, setzePlan, planTage };
  root.AH = root.AH || {};
  root.AH.aufgaben = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
