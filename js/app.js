// Hält den Zustand, speichert ihn und schaltet zwischen den Bildschirmen.
(function (root) {
  const AH = root.AH;

  // h('button', { class: 'knopf', onclick: fn }, 'Text', kind, …)
  function h(tag, attrs, ...kinder) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kind of kinder.flat()) {
      if (kind === null || kind === undefined || kind === false) continue;
      el.append(kind.nodeType ? kind : document.createTextNode(String(kind)));
    }
    return el;
  }

  function speicherOrt() {
    try { return root.localStorage; } catch (e) { return { getItem() { throw e; }, setItem() { throw e; } }; }
  }

  const LEISTE = [
    { name: 'jetzt', text: 'Jetzt' },
    { name: 'zimmer', text: 'Zimmer' },
    { name: 'aufgaben', text: 'Aufgaben', auch: 'aufgabe' },
    { name: 'sicherung', text: 'Sicherung' },
  ];

  const app = {
    h,
    state: null,
    hinweis: null,
    bildschirme: {},
    aktuell: 'jetzt',
    daten: null,
    laeuft: null, // { aufgabeId, groesse, slot, start, haken }

    // Der Tag beginnt um 4 Uhr früh; stunde() läuft entsprechend von 4 bis 27.
    heute() {
      return AH.zeit.tagUndStunde(new Date()).tag;
    },

    stunde() {
      return AH.zeit.tagUndStunde(new Date()).stunde;
    },

    bereich(id) {
      return AH.pakete.BEREICHE.find(b => b.id === id) || AH.pakete.BEREICHE[0];
    },

    sichere() {
      if (!AH.speicher.speichere(speicherOrt(), app.state) && !app.hinweis) app.hinweis = 'kein-speicher';
      AH.drive.geaendert();
    },

    setze(neu) {
      app.state = neu;
      app.sichere();
      app.zeichne();
    },

    zeige(name, daten) {
      app.aktuell = name;
      app.daten = daten || null;
      app.zeichne();
    },

    // true, wenn ein neuer Tag begonnen hat
    tagPruefen() {
      const s = AH.aufgaben.aufraeumen(AH.tagesform.neuerTag(app.state, app.heute()), app.heute());
      if (s === app.state) return false;
      app.state = s;
      app.sichere();
      return true;
    },

    zeichne() {
      app.tagPruefen();
      const el = document.getElementById('app');
      const leiste = document.getElementById('leiste');
      const bildschirm = app.bildschirme[app.aktuell] || app.bildschirme.jetzt;
      const gewechselt = app.zuletztGezeichnet !== bildschirm;
      const fokus = document.activeElement;
      const fokusText = fokus && (el.contains(fokus) || leiste.contains(fokus)) ? fokus.textContent : null;
      if (gewechselt && app.zuletztGezeichnet && app.zuletztGezeichnet.verlasse) app.zuletztGezeichnet.verlasse();
      app.zuletztGezeichnet = bildschirm;
      el.replaceChildren();
      bildschirm.zeichne(el, app.daten);

      const ruhig = ['timer', 'geschafft', 'willkommen', 'reinwerfen'].includes(app.aktuell);
      leiste.hidden = ruhig;
      leiste.replaceChildren(...LEISTE.map(e => h('button', {
        class: 'leiste-knopf', 'aria-current': e.name === app.aktuell || e.auch === app.aktuell ? 'page' : null,
        onclick: () => app.zeige(e.name),
      }, e.text)));

      // Neu gezeichnete Knöpfe sollen den Fokus nicht verlieren.
      if (!el.contains(document.activeElement)) {
        const ueberschrift = el.querySelector('h1');
        const gleicher = fokusText && [...el.querySelectorAll('button'), ...leiste.querySelectorAll('button')]
          .find(b => b.textContent === fokusText && !b.disabled);
        if (gewechselt && ueberschrift) {
          ueberschrift.tabIndex = -1;
          ueberschrift.focus({ preventScroll: true });
          root.scrollTo(0, 0);
        } else if (gleicher) {
          gleicher.focus({ preventScroll: true });
        } else if (fokusText && ueberschrift) {
          // der getippte Knopf ist verschwunden (etwa „Kleiner“ bei winzig)
          ueberschrift.tabIndex = -1;
          ueberschrift.focus({ preventScroll: true });
        }
      }
      app.gezeichnetUm = Date.now();
    },

    // Rückfrage über dem Bildschirm; wege: [{ text, haupt, tu }]
    frage(text, wege, zusatz) {
      const vorher = document.activeElement;
      const hinten = [document.getElementById('app'), document.getElementById('leiste')];
      const schliesse = () => {
        schleier.remove();
        hinten.forEach(x => { x.inert = false; });
        if (vorher && vorher.isConnected) vorher.focus({ preventScroll: true });
      };
      const schleier = h('div', { class: 'schleier', role: 'dialog', 'aria-modal': 'true', 'aria-label': text,
        onkeydown: e => {
          const knoepfe = [...schleier.querySelectorAll('button')];
          if (e.key === 'Escape') {
            schliesse();
          } else if (e.key === 'Tab') {
            const i = knoepfe.indexOf(document.activeElement);
            e.preventDefault();
            knoepfe[(i + (e.shiftKey ? -1 : 1) + knoepfe.length) % knoepfe.length].focus();
          }
        } },
        h('div', { class: 'frage' },
          h('p', { class: 'frage-text' }, text),
          zusatz ? h('p', { class: 'leise frage-zusatz' }, zusatz) : null,
          wege.map(w => h('button', {
            class: 'knopf' + (w.haupt ? ' knopf-haupt' : ''),
            onclick: () => { schliesse(); if (w.tu) w.tu(); },
          }, w.text))));
      hinten.forEach(x => { x.inert = true; });
      document.querySelector('.rahmen').append(schleier);
      schleier.querySelector('button').focus();
    },

    start() {
      const r = AH.speicher.lade(speicherOrt(), app.heute());
      // einmalige Umstellung auf die eigenen Aufgaben
      app.state = AH.aufgaben.nachtragen(AH.aufgaben.meineEinsetzen(r.state, app.heute()));
      app.hinweis = r.hinweis;
      if (app.state !== r.state) app.sichere();
      if (!app.state.willkommen) app.aktuell = 'willkommen';
      // Während eine Zeit läuft, geht kein Anmeldefenster auf.
      AH.drive.start({ text: () => AH.speicher.alsText(app.state), ruhig: () => app.aktuell === 'timer' });
      // Zurück in der App: nur neu zeichnen, wenn ein neuer Tag begonnen hat, sonst ginge Getipptes verloren.
      // Der Jetzt-Bildschirm hat nichts Getipptes und wird immer aufgefrischt, damit Füttern und
      // Abendrunde erscheinen, sobald ihre Tageszeit beginnt.
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && (app.tagPruefen() || app.aktuell === 'jetzt')) app.zeichne();
      });
      let stundeZuletzt = app.stunde();
      setInterval(() => {
        const stunde = app.stunde();
        if (stunde === stundeZuletzt) return;
        stundeZuletzt = stunde;
        if (app.aktuell === 'jetzt' && !document.querySelector('.schleier')) app.zeichne();
      }, 60000);
      // Vor jedem Tippen: erst der Tageswechsel, dann die Aktion. Ein zweites Tippen direkt nach dem
      // Neuzeichnen landet auf einem anderen Knopf als gemeint und wird verschluckt.
      document.addEventListener('click', e => {
        if (e.isTrusted && Date.now() - (app.gezeichnetUm || 0) < 250) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        app.tagPruefen();
        AH.drive.beimTipp();
      }, true);
      app.zeichne();
    },
  };
  AH.app = app;
})(typeof globalThis !== 'undefined' ? globalThis : this);
