// Laufende Aufgabe: sichtbar schrumpfende Zeit, Geschafft, Parken, Doch nicht.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;
  let takt = null;

  function stoppe() {
    if (takt) clearInterval(takt);
    takt = null;
  }

  function zurueck() {
    app.laeuft = null;
    app.zeige('jetzt');
  }

  // Eigener Bildschirm, damit das neue Stück ein Neuzeichnen übersteht.
  app.bildschirme.geschafft = {
    zeichne(el, ergebnis) {
      if (!ergebnis) return zurueck();
      let text = 'Schön, dass das erledigt ist.';
      let zusatz = null;
      if (ergebnis.stueck) {
        text = ergebnis.stueck.besonders ? 'Fertig gemacht. Dafür gibt es etwas Besonderes.' : 'Geschafft. Im Zimmer ist etwas dazugekommen.';
        zusatz = ergebnis.stueck.stueck;
      } else if (ergebnis.grund === 'grenze') {
        zusatz = 'Für heute ist es schön hier.';
      }
      const weiter = h('button', { class: 'knopf knopf-haupt', onclick: zurueck }, 'Weiter');
      el.append(
        AH.zimmerbild.element(app.state, app.state.form.stufe === 'klein' ? 'klein' : 'freut', ergebnis.stueck ? ergebnis.stueck.stueck : null),
        h('section', { class: 'karte karte-ruhig blase abschluss' },
          h('h1', { class: 'karte-text' }, text),
          zusatz ? h('p', { class: 'abschluss-stueck' }, zusatz) : null,
          ergebnis.danach ? h('p', { class: 'leise' }, ergebnis.danach) : null,
          h('div', { class: 'reihe' }, weiter)));
      weiter.focus({ preventScroll: true });
    },
  };
  app.bildschirme.timer = {
    verlasse: stoppe,
    zeichne(el) {
      stoppe();
      const lauf = app.laeuft;
      const aufgabe = lauf && app.state.aufgaben.find(a => a.id === lauf.aufgabeId);
      if (!aufgabe) return zurueck();
      const g = AH.aufgaben.ansicht(aufgabe, lauf.groesse, app.state, lauf.tag || app.heute());
      // Ist bei einer Aufgabe mit Varianten noch nichts gewählt, stellt die Karte erst die Frage.
      if (g.frage) return zurueck();
      const b = app.bereich(aufgabe.bereich);
      const dauerMs = g.min * 60000;
      let gesperrt = false;
      const einmal = fn => () => { if (gesperrt) return; gesperrt = true; fn(); };

      // Die Zeit läuft als Ring um das Wesen, das mitmacht. Am Ende jubelt es.
      const UMFANG = 553;
      const buehne = h('div', { class: 'zeitbuehne', 'aria-hidden': 'true' });
      const wesenbild = zustand => '<g transform="translate(40 34)"><g class="wesen' + (zustand === 'viel' ? ' jubelt' : '') + '">' +
        AH.wesenbild.innen(app.state.wesen, zustand) + '</g></g>';
      buehne.innerHTML = '<svg viewBox="0 0 200 200"><circle class="zeit-bahn" cx="100" cy="100" r="88"/>' +
        '<circle class="zeit-ring" cx="100" cy="100" r="88" stroke-dasharray="' + UMFANG + '" transform="rotate(-90 100 100)"/>' +
        '<g class="zeit-wesen">' + wesenbild('eifer') + '</g></svg>';
      const ring = buehne.querySelector('.zeit-ring');
      const uhr = h('p', { class: 'zeit-uhr', role: 'timer' });
      const rest = h('p', { class: 'leise zeit-text', 'aria-live': 'polite' });
      let phase = null;
      const tick = () => {
        const r = AH.zeit.rest(lauf.start, dauerMs, Date.now());
        ring.style.strokeDashoffset = (UMFANG * (1 - r.anteil)).toFixed(1);
        uhr.textContent = r.text;
        if (r.phase === phase) return;
        // beim ersten Zeichnen einer schon abgelaufenen Zeit nicht noch einmal brummen
        if (r.phase === 'um' && phase !== null && root.navigator.vibrate) root.navigator.vibrate([200, 120, 200]);
        phase = r.phase;
        buehne.dataset.phase = phase;
        if (phase === 'um') buehne.querySelector('.zeit-wesen').innerHTML = wesenbild('viel');
        rest.textContent = { laeuft: 'Ich mach mit.', endspurt: 'Gleich geschafft.', um: 'Die Zeit ist um. Mach in Ruhe fertig.' }[phase];
        if (schrittliste) rest.textContent = phase === 'um' ? 'Die Zeit ist um. Mach in Ruhe fertig.' : 'noch etwa ' + Math.max(1, Math.ceil(r.sek / 60)) + ' Min';
      };

      // Schritte zum Abhaken; die Haken überstehen ein Neuzeichnen.
      const schritte = g.schritte;
      lauf.haken = lauf.haken || [];
      const schrittliste = schritte && schritte.length ? h('div', { class: 'schritte', role: 'group', 'aria-label': 'Schritte' },
        schritte.map((text, i) => {
          const knopf = h('button', { class: 'schritt', 'aria-pressed': String(lauf.haken.includes(i)), onclick: () => {
            lauf.haken = lauf.haken.includes(i) ? lauf.haken.filter(x => x !== i) : lauf.haken.concat(i);
            knopf.setAttribute('aria-pressed', String(lauf.haken.includes(i)));
          } }, h('span', { class: 'schritt-haken', 'aria-hidden': 'true' }), text);
          return knopf;
        })) : null;

      const satz = h('input', { class: 'feld', type: 'text', maxlength: '120', placeholder: 'Wäsche hängt noch in der Maschine', 'aria-label': 'Wo bist du stehen geblieben?' });
      const parkbereich = h('div', { class: 'parken', hidden: true },
        h('p', { class: 'leise' }, 'Wo bist du stehen geblieben? Du kannst das Feld auch leer lassen.'),
        satz,
        h('button', { class: 'knopf knopf-haupt', onclick: einmal(() => {
          const s = AH.auswahl.festZurueck(AH.offen.parken(app.state, aufgabe.id, lauf.groesse, satz.value, app.heute()));
          app.laeuft = null;
          app.aktuell = 'jetzt';
          app.setze(s);
        }) }, 'Parken'));

      el.append(
        h('section', { class: 'karte karte-sticker b-' + b.farbe },
          AH.sticker.maskottchen(aufgabe.bereich),
          h('p', { class: 'karte-bereich' }, aufgabe.titel + (g.variante ? ' · ' + g.variante : '')),
          h('h1', { class: 'karte-text' }, g.text),
          aufgabe.fertig ? h('p', { class: 'karte-zusatz' }, aufgabe.fertig) : null,
          schrittliste,
          schrittliste ? null : buehne,
          schrittliste ? null : uhr,
          rest,
          h('div', { class: 'reihe' },
            h('button', { class: 'knopf knopf-haupt', onclick: einmal(() => {
              // Eine Runde zählt für den Tag, an dem sie begonnen wurde.
              const tag = lauf.slot && lauf.tag ? lauf.tag : app.heute();
              const ergebnis = AH.zimmer.erledigt(AH.auswahl.gezeigt(app.state, aufgabe), aufgabe.id, tag, lauf.slot);
              app.state = AH.auswahl.festZurueck(ergebnis.state);
              app.sichere();
              app.laeuft = null;
              if (app.bildschirme.jetzt.nachAbschluss) app.bildschirme.jetzt.nachAbschluss();
              app.zeige('geschafft', { stueck: ergebnis.stueck, grund: ergebnis.grund, danach: aufgabe.danach || '' });
            }) }, 'Geschafft'))),
        h('div', { class: 'reihe' },
          AH.offen.darfParken(aufgabe)
            ? h('button', { class: 'knopf knopf-still', onclick: () => { parkbereich.hidden = false; satz.focus(); } }, 'Parken')
            : null,
          h('button', { class: 'knopf knopf-still', onclick: zurueck }, 'Doch nicht')),
        parkbereich);

      tick();
      takt = setInterval(tick, 250);
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
