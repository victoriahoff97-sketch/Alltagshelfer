// Jetzt-Bildschirm: die eine Sache, die Tagesform, „Gerade offen“ und das Reinwerfen.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  const STUFEN_TEXT = { klein: 'wenig', mittel: 'mittel', gross: 'viel' };
  const RUNDEN_TEXT = { morgens: 'morgens', abends: 'abends', nacht: 'abends' };
  const an = (el, ...kinder) => el.append(...kinder.flat(2).filter(Boolean));
  let ohneOffen = false; // „Lieber etwas Neues“ gilt, bis etwas gestartet oder erledigt wurde
  let meldung = null;    // { text, mussId }: ein Satz nach dem Reinwerfen, mit Knopf, um aus „Will“ ein „Muss“ zu machen
  let gewaehlt = null;   // aus „Heute dran“ ausgesucht; gilt, bis etwas gestartet, erledigt oder weggelegt wird
  const Sprache = root.SpeechRecognition || root.webkitSpeechRecognition;

  // Die Runde, in der eine Aufgabe gerade erledigt würde (auch für Geparktes).
  function rundeVon(aufgabe) {
    const d = AH.aufgaben.dran(aufgabe, app.heute(), app.stunde());
    if (d) return d.slot;
    if (!aufgabe.zeiten) return null;
    return aufgabe.zeiten.find(z => (aufgabe.runden || {})[z] !== app.heute()) || aufgabe.zeiten[aufgabe.zeiten.length - 1];
  }

  function starte(aufgabe, groesse) {
    if (!AH.offen.kannStarten(app.state, aufgabe.id)) return fragenWegenOffen();
    ohneOffen = false;
    gewaehlt = null;
    // tag: der Tag, zu dem die Runde gehört, auch wenn „Geschafft“ erst nach 4 Uhr früh kommt
    app.laeuft = { aufgabeId: aufgabe.id, groesse, slot: rundeVon(aufgabe), tag: app.heute(), start: Date.now(), haken: [] };
    app.state = AH.tagesform.ruhe(app.state);
    app.zeige('timer');
  }

  function offeneMitAufgabe() {
    return app.state.offen
      .map(o => ({ o, aufgabe: app.state.aufgaben.find(a => a.id === o.aufgabeId) }))
      .filter(x => x.aufgabe);
  }

  function fragenWegenOffen() {
    const wege = [];
    for (const { o, aufgabe } of offeneMitAufgabe()) {
      wege.push({ text: 'Weitermachen: ' + aufgabe.titel, haupt: wege.length === 0, tu: () => starte(aufgabe, o.groesse) });
    }
    for (const { aufgabe } of offeneMitAufgabe()) {
      wege.push({ text: 'Zurücklegen: ' + aufgabe.titel, tu: () => app.setze(AH.offen.zuruecklegen(app.state, aufgabe.id)) });
    }
    wege.push({ text: 'Abbrechen' });
    app.frage('Erst eins fertig machen?', wege, 'Zwei Sachen sind gerade offen.');
  }

  function tagesformLeiste() {
    const stufe = app.state.form.stufe;
    return h('div', { class: 'form', role: 'group', 'aria-label': 'Wie viel Energie ist gerade da?' },
      h('span', { class: 'leise' }, 'Energie'),
      AH.tagesform.STUFEN.map(s => h('button', {
        class: 'form-knopf', 'aria-pressed': String(s === stufe),
        onclick: () => app.setze(AH.tagesform.setze(app.state, s)),
      }, STUFEN_TEXT[s])));
  }

  function karteAufgabe(aufgabe, groesse, slot) {
    // Text, Dauer und Schritte der Größe; bei Aufgaben mit Varianten die Fassung für morgen
    const g = AH.aufgaben.ansicht(aufgabe, groesse, app.state, app.heute());
    const b = app.bereich(aufgabe.bereich);
    const anders = () => {
      gewaehlt = null;
      let s = AH.auswahl.gezeigt(app.state, aufgabe);
      s = AH.auswahl.weiter(s, AH.auswahl.schluessel(aufgabe, slot));
      // „Gleich“ bei festen Aufgaben sagt nichts über die Tagesform
      app.setze(aufgabe.fest ? AH.tagesform.ruhe(s) : AH.tagesform.anders(s));
    };
    const heuteNicht = () => {
      gewaehlt = null;
      app.setze(AH.tagesform.ruhe(AH.auswahl.heuteNicht(AH.auswahl.gezeigt(app.state, aufgabe), AH.auswahl.schluessel(aufgabe, slot))));
      app.frage('Gerade schlecht?', [
        { text: 'Ja, heute nur Kleines', haupt: true, tu: () => app.setze(AH.tagesform.schlecht(app.state)) },
        { text: 'Nein, nur diese Sache nicht' },
      ]);
    };
    const abgenommen = () => (gewaehlt = null, app.setze(AH.auswahl.festZurueck(AH.tagesform.ruhe(
      AH.aufgaben.abgenommen(AH.auswahl.gezeigt(app.state, aufgabe), aufgabe.id, app.heute(), slot)))));
    const nochNicht = () => app.frage('Wann wieder?', AH.aufgaben.ruheWege(aufgabe).map((w, i) => ({
      text: w.text, haupt: i === 0,
      tu: () => {
        gewaehlt = null;
        app.setze(AH.tagesform.ruhe(AH.aufgaben.nochNicht(AH.auswahl.gezeigt(app.state, aufgabe), aufgabe.id, app.heute(), w.tage)));
      },
    })).concat({ text: 'Abbrechen' }), aufgabe.titel);

    // Die Farbe und das Maskottchen zeigen den Bereich, die Marke nennt die Aufgabe.
    const marke = aufgabe.titel + (g.variante ? ' · ' + g.variante : '') + (slot ? ' · ' + RUNDEN_TEXT[slot] : '') + (aufgabe.art === 'muss' ? ' · Muss' : '');
    const planen = () => app.zeige('plan', { id: aufgabe.id });

    // Für morgen ist noch keine Variante gewählt: erst die Frage, dann die Schritte.
    if (g.frage) {
      const waehle = wert => () => app.setze(AH.tagesform.ruhe(AH.aufgaben.setzePlan(app.state, g.zieltag, wert)));
      return [
        h('section', { class: 'karte karte-sticker blase b-' + b.farbe },
          AH.sticker.maskottchen(aufgabe.bereich),
          h('p', { class: 'karte-bereich' }, marke),
          h('h1', { class: 'karte-text' }, g.frage),
          h('div', { class: 'reihe' },
            g.wahl.map((w, i) => h('button', { class: 'knopf' + (i === 0 ? ' knopf-haupt' : ''), onclick: waehle(w.id) }, w.name)))),
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-still', onclick: waehle('frei') }, 'Morgen frei'),
          h('button', { class: 'knopf knopf-still', onclick: anders }, 'Etwas anderes')),
        h('div', { class: 'reihe' }, h('button', { class: 'knopf knopf-still', onclick: planen }, 'Tage im Voraus eintragen')),
      ];
    }

    const dritte = [
      aufgabe.varianten ? h('button', { class: 'knopf knopf-still', onclick: planen }, 'Doch anders') : null,
      aufgabe.geteilt ? h('button', { class: 'knopf knopf-still', onclick: abgenommen }, 'Hat schon jemand gemacht') : null,
      !aufgabe.fest && !aufgabe.einmal && (aufgabe.rhythmus || 1) > 1
        ? h('button', { class: 'knopf knopf-still', onclick: nochNicht }, 'Noch nicht nötig') : null,
    ].filter(Boolean);

    return [
      h('section', { class: 'karte karte-sticker blase b-' + b.farbe },
        AH.sticker.maskottchen(aufgabe.bereich),
        h('p', { class: 'karte-bereich' }, marke),
        h('h1', { class: 'karte-text' }, g.text),
        h('p', { class: 'karte-dauer' }, 'etwa ' + g.min + ' Min'),
        aufgabe.fertig ? h('p', { class: 'karte-zusatz' }, aufgabe.fertig) : null,
        aufgabe.notiz ? h('p', { class: 'karte-zusatz' }, 'Deine Notiz: ' + aufgabe.notiz) : null,
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: () => starte(aufgabe, groesse) }, 'Los'),
          groesse !== 'winzig'
            ? h('button', { class: 'knopf', onclick: () => app.setze(AH.tagesform.kleiner(app.state)) }, 'Kleiner')
            : null)),
      aufgabe.fest
        ? h('div', { class: 'reihe' }, h('button', { class: 'knopf knopf-still', onclick: anders }, 'Gleich'))
        : h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-still', onclick: anders }, 'Etwas anderes'),
          h('button', { class: 'knopf knopf-still', onclick: heuteNicht }, 'Heute nicht')),
      dritte.length ? h('div', { class: 'reihe' }, dritte) : null,
    ];
  }

  function karteOffen(offen, aufgabe) {
    const b = app.bereich(aufgabe.bereich);
    return [
      h('section', { class: 'karte karte-sticker blase b-' + b.farbe },
        AH.sticker.maskottchen(aufgabe.bereich),
        h('p', { class: 'karte-bereich' }, aufgabe.titel + ' · schon angefangen'),
        h('h1', { class: 'karte-text' }, aufgabe.groessen[offen.groesse].text),
        offen.satz ? h('p', { class: 'karte-zusatz' }, 'Stehen geblieben bei: ' + offen.satz) : null,
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: () => starte(aufgabe, offen.groesse) }, 'Fertig machen'))),
      h('div', { class: 'reihe' },
        h('button', { class: 'knopf knopf-still', onclick: () => { ohneOffen = true; app.setze(AH.tagesform.ruhe(app.state)); } }, 'Lieber etwas Neues'),
        h('button', { class: 'knopf knopf-still', onclick: () => app.setze(AH.tagesform.ruhe(AH.offen.zuruecklegen(app.state, aufgabe.id))) }, 'Zurücklegen')),
    ];
  }

  function ablageOffen() {
    const liste = offeneMitAufgabe();
    if (!liste.length) return null;
    return h('section', { class: 'ablage' },
      h('h2', { class: 'ablage-titel' }, 'Gerade offen, ' + liste.length + ' von ' + AH.offen.MAX),
      liste.map(({ o, aufgabe }) => h('button', { class: 'ablage-eintrag b-' + app.bereich(aufgabe.bereich).farbe, onclick: () => starte(aufgabe, o.groesse) },
        h('span', { class: 'ablage-text' }, aufgabe.titel),
        o.satz ? h('span', { class: 'leise' }, o.satz) : null)));
  }

  // Alles, was heute ansteht, zum Aufklappen. Ein Tipp holt die Aufgabe auf die Karte.
  function heuteListe(gezeigt) {
    const liste = AH.auswahl.heuteDran(app.state, { stunde: app.stunde() });
    if (liste.length < 2) return null;
    return h('details', { class: 'heute-liste' },
      h('summary', {}, 'Heute dran · ' + liste.length),
      h('div', { class: 'heute-reihen' }, liste.map(x => {
        const g = AH.aufgaben.ansicht(x.aufgabe, x.groesse, app.state, app.heute());
        const eintrag = AH.auswahl.schluessel(x.aufgabe, x.slot);
        return h('button', {
          class: 'heute-eintrag b-' + app.bereich(x.aufgabe.bereich).farbe,
          'aria-current': eintrag === gezeigt ? 'true' : null,
          onclick: () => {
            gewaehlt = eintrag;
            app.setze(AH.tagesform.ruhe(app.state));
            root.scrollTo(0, 0);
          },
        }, h('span', { class: 'heute-text' }, x.aufgabe.titel + (x.slot ? ' · ' + RUNDEN_TEXT[x.slot] : '')),
          g.min ? h('span', { class: 'heute-min' }, g.min + ' Min') : null);
      })));
  }

  // Reinwerfen per Stimme: das Gesagte liegt sofort bei „Will“.
  function diktiere(knopf, status) {
    const r = new Sprache();
    let fertig = false;
    const ende = text => { fertig = true; meldung = { text }; app.zeichne(); };
    r.lang = 'de-DE';
    r.interimResults = false;
    r.onresult = e => {
      const text = String(e.results[0][0].transcript || '').trim();
      if (!text) return ende('Ich habe nichts gehört.');
      fertig = true;
      const s = AH.aufgaben.reinwerfen(app.state, { titel: text[0].toUpperCase() + text.slice(1), art: 'will' }, app.heute());
      if (s === app.state) return ende('Das habe ich nicht verstanden. Versuch es noch einmal.');
      const neu = s.aufgaben[s.aufgaben.length - 1];
      meldung = { text: '„' + neu.titel + '“ liegt bei „Will“ bereit.', mussId: neu.id };
      app.setze(s);
    };
    r.onerror = e => ende(e.error === 'not-allowed' || e.error === 'service-not-allowed'
      ? 'Das Mikro ist für die App nicht erlaubt. Tippen geht immer.'
      : 'Das habe ich nicht verstanden. Versuch es noch einmal.');
    r.onend = () => { if (!fertig) ende('Ich habe nichts gehört.'); };
    knopf.disabled = true;
    status.textContent = 'Ich höre zu. Sag, worum es geht.';
    try { r.start(); } catch (e) { ende('Das Mikro lässt sich gerade nicht starten.'); }
  }

  function meldungZeile() {
    if (!meldung) return null;
    const id = meldung.mussId;
    return h('div', { class: 'meldung' },
      h('p', { class: 'leise', role: 'status' }, meldung.text),
      id ? h('button', { class: 'knopf knopf-still', onclick: () => {
        meldung = { text: 'Liegt jetzt bei „Muss“ und geht nicht verloren.' };
        app.setze(AH.aufgaben.setzeArt(app.state, id, 'muss'));
      } }, 'Ist ein Muss') : null);
  }

  const HINWEISE = {
    beschaedigt: 'Der gespeicherte Stand war nicht lesbar. Er ist aufbewahrt, die App beginnt neu.',
    'kein-speicher': 'Dieser Browser lässt kein Speichern zu. Dein Stand hält nur, bis du die Seite schließt.',
  };

  app.bildschirme.jetzt = {
    zeichne(el) {
      const r = AH.auswahl.waehle(app.state, { ohneOffen, stunde: app.stunde(), gewaehlt });
      const hoert = h('p', { class: 'leise', role: 'status' });
      const mikro = Sprache ? h('button', { class: 'knopf knopf-rein knopf-mikro', onclick: () => diktiere(mikro, hoert) }, 'Diktieren') : null;
      if (app.hinweis) an(el, h('p', { class: 'hinweis' }, HINWEISE[app.hinweis]));
      an(el, tagesformLeiste(), AH.zimmerbild.element(app.state));
      if (r.art === 'aufgabe') an(el, karteAufgabe(r.aufgabe, r.groesse, r.slot));
      else if (r.art === 'offen') an(el, karteOffen(r.offen, r.aufgabe));
      else if (r.art === 'keine') an(el, h('section', { class: 'karte karte-ruhig blase' },
        h('h1', { class: 'karte-text' }, 'Hier ist noch nichts zu tun.'),
        h('p', { class: 'leise' }, 'Spiel deine Sicherung vom PC ein oder wirf eine erste Aufgabe rein.'),
        h('div', { class: 'reihe' }, h('button', { class: 'knopf knopf-haupt', onclick: () => app.zeige('sicherung') }, 'Sicherung einspielen'))));
      else an(el, h('section', { class: 'karte karte-ruhig blase' }, h('h1', { class: 'karte-text' }, 'Für heute ist nichts mehr dran.')));
      if (r.art !== 'offen') an(el, ablageOffen());
      an(el,
        meldungZeile(),
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-rein', onclick: () => app.zeige('reinwerfen') }, 'Aufgabe reinwerfen'),
          mikro),
        hoert,
        heuteListe(r.art === 'aufgabe' ? AH.auswahl.schluessel(r.aufgabe, r.slot) : null));
      meldung = null;
    },
    nachAbschluss() { ohneOffen = false; gewaehlt = null; },
    // „Jetzt machen“ aus der Aufgabenliste: startet in der Größe, die zur Energie passt
    starte(aufgabe) { starte(aufgabe, AH.tagesform.groesseFuer(app.state.form.stufe)); },
  };

  app.bildschirme.reinwerfen = {
    zeichne(el) {
      const titel = h('input', { class: 'feld', id: 'f-rein', type: 'text', maxlength: '80', placeholder: 'Arztrechnung bezahlen', autocomplete: 'off' });
      const fehler = h('p', { class: 'fehler', role: 'alert', hidden: true }, 'Schreib kurz auf, worum es geht.');
      const wirf = art => () => {
        if (!titel.value.trim()) {
          fehler.hidden = false;
          return titel.focus();
        }
        meldung = { text: art === 'muss' ? 'Liegt bei „Muss“ bereit und geht nicht verloren.' : 'Liegt bei „Will“ bereit.' };
        app.aktuell = 'jetzt';
        app.setze(AH.aufgaben.reinwerfen(app.state, { titel: titel.value, art }, app.heute()));
      };
      titel.addEventListener('input', () => { fehler.hidden = true; });
      an(el,
        h('h1', { class: 'titel' }, 'Aufgabe reinwerfen'),
        h('div', { class: 'feldzeile' }, h('label', { for: 'f-rein' }, 'Worum geht es?'), titel),
        fehler,
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: wirf('muss') }, 'Muss ich machen'),
          h('button', { class: 'knopf', onclick: wirf('will') }, 'Will ich machen')),
        h('p', { class: 'leise' }, '„Muss“ bleibt stehen, bis es erledigt ist. „Will“ darf liegen bleiben.'),
        h('div', { class: 'reihe' }, h('button', { class: 'knopf knopf-still', onclick: () => app.zeige('jetzt') }, 'Abbrechen')));
      titel.focus();
    },
  };

  app.bildschirme.willkommen = {
    zeichne(el) {
      an(el,
        h('p', { class: 'gruss' }, 'Schön, dass du da bist'),
        h('h1', { class: 'titel' }, 'Wer soll bei dir einziehen?'),
        AH.zimmerbild.element(app.state),
        AH.sticker.wesenwahl('Such dir jemanden aus. Du kannst später jederzeit wechseln.'),
        h('p', { class: 'leise' }, app.state.aufgaben.length
          ? 'Deine Aufgaben sind schon eingerichtet. Du siehst immer nur eine.'
          : 'Deine Aufgaben holst du gleich mit einer Sicherung von deinem PC, oder du legst neue an.'),
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: () => {
            app.aktuell = 'jetzt';
            app.setze(Object.assign({}, app.state, { willkommen: true }));
          } }, 'Los geht’s')));
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
