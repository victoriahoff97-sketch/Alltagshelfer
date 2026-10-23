// Alle Aufgaben: Muss, Ziele dieser Woche und Gewohnheiten als Listen, mit Formular zum Anlegen,
// Bearbeiten und Löschen. Dazu die kleinen Bausteine, die auch „Eingang sortieren“ braucht
// (Textfeld mit Hinweis, Frist-Auswahl, Zahl-Auswahl).
// Nur Anzeige und Antippen; gerechnet wird in den Bausteinen.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  const FEHLER_TEXT = 'Bitte einen Text eingeben.';
  const FEHLER_DATUM = 'Bitte ein Datum wählen.';

  // Textfeld mit Fehlerzeile. Leer lässt sich mit pruefe() abfangen: dann steht der Hinweis da.
  function textFeld(beschriftung, start, extra) {
    const feld = h('input', Object.assign({
      class: 'feld', type: 'text', 'aria-label': beschriftung, value: start || '', autocomplete: 'off',
    }, extra || {}));
    const fehler = h('p', { class: 'fehler', role: 'alert', hidden: true }, FEHLER_TEXT);
    feld.addEventListener('input', () => { fehler.hidden = true; feld.removeAttribute('aria-invalid'); });
    const el = h('div', { class: 'feld-block' }, feld, fehler);
    el.feld = feld;
    // Gibt den Text ohne Rand zurück; leer: Hinweis zeigen, Fokus ins Feld, null.
    el.pruefe = () => {
      const text = feld.value.trim();
      if (text) return text;
      fehler.hidden = false;
      feld.setAttribute('aria-invalid', 'true');
      feld.focus();
      return null;
    };
    return el;
  }

  // Aus einer gespeicherten Frist die passende Auswahl: heute, morgen, woche (= Sonntag), ohne oder das Datum selbst.
  function wahlAus(frist, heute) {
    if (!frist) return 'ohne';
    for (const w of ['heute', 'morgen', 'woche']) if (AH.eingang.fristAus(w, heute) === frist) return w;
    return frist;
  }

  const FRISTEN = [['heute', 'heute'], ['morgen', 'morgen'], ['woche', 'diese Woche']];

  // Frist-Auswahl: heute, morgen, diese Woche, Datum wählen, ohne Frist.
  // start = gewählte Auswahl (siehe wahlAus) oder null für keine. beiWahl(wahl) wird gerufen, sobald eine
  // gültige Auswahl da ist (ein Datum erst, wenn es gewählt ist). el.wahl() gibt die Auswahl oder null
  // (Datum gewählt, aber noch keins eingetragen).
  function fristAuswahl(start, beiWahl) {
    let modus = null; // 'heute' | 'morgen' | 'woche' | 'ohne' | 'datum' | null
    let datum = '';
    if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) { modus = 'datum'; datum = start; } else modus = start || null;

    const knoepfe = {};
    const eingabe = h('input', {
      class: 'feld feld-datum', type: 'date', 'aria-label': 'Datum', value: datum, hidden: modus !== 'datum',
      onchange: () => {
        datum = eingabe.value;
        fehler.hidden = true;
        if (datum && beiWahl) beiWahl(datum);
      },
    });
    const fehler = h('p', { class: 'fehler', role: 'alert', hidden: true }, FEHLER_DATUM);

    const zeige = () => {
      for (const [m, k] of Object.entries(knoepfe)) k.setAttribute('aria-pressed', m === modus ? 'true' : 'false');
      eingabe.hidden = modus !== 'datum';
    };
    const waehle = m => {
      modus = m;
      fehler.hidden = true;
      zeige();
      if (m === 'datum') {
        eingabe.focus();
        if (datum && beiWahl) beiWahl(datum);
        return;
      }
      if (beiWahl) beiWahl(m);
    };
    const chip = (m, text) => {
      knoepfe[m] = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: () => waehle(m) }, text);
      return knoepfe[m];
    };

    const el = h('div', { class: 'wahl-block' },
      h('div', { class: 'wahl', role: 'group', 'aria-label': 'Bis wann?' },
        FRISTEN.map(([m, t]) => chip(m, t)),
        chip('datum', 'Datum wählen'),
        chip('ohne', 'ohne Frist')),
      eingabe, fehler);
    zeige();
    el.wahl = () => {
      if (modus === 'datum') {
        if (!datum) { fehler.hidden = false; eingabe.focus(); return null; }
        return datum;
      }
      return modus || 'ohne';
    };
    return el;
  }

  // Zahl-Auswahl 1 bis 7 („Wie oft pro Woche?“). start = vorgewählte Zahl oder null.
  function zahlAuswahl(start, beiWahl) {
    let gewaehlt = start || null;
    const knoepfe = [];
    const zeige = () => knoepfe.forEach((k, i) => k.setAttribute('aria-pressed', i + 1 === gewaehlt ? 'true' : 'false'));
    for (let n = 1; n <= 7; n++) {
      knoepfe.push(h('button', {
        class: 'chip chip-zahl', type: 'button', 'aria-pressed': 'false', 'aria-label': n + '-mal pro Woche',
        onclick: () => { gewaehlt = n; zeige(); if (beiWahl) beiWahl(n); },
      }, String(n)));
    }
    const el = h('div', { class: 'wahl wahl-zahl', role: 'group', 'aria-label': 'Wie oft pro Woche?' }, knoepfe);
    zeige();
    el.wahl = () => gewaehlt;
    return el;
  }

  // Name der Farben und Symbole zum Vorlesen (die Chips selbst zeigen nur Farbe bzw. Emoji).
  const FARB_NAMEN = { rosa: 'Rosa', blau: 'Blau', tuerkis: 'Türkis', orange: 'Orange', lila: 'Lila', gelb: 'Gelb' };
  const SYMBOL_NAMEN = ['Laufen', 'Wasser', 'Bücher', 'Japan', 'Meditation', 'Zähne', 'Tablette', 'Putzen', 'Hund', 'Katze',
    'Pflanze', 'Musik', 'Schreiben', 'Apfel', 'Schlafen', 'Stern'];

  // Eine Reihe Chips, genau einer gewählt. start = vorgewählter Wert. el.wahl() gibt den gewählten Wert,
  // el.geaendert() sagt, ob jemand getippt hat (sonst bleibt die Wahl automatisch und wird nicht gespeichert).
  function eineAus(beschriftung, werte, start, chip) {
    let gewaehlt = start;
    let geaendert = false;
    const knoepfe = werte.map(w => {
      const k = chip(w);
      k.setAttribute('aria-pressed', 'false');
      k.addEventListener('click', () => { gewaehlt = w; geaendert = true; zeige(); });
      return k;
    });
    const zeige = () => knoepfe.forEach((k, i) => k.setAttribute('aria-pressed', werte[i] === gewaehlt ? 'true' : 'false'));
    const el = h('div', { class: 'wahl', role: 'group', 'aria-label': beschriftung }, knoepfe);
    zeige();
    el.wahl = () => gewaehlt;
    el.geaendert = () => geaendert;
    return el;
  }

  function farbAuswahl(start) {
    return eineAus('Farbe', AH.speicher.FARBEN, start, f => h('button', {
      class: 'chip chip-farbe farbe-' + f, type: 'button', 'aria-label': 'Farbe ' + FARB_NAMEN[f],
    }));
  }

  function symbolAuswahl(start) {
    return eineAus('Symbol', AH.eintraege.SYMBOLE, start, sym => h('button', {
      class: 'chip chip-symbol', type: 'button', 'aria-label': 'Symbol ' + (SYMBOL_NAMEN[AH.eintraege.SYMBOLE.indexOf(sym)] || sym),
    }, sym));
  }

  app.bauteile = { textFeld, fristAuswahl, zahlAuswahl, wahlAus, farbAuswahl, symbolAuswahl };

  const TITEL = { muss: 'Muss', ziele: 'Diese Woche', gewohnheiten: 'Gewohnheiten' };
  const NEU_TITEL = { muss: 'Neues Muss', ziele: 'Neues Ziel', gewohnheiten: 'Neue Gewohnheit' };
  const BEARBEITEN_TITEL = { muss: 'Muss bearbeiten', ziele: 'Ziel bearbeiten', gewohnheiten: 'Gewohnheit bearbeiten' };

  function zeile(liste, eintrag, heute) {
    let rechts = null;
    if (liste === 'muss') {
      const s = AH.fristen.schild(eintrag.frist, heute);
      if (s) rechts = h('span', { class: 'schild schild-' + s.art }, s.text);
    } else if (liste === 'gewohnheiten') {
      rechts = h('span', { class: 'zaehlung' }, AH.woche.anzahl(eintrag, heute) + '/' + eintrag.ziel);
    }
    const istGewohnheit = liste === 'gewohnheiten';
    const name = istGewohnheit ? eintrag.name : eintrag.text;
    const pos = istGewohnheit ? app.state.gewohnheiten.indexOf(eintrag) : -1;
    return h('li', { class: 'zeile' + (istGewohnheit ? ' farbe-' + AH.eintraege.farbeVon(eintrag, pos) : '') },
      h('button', {
        class: 'zeile-knopf', type: 'button', 'data-fokus': 'alle:' + liste + ':' + eintrag.id,
        'aria-label': name + (rechts ? ', ' + rechts.textContent : '') + '. Bearbeiten',
        onclick: () => app.zeige('alle', { liste, id: eintrag.id }),
      },
      istGewohnheit ? h('span', { class: 'zeile-symbol', 'aria-hidden': 'true' }, AH.eintraege.symbolVon(eintrag, pos)) : null,
      h('span', { class: 'zeile-text', title: name }, name),
      rechts));
  }

  function abschnitt(liste, eintraege, heute) {
    return h('section', { class: 'abschnitt karte sek-' + liste },
      h('div', { class: 'abschnitt-kopf' },
        h('h2', { class: 'abschnitt-titel abschnitt-titel-text' }, TITEL[liste]),
        h('button', { class: 'klein', type: 'button', 'data-fokus': 'neu:' + liste, 'aria-label': 'Neu: ' + TITEL[liste], onclick: () => app.zeige('alle', { liste, id: null }) }, 'Neu')),
      eintraege.length > 0
        ? h('ul', { class: 'liste' }, eintraege.map(e => zeile(liste, e, heute)))
        : h('p', { class: 'leer' }, liste === 'gewohnheiten' ? 'Noch keine Gewohnheit.' : 'Nichts offen.'));
  }

  function liste() {
    const heute = app.heute();
    const s = app.state;
    return h('div', { class: 'seite' },
      h('header', { class: 'kopf' },
        h('h1', { class: 'datum' }, 'Alle Aufgaben'),
        h('button', { class: 'klein', type: 'button', onclick: () => app.zeige('start') }, 'Zurück')),
      abschnitt('muss', AH.fristen.sortiere(s.muss), heute),
      abschnitt('ziele', AH.woche.offeneZiele(s, heute), heute),
      abschnitt('gewohnheiten', s.gewohnheiten, heute));
  }

  // Formular zum Anlegen (id = null) oder Bearbeiten. zurueckZu: wohin Speichern und Zurück führen
  // ('alle', oder 'start', wenn das ＋ der Startseite das Formular geöffnet hat).
  function formular(liste, id, zurueckZu) {
    const heute = app.heute();
    const alt = id ? app.state[liste].find(e => e.id === id) : null;
    if (id && !alt) return null; // gibt es nicht mehr (etwa von einem Widget geändert)

    const istGewohnheit = liste === 'gewohnheiten';
    const text = textFeld(istGewohnheit ? 'Name' : 'Text', alt ? (istGewohnheit ? alt.name : alt.text) : '');
    const frist = liste === 'muss' ? fristAuswahl(alt ? wahlAus(alt.frist, heute) : 'ohne') : null;
    const zahl = istGewohnheit ? zahlAuswahl(alt ? alt.ziel : 3) : null;
    // Vorgewählt: die eigene Wahl oder das, was die Gewohnheit automatisch bekommt
    const pos = alt ? app.state.gewohnheiten.indexOf(alt) : app.state.gewohnheiten.length;
    const vorschlag = alt ? AH.eintraege.farbeVon(alt, pos) : AH.eintraege.freieFarbe(app.state.gewohnheiten);
    const farbe = istGewohnheit ? farbAuswahl(vorschlag) : null;
    const symbol = istGewohnheit ? symbolAuswahl(AH.eintraege.symbolVon(alt, pos)) : null;

    const speichern = () => {
      const t = text.pruefe();
      if (!t) return;
      let neu = app.state;
      if (liste === 'muss') {
        const wahl = frist.wahl();
        if (wahl === null) return;
        const f = AH.eingang.fristAus(wahl, heute);
        neu = alt ? AH.eintraege.aendere(neu, 'muss', id, { text: t, frist: f }) : AH.eintraege.neuMuss(neu, { text: t, frist: f }, heute);
      } else if (liste === 'ziele') {
        neu = alt ? AH.eintraege.aendere(neu, 'ziele', id, { text: t }) : AH.eintraege.neuZiel(neu, { text: t }, heute);
      } else {
        const felder = { name: t, ziel: zahl.wahl() };
        // Farbe und Symbol nur speichern, wenn jemand gewählt hat; sonst bleibt es automatisch
        if (farbe.geaendert()) felder.farbe = farbe.wahl();
        if (symbol.geaendert()) felder.symbol = symbol.wahl();
        neu = alt ? AH.eintraege.aendere(neu, 'gewohnheiten', id, felder) : AH.eintraege.neueGewohnheit(neu, felder, heute);
      }
      app.setze(neu);
      app.zeige(zurueckZu);
    };

    const loeschen = () => {
      const vorher = app.state;
      app.setze(AH.eintraege.loesche(vorher, liste, id));
      app.zeige('alle');
      app.rueckgaengig('Gelöscht', vorher);
    };

    text.feld.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); speichern(); } });

    return h('div', { class: 'seite sek-' + liste },
      h('header', { class: 'kopf' },
        h('h1', { class: 'datum' }, alt ? BEARBEITEN_TITEL[liste] : NEU_TITEL[liste]),
        h('button', { class: 'klein', type: 'button', onclick: () => app.zeige(zurueckZu) }, 'Zurück')),
      h('div', { class: 'formular karte' },
        h('label', { class: 'etikett' }, istGewohnheit ? 'Name' : 'Text', text),
        frist ? h('div', { class: 'etikett' }, 'Bis wann?', frist) : null,
        zahl ? h('div', { class: 'etikett' }, 'Wie oft pro Woche?', zahl) : null,
        farbe ? h('div', { class: 'etikett' }, 'Farbe', farbe) : null,
        symbol ? h('div', { class: 'etikett' }, 'Symbol', symbol) : null,
        h('div', { class: 'formular-knoepfe' },
          h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: speichern }, 'Speichern'),
          alt ? h('button', { class: 'knopf', type: 'button', onclick: loeschen }, 'Löschen') : null)));
  }

  app.bildschirme.alle = {
    zeichne(daten) {
      if (daten && TITEL[daten.liste]) {
        const f = formular(daten.liste, daten.id || null, daten.zurueck === 'start' ? 'start' : 'alle');
        if (f) return f;
        app.daten = null; // Eintrag ist weg: zurück zur Liste
      }
      return liste();
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
