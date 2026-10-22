// Startseite: Eingang-Zeile, Muss, Wochenziele, Gewohnheiten, Schwerer Tag und Aufnehmen.
// Nur Anzeige und Antippen; gerechnet wird in den Bausteinen.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  const MUSS_MAX = 4;
  const GESAMT_MAX = 6; // Muss und Ziele zusammen, mindestens ein Ziel
  const GEWOHNHEITEN_MAX = 6;
  const LANG_MS = 500;

  const ZAHNRAD = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9.5" stroke-width="3" stroke-dasharray="3.73 3.73"/>' +
    '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/></svg>';
  const MIKRO = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';

  // Tippen und langes Drücken (500 ms) am selben Element; das lange Drücken löst kein Tippen mehr aus.
  // Per Tastatur (Enter, Leertaste) gilt das Tippen.
  function druecken(el, tipp, lang) {
    let uhr = null;
    const ab = () => { clearTimeout(uhr); uhr = null; };
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      ab();
      uhr = setTimeout(() => { uhr = null; lang(); }, LANG_MS);
    });
    el.addEventListener('pointerup', () => {
      if (!uhr) return;
      ab();
      tipp();
    });
    el.addEventListener('pointerleave', ab);
    el.addEventListener('pointercancel', ab);
    el.addEventListener('click', e => { if (e.detail === 0) tipp(); });
    el.addEventListener('contextmenu', e => e.preventDefault());
    return el;
  }

  function kreisZeile(liste, eintrag, schild) {
    const abhaken = () => {
      const alt = app.state;
      app.setze(AH.eintraege.erledige(alt, liste, eintrag.id));
      app.rueckgaengig('Erledigt', alt);
    };
    return h('li', { class: 'zeile' },
      h('button', { class: 'haken', type: 'button', 'aria-label': 'Erledigt: ' + eintrag.text, 'data-fokus': liste + ':' + eintrag.id, onclick: abhaken },
        h('span', { class: 'kreis' })),
      h('span', { class: 'zeile-text', title: eintrag.text }, eintrag.text),
      schild ? h('span', { class: 'schild schild-' + schild.art }, schild.text) : null);
  }

  // Überschrift (antippen: alle Aufgaben) mit „+N weitere“ rechts daneben, damit die Liste kurz bleibt.
  function abschnitt(titel, mehr, inhalt) {
    return h('section', { class: 'abschnitt' },
      h('div', { class: 'abschnitt-kopf' },
        h('h2', { class: 'abschnitt-titel' },
          h('button', { type: 'button', onclick: () => app.zeige('alle') }, titel)),
        mehr > 0 ? h('button', { class: 'weitere', type: 'button', onclick: () => app.zeige('alle') }, '+' + mehr + ' weitere') : null),
      inhalt);
  }

  function kachel(g, heute) {
    const anzahl = AH.woche.anzahl(g, heute);
    const punkte = [];
    for (let i = 0; i < g.ziel; i++) punkte.push(h('span', { class: 'punkt' + (i < Math.min(anzahl, g.ziel) ? ' punkt-voll' : '') }));
    const k = h('button', {
      class: 'kachel', type: 'button', 'data-fokus': 'g:' + g.id,
      'aria-label': g.name + ', ' + anzahl + ' von ' + g.ziel + '. Tippen: eins mehr. Lange drücken: eins weniger.',
    },
    h('span', { class: 'kachel-kopf' },
      h('span', { class: 'kachel-name' }, g.name),
      h('span', { class: 'kachel-zahl' }, anzahl + '/' + g.ziel)),
    h('span', { class: 'punkte' }, punkte));
    return druecken(k,
      () => app.setze(AH.woche.plus(app.state, g.id, heute)),
      () => app.setze(AH.woche.minus(app.state, g.id, heute)));
  }

  function vonLetzterWoche(z, heute) {
    return h('div', { class: 'woche-alt' },
      h('span', { class: 'woche-alt-text' }, 'Von letzter Woche: ' + z.text),
      h('span', { class: 'woche-alt-knoepfe' },
        h('button', { class: 'klein', type: 'button', onclick: () => app.setze(AH.woche.mitnehmen(app.state, z.id, heute)) }, 'Mitnehmen'),
        h('button', { class: 'klein', type: 'button', onclick: () => {
          const alt = app.state;
          app.setze(AH.woche.streichen(alt, z.id));
          app.rueckgaengig('Gestrichen', alt);
        } }, 'Streichen')));
  }

  // Alte Einträge (v1) aus dem Browser: einmal fragen, den alten Schlüssel nie ändern.
  function altesZeile(roh) {
    const uebernehmen = () => {
      const neu = AH.speicher.altesUebernehmen(app.state, roh, app.heute());
      if (!neu) {
        app.melde('Die alten Einträge ließen sich nicht lesen.');
        return;
      }
      app.altesGefragt();
      app.setze(neu);
      if (neu.eingang.length > 0) app.melde('Im Eingang');
    };
    const neinDanke = () => {
      app.altesGefragt();
      app.zeichne();
    };
    return h('div', { class: 'woche-alt' },
      h('span', { class: 'woche-alt-text' }, 'Alte Einträge übernehmen'),
      h('span', { class: 'woche-alt-knoepfe' },
        h('button', { class: 'klein', type: 'button', onclick: uebernehmen }, 'Übernehmen'),
        h('button', { class: 'klein', type: 'button', onclick: neinDanke }, 'Nein danke')));
  }

  function schwererTag() {
    app.setze(AH.schwer.ein(app.state, app.jetzt()));
    app.zeige('schwer');
  }

  function aufnehmen() {
    AH.aufnehmen.starte(text => {
      const neu = AH.eingang.aufnehmen(app.state, text, app.heute());
      if (neu === app.state) return;
      app.setze(neu);
      app.melde('Im Eingang');
    });
  }

  function aufnehmenGetippt() {
    AH.aufnehmen.tippen(text => {
      const neu = AH.eingang.aufnehmen(app.state, text, app.heute());
      if (neu === app.state) return;
      app.setze(neu);
      app.melde('Im Eingang');
    });
  }

  function zeichne() {
    const heute = app.heute();
    const z = AH.zeit;
    const s = app.state;

    const muss = AH.fristen.sortiere(s.muss);
    const mussGezeigt = muss.slice(0, MUSS_MAX);
    const ziele = AH.woche.offeneZiele(s, heute);
    const zieleMax = Math.max(1, GESAMT_MAX - mussGezeigt.length);
    const zieleGezeigt = ziele.slice(0, zieleMax);
    const gewohnheiten = s.gewohnheiten.slice(0, GEWOHNHEITEN_MAX);
    const liegen = AH.woche.liegenGeblieben(s, heute);
    const altes = app.altes();

    const mikro = h('button', { class: 'mikro', type: 'button', 'aria-label': 'Aufnehmen. Lange drücken zum Tippen.' }, app.ikon(MIKRO));
    druecken(mikro, aufnehmen, aufnehmenGetippt);

    return h('div', { class: 'start' },
      h('header', { class: 'kopf' },
        h('h1', { class: 'datum' }, z.wochentagKurz(heute) + ', ' + z.datumKurz(heute)),
        h('button', { class: 'zahnrad', type: 'button', 'aria-label': 'Einstellungen', onclick: () => app.zeige('einstellungen') }, app.ikon(ZAHNRAD))),

      altes ? altesZeile(altes) : null,

      s.eingang.length > 0
        ? h('button', { class: 'eingang-zeile', type: 'button', onclick: () => app.zeige('eingang') }, s.eingang.length + ' im Eingang sortieren ›')
        : null,

      liegen.length > 0 ? vonLetzterWoche(liegen[0], heute) : null,

      abschnitt('Muss', muss.length - mussGezeigt.length,
        muss.length > 0
          ? h('ul', { class: 'liste' }, mussGezeigt.map(m => kreisZeile('muss', m, AH.fristen.schild(m.frist, heute))))
          : h('p', { class: 'leer' }, 'Nichts offen.')),

      ziele.length > 0
        ? abschnitt('Diese Woche', ziele.length - zieleGezeigt.length,
          h('ul', { class: 'liste' }, zieleGezeigt.map(g => kreisZeile('ziele', g, null))))
        : null,

      abschnitt('Gewohnheiten', s.gewohnheiten.length - gewohnheiten.length,
        s.gewohnheiten.length > 0
          ? h('div', { class: 'kacheln' }, gewohnheiten.map(g => kachel(g, heute)))
          : h('p', { class: 'leer' }, 'Noch keine Gewohnheit.')),

      h('footer', { class: 'fuss' },
        h('button', { class: 'pille', type: 'button', onclick: schwererTag }, 'Schwerer Tag'),
        mikro));
  }

  app.bildschirme.start = { zeichne };
})(typeof globalThis !== 'undefined' ? globalThis : this);
