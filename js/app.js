// Hält den Zustand, speichert ihn (samt Widget-Datei) und schaltet zwischen den Bildschirmen.
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

  // Kleines Symbol aus festem SVG-Text (nie mit Nutzertext füttern).
  function ikon(svg) {
    const vorlage = document.createElement('template');
    vorlage.innerHTML = svg;
    return vorlage.content.firstElementChild;
  }

  const FESTE_ZEIT = AH.ablage.festeZeit(root.location ? root.location.search : '');
  const RUHE_MS = 400; // Klick-Ruhe nach einer Änderung (gegen Doppeltippen)

  const app = {
    h,
    ikon,
    state: null,
    aktuell: 'start',
    daten: null,
    bildschirme: {},
    leisteTimer: null,
    zuletzt: null,
    gesperrt: false, // true: Speichern könnte gute Daten zerstören, der Zustand bleibt nur im Programm
    angewandt: 0, // so viele Aktionen vom Anfang der Schlange stecken schon in state, sind aber nicht bestätigt
    marke: '', // zeitMarke() beim letzten Zeichnen nach Laden
    ruheBis: 0, // bis dahin (Date.now()) zählen Klicks in #app nicht, siehe setze

    // Die Uhr; mit ?zeit=2026-10-22T20:30 in der URL steht sie fest (zum Prüfen in der Vorschau).
    jetzt() {
      return FESTE_ZEIT ? new Date(FESTE_ZEIT.getTime()) : new Date();
    },

    // Der Tag beginnt um 4 Uhr früh.
    heute() {
      return AH.zeit.tagUndStunde(app.jetzt()).tag;
    },

    // Zustand und Widget-Datei ablegen. true, wenn beides geklappt hat.
    sichere() {
      const ort = AH.ablage.ort();
      let ok = !app.gesperrt && AH.speicher.speichere(ort, app.state);
      // Die angewandten Widget-Aktionen sind jetzt mit gespeichert und dürfen aus der Schlange
      // (auch wenn danach die Widget-Datei scheitert; sonst würden sie später ein zweites Mal angewandt).
      if (ok && app.angewandt > 0) {
        AH.ablage.aktionenLeeren(app.angewandt);
        app.angewandt = 0;
      }
      if (ok) {
        try {
          ort.setItem(AH.speicher.WIDGET_SCHLUESSEL, JSON.stringify(AH.widgetdaten.baue(app.state, app.jetzt())));
        } catch (e) {
          ok = false;
        }
      }
      const hinweis = document.getElementById('hinweis');
      if (hinweis) hinweis.hidden = ok;
      return ok;
    },

    // Jede Änderung schließt ein offenes „Rückgängig“: es würde sonst auch diese Änderung zurücknehmen.
    // Wer danach selbst „Rückgängig“ anbietet, tut das nach dem setze.
    // Danach kurz Klick-Ruhe: Ein schneller zweiter Tipp träfe sonst den neu gezeichneten Knopf an derselben
    // Stelle (die nächste Muss-Zeile, „Weg“ beim nächsten Eingang) und schlösse das „Rückgängig“ des ersten.
    setze(neu) {
      app.leisteZu();
      app.state = neu;
      app.sichere();
      app.zeichne();
      app.ruheBis = Date.now() + RUHE_MS;
    },

    // In der Einfangphase an #app: schluckt Klicks während der Klick-Ruhe. Nur „click“; die Kacheln der
    // Gewohnheiten zählen per pointerup und bleiben für schnelle Tipps offen.
    klickRuhe(e) {
      if (Date.now() < app.ruheBis) {
        e.stopPropagation();
        e.preventDefault();
      }
    },

    // Zustand aus dem Speicher holen und die Aktionen der Widgets anwenden.
    // Ist der Speicher unlesbar oder nicht sicher beschreibbar, bleibt der Zustand nur im Programm
    // (gesperrt) und überschreibt nichts; beim nächsten Laden wird neu versucht.
    // Die Aktionen verlassen die Schlange erst, wenn der Zustand mit ihnen gespeichert ist.
    lade(erstes) {
      const r = AH.speicher.ladeGesichert(AH.ablage.ort());
      app.gesperrt = !r.speichern;
      const ausProgramm = !r.state && !erstes && app.state;
      const s = r.state || ausProgramm || AH.speicher.leer();
      const aktionen = AH.ablage.aktionenLesen();
      // Der Zustand aus dem Programm enthält die zuletzt gelesenen, unbestätigten Aktionen schon.
      const neu = AH.widgetdaten.wendeAktionenAn(s, aktionen.slice(ausProgramm ? app.angewandt : 0));
      // Haben die Widgets etwas geändert, passt ein offenes „Rückgängig“ nicht mehr. Sonst bleibt die Leiste
      // stehen (etwa „Im Eingang“, wenn die Android-Hülle nach der Spracheingabe auffrischen ruft).
      if (!erstes && JSON.stringify(neu) !== JSON.stringify(app.state)) app.leisteZu();
      app.state = neu;
      app.angewandt = aktionen.length;
      app.sichere();
    },

    // Unbekannte Namen führen zur Startseite.
    zeige(name, daten) {
      app.aktuell = app.bildschirme[name] ? name : 'start';
      app.daten = daten || null;
      app.zeichne();
    },

    // Zurück-Taste von Android (die Hülle ruft das auf): zur Startseite, aus der Bearbeitung eines Eintrags
    // erst zur Liste (wie der Knopf „Zurück“ dort), außer das Formular kam vom ＋ der Startseite
    // (daten.zurueck = 'start'). false: nichts zu tun (Startseite oder Schwerer Tag),
    // dann schließt die Hülle die App wie bisher.
    zurueck() {
      const name = app.welcher();
      if (name === 'start' || name === 'schwer') return false;
      if (name === 'alle' && app.daten && app.daten.zurueck !== 'start') app.zeige('alle');
      else app.zeige('start');
      return true;
    },

    // Alte Einträge (v1) gab es nur im Browser. Den alten Text, wenn die Startseite die Übernahme anbieten
    // soll, sonst null. Der alte Schlüssel wird nur gelesen, nie geändert.
    altes() {
      if (AH.ablage.istAndroid()) return null;
      try {
        const ort = AH.ablage.ort();
        const roh = ort.getItem(AH.speicher.ALT_SCHLUESSEL);
        return AH.speicher.altesAnbieten(app.state, roh, ort.getItem(AH.speicher.ALT_GEFRAGT_SCHLUESSEL) !== null) ? roh : null;
      } catch (e) {
        return null;
      }
    },

    // „Übernehmen“ oder „Nein danke“: die Frage kommt nicht wieder.
    altesGefragt() {
      try {
        AH.ablage.ort().setItem(AH.speicher.ALT_GEFRAGT_SCHLUESSEL, '1');
      } catch (e) { /* dann fragt die Startseite beim nächsten Mal noch einmal */ }
    },

    // Ist der Schwerer-Tag-Modus an, gibt es nur diesen Bildschirm.
    welcher() {
      if (app.bildschirme.schwer && AH.schwer.istAn(app.state, app.jetzt())) return 'schwer';
      return app.bildschirme[app.aktuell] ? app.aktuell : 'start';
    },

    zeichne() {
      const wurzel = document.getElementById('app');
      const name = app.welcher();
      const bildschirm = app.bildschirme[name];
      const gewechselt = app.zuletzt !== name;
      const fokus = document.activeElement;
      const fokusSchluessel = fokus && wurzel.contains(fokus) ? fokus.getAttribute('data-fokus') : null;
      app.zuletzt = name;
      wurzel.replaceChildren(bildschirm.zeichne(app.daten));

      // Neu gezeichnete Knöpfe sollen den Fokus nicht verlieren.
      if (gewechselt) {
        const ueberschrift = wurzel.querySelector('h1');
        if (ueberschrift) {
          ueberschrift.tabIndex = -1;
          ueberschrift.focus({ preventScroll: true });
        }
        root.scrollTo(0, 0);
      } else if (fokusSchluessel) {
        const gleicher = [...wurzel.querySelectorAll('[data-fokus]')].find(x => x.getAttribute('data-fokus') === fokusSchluessel);
        if (gleicher) gleicher.focus({ preventScroll: true });
      }
    },

    // Kurze Leiste unten; mit knopf = { text, tu } auch mit Knopf.
    leiste(text, knopf, ms) {
      const el = document.getElementById('leiste');
      clearTimeout(app.leisteTimer);
      el.replaceChildren(h('span', { class: 'leiste-text' }, text));
      if (knopf) el.append(h('button', { class: 'leiste-knopf', type: 'button', onclick: () => { app.leisteZu(); knopf.tu(); } }, knopf.text));
      el.hidden = false;
      app.leisteTimer = setTimeout(app.leisteZu, ms);
    },

    leisteZu() {
      const el = document.getElementById('leiste');
      clearTimeout(app.leisteTimer);
      el.hidden = true;
      el.replaceChildren();
    },

    // Kurze Bestätigung, etwa „Im Eingang“.
    melde(text) {
      app.leiste(text, null, 2500);
    },

    // Nach einer Änderung fünf Sekunden lang „Rückgängig“ anbieten; alterState ist der Zustand davor.
    rueckgaengig(text, alterState) {
      app.leiste(text, { text: 'Rückgängig', tu: () => app.setze(alterState) }, 5000);
    },

    start() {
      app.lade(true);
      // Das Widget „Schwerer Tag“ öffnet die App mit #schwer.
      if (root.location.hash === '#schwer') {
        app.schwerEin();
        try { root.history.replaceState(null, '', root.location.pathname + root.location.search); } catch (e) { /* bleibt stehen */ }
      }
      app.marke = app.zeitMarke();
      document.getElementById('app').addEventListener('click', app.klickRuhe, true);
      // Zurück in der App: Widgets können den Zustand geändert haben.
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) app.auffrischen();
      });
      // Läuft die App über den Tageswechsel oder über 20:15 hinweg, frisch zeichnen.
      setInterval(() => {
        if (app.zeitMarke() !== app.marke) app.auffrischen();
      }, 60000);
      app.zeichne();
    },

    // Schwerer-Tag-Modus einschalten und als Bildschirm wählen; zeichnen tut der Aufrufer.
    // Wie bei setze: ein offenes „Rückgängig“ schließt (es würde sonst den Modus wieder ausschalten).
    schwerEin() {
      app.leisteZu();
      app.state = AH.schwer.ein(app.state, app.jetzt());
      app.sichere();
      app.aktuell = 'schwer';
    },

    // Aus der Android-Hülle: Das Widget „Schwerer Tag“ hat die schon laufende App geöffnet
    // (dort gibt es keinen neuen Start mit #schwer). Erst neu laden, die Widgets können etwas geändert haben.
    schwerOeffnen() {
      app.lade(false);
      app.schwerEin();
      app.marke = app.zeitMarke();
      app.zeichne();
    },

    // Tag und Abend: wechselt eins davon, sieht die App anders aus.
    zeitMarke() {
      return AH.zeit.tagUndStunde(app.jetzt()).tag + '|' + AH.zeit.istAbend(app.jetzt());
    },

    // Neu laden und nur dann neu zeichnen, wenn sich der Zustand oder die Zeit-Marke geändert hat.
    // Sonst ginge etwa die Sicherung ins Leere, die man gerade in der Dateiauswahl des Systems gewählt hat
    // (die Auswahl verdeckt die App, beim Zurückkommen käme ein neues Formular).
    auffrischen() {
      const vorher = JSON.stringify(app.state) + '|' + app.marke;
      app.lade(false);
      app.marke = app.zeitMarke();
      if (JSON.stringify(app.state) + '|' + app.marke !== vorher) app.zeichne();
    },
  };
  AH.app = app;
})(typeof globalThis !== 'undefined' ? globalThis : this);
