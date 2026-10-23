// Einstellungen: die Schritte der zwei Routinen bearbeiten, Sicherung speichern und einspielen,
// auf Android der Hinweis für die Widgets, im Browser der Link zur Android-App.
// Nur Anzeige und Antippen; gerechnet wird in den Bausteinen.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  const ROUTINEN = [['wohnung', 'Notfall Wohnung'], ['abend', 'Abend']];
  const DATEINAME = 'alltagshelfer-sicherung.json';
  const KEINE_SICHERUNG = 'Diese Datei ist keine Alltagshelfer-Sicherung.';
  const XIAOMI = 'Damit die Widgets aktuell bleiben: In den Einstellungen des Handys bei Alltagshelfer ‚Autostart‘ erlauben und beim Akku ‚Keine Einschränkungen‘ wählen.';

  // Neuer Zustand, in dem die Schritte der Routine r durch aendere(liste) verändert wurden.
  function mitRoutine(r, aendere) {
    const neu = structuredClone(app.state);
    aendere(neu.routinen[r]);
    return neu;
  }

  // Fokus auf das erste Element, das sich fokussieren lässt (ein ausgeschalteter Knopf nimmt ihn nicht).
  function fokusSetzen(...schluessel) {
    for (const k of schluessel) {
      const el = document.querySelector('[data-fokus="' + k + '"]');
      if (el && !el.disabled) { el.focus({ preventScroll: true }); return; }
    }
  }

  function schrittZeile(r, i, text, anzahl) {
    const feld = h('input', {
      class: 'feld', type: 'text', value: text, autocomplete: 'off',
      'aria-label': 'Schritt ' + (i + 1), 'data-fokus': 'text:' + r + ':' + i,
    });
    // Beim Verlassen oder mit Enter umbenennen. Ohne neu zu zeichnen: sonst ginge ein Tippen auf
    // ↑, ↓ oder ✕ verloren, das gerade das Feld verlassen lässt.
    feld.addEventListener('change', () => {
      const t = feld.value.trim();
      if (!t) { feld.value = app.state.routinen[r][i]; return; } // leer wird nicht gespeichert
      if (t === app.state.routinen[r][i]) return;
      feld.value = t;
      app.leisteZu();
      app.state = mitRoutine(r, liste => { liste[i] = t; });
      app.sichere();
    });

    const verschiebe = (nach, fokusArt, andere) => () => {
      app.setze(mitRoutine(r, liste => { liste.splice(nach, 0, liste.splice(i, 1)[0]); }));
      fokusSetzen(fokusArt + ':' + r + ':' + nach, andere + ':' + r + ':' + nach);
    };
    const loesche = () => {
      const alt = app.state;
      app.setze(mitRoutine(r, liste => { liste.splice(i, 1); }));
      app.rueckgaengig('Schritt gelöscht', alt);
    };
    const knopf = (zeichen, name, fokus, tu, aus) => h('button', {
      class: 'ikon-knopf', type: 'button', 'aria-label': name + ': ' + text, 'data-fokus': fokus + ':' + r + ':' + i, disabled: aus, onclick: tu,
    }, zeichen);

    return h('li', { class: 'schritt-zeile' }, feld,
      knopf('↑', 'Nach oben', 'hoch', verschiebe(i - 1, 'hoch', 'runter'), i === 0),
      knopf('↓', 'Nach unten', 'runter', verschiebe(i + 1, 'runter', 'hoch'), i === anzahl - 1),
      knopf('✕', 'Löschen', 'weg', loesche, false));
  }

  function neuerSchritt(r) {
    const feld = h('input', {
      class: 'feld', type: 'text', autocomplete: 'off', placeholder: 'Neuer Schritt',
      'aria-label': 'Neuer Schritt', 'data-fokus': 'neu:' + r,
    });
    const hinzu = () => {
      const t = feld.value.trim();
      if (!t) { feld.focus(); return; } // leer wird nicht gespeichert
      app.setze(mitRoutine(r, liste => { liste.push(t); }));
      fokusSetzen('neu:' + r);
    };
    feld.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); hinzu(); } });
    return h('div', { class: 'schritt-neu' }, feld,
      h('button', { class: 'knopf', type: 'button', onclick: hinzu }, 'Schritt hinzufügen'));
  }

  function routine(r, name) {
    const liste = app.state.routinen[r];
    return h('section', { class: 'abschnitt karte sek-' + (r === 'abend' ? 'gewohnheiten' : 'muss') },
      h('h2', { class: 'abschnitt-titel abschnitt-titel-text' }, name),
      liste.length > 0
        ? h('ul', { class: 'schritte' }, liste.map((t, i) => schrittZeile(r, i, t, liste.length)))
        : h('p', { class: 'leer' }, 'Noch kein Schritt.'),
      neuerSchritt(r));
  }

  // Sicherung speichern: auf Android öffnet die Hülle den Speichern-Dialog, im Browser wird heruntergeladen.
  function speichern(meldung) {
    const text = AH.speicher.alsSicherung(app.state);
    if (AH.ablage.istAndroid()) {
      if (typeof root.Huelle.speichernUnter !== 'function') {
        meldung('Speichern geht in dieser Fassung nicht.');
        return;
      }
      try {
        root.Huelle.speichernUnter(DATEINAME, text);
      } catch (e) {
        meldung('Speichern hat nicht geklappt.');
      }
      return;
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = h('a', { href: url, download: DATEINAME });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    meldung('Sicherung heruntergeladen.');
  }

  function sicherung() {
    const meldungsFeld = h('p', { class: 'meldung', role: 'status' });
    const meldung = text => meldungsFeld.replaceChildren(text);
    const rueckfrage = h('div', { class: 'rueckfrage', hidden: true });
    const schliesse = () => { rueckfrage.hidden = true; rueckfrage.replaceChildren(); };

    // Gelesene Sicherung ist gültig: erst nach der Rückfrage ersetzt sie alles.
    const frage = neu => {
      const t = h('p', { class: 'frage', tabindex: '-1' }, 'Alles in der App wird durch die Sicherung ersetzt.');
      rueckfrage.replaceChildren(t, h('div', { class: 'formular-knoepfe' },
        h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: () => {
          const alt = app.state;
          app.setze(neu);
          app.rueckgaengig('Sicherung eingespielt.', alt);
        } }, 'Einspielen'),
        h('button', { class: 'knopf', type: 'button', onclick: schliesse }, 'Abbrechen')));
      rueckfrage.hidden = false;
      t.focus({ preventScroll: true });
    };

    const datei = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, 'aria-hidden': 'true', tabindex: '-1' });
    datei.addEventListener('change', () => {
      const f = datei.files && datei.files[0];
      schliesse();
      meldung('');
      if (!f) return;
      const leser = new FileReader();
      leser.onload = () => {
        const neu = AH.speicher.ausSicherung(String(leser.result), app.heute());
        if (neu) frage(neu);
        else meldung(KEINE_SICHERUNG);
      };
      leser.onerror = () => meldung(KEINE_SICHERUNG);
      leser.readAsText(f);
      datei.value = ''; // dieselbe Datei lässt sich danach noch einmal wählen
    });

    return h('section', { class: 'abschnitt karte sek-ziele' },
      h('h2', { class: 'abschnitt-titel abschnitt-titel-text' }, 'Sicherung'),
      h('div', { class: 'formular-knoepfe sicherung-knoepfe' },
        h('button', { class: 'knopf', type: 'button', onclick: () => speichern(meldung) }, 'Sicherung speichern'),
        h('button', { class: 'knopf', type: 'button', onclick: () => datei.click() }, 'Sicherung einspielen'),
        datei),
      meldungsFeld,
      rueckfrage);
  }

  function zeichne() {
    return h('div', { class: 'seite' },
      h('header', { class: 'kopf' },
        h('h1', { class: 'datum' }, 'Einstellungen'),
        h('button', { class: 'klein', type: 'button', onclick: () => app.zeige('start') }, 'Zurück')),
      ROUTINEN.map(([r, name]) => routine(r, name)),
      sicherung(),
      AH.ablage.istAndroid()
        ? h('p', { class: 'hinweis-text' }, XIAOMI)
        : h('a', { class: 'link', href: 'alltagshelfer.apk' }, 'Android-App herunterladen'));
  }

  app.bildschirme.einstellungen = { zeichne };
})(typeof globalThis !== 'undefined' ? globalThis : this);
