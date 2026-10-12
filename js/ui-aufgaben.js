// Aufgabenliste und das Formular für eine Aufgabe.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  const GROESSEN = [
    { id: 'winzig', name: 'Winzig' },
    { id: 'normal', name: 'Normal' },
    { id: 'gross', name: 'Groß' },
  ];

  function abstand(a) {
    if (a.einmal) return 'einmalig';
    if (a.zeiten && a.zeiten.length > 1) return 'morgens und abends';
    if (a.zeiten) return a.zeiten[0] === 'morgens' ? 'jeden Morgen' : 'jeden Abend';
    const r = a.rhythmus || 1;
    return r === 1 ? 'täglich' : 'alle ' + r + ' Tage';
  }

  function zeile(a) {
    return h('button', { class: 'zeile b-' + app.bereich(a.bereich).farbe, onclick: () => app.zeige('aufgabe', { id: a.id }) },
      h('span', { class: 'zeile-titel' }, a.titel),
      h('span', { class: 'zeile-zusatz' }, abstand(a) + ' · winzig: ' + a.groessen.winzig.text));
  }

  function gruppe(titel, liste, zusatz) {
    if (!liste.length) return null;
    return h('section', { class: 'gruppe' },
      h('h2', { class: 'gruppe-titel' }, titel),
      zusatz ? h('p', { class: 'leise' }, zusatz) : null,
      liste.map(zeile));
  }

  app.bildschirme.aufgaben = {
    zeichne(el) {
      const alle = app.state.aufgaben;
      const teile = [
        h('h1', { class: 'titel' }, 'Deine Aufgaben'),
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: () => app.zeige('reinwerfen') }, 'Reinwerfen'),
          h('button', { class: 'knopf', onclick: () => app.zeige('aufgabe', { id: null }) }, 'Neue Aufgabe')),
        gruppe('Muss', alle.filter(a => a.art === 'muss'), 'Bleibt hier stehen, bis es erledigt ist.'),
        gruppe('Will', alle.filter(a => a.art === 'will' && !a.irgendwann)),
      ];
      for (const b of AH.pakete.BEREICHE) teile.push(gruppe(b.name, alle.filter(a => a.bereich === b.id && !a.art)));
      teile.push(gruppe('Vielleicht irgendwann', alle.filter(a => a.irgendwann), 'Liegt hier in Ruhe. Antippen holt es zurück oder löscht es.'));
      el.append(...teile.filter(Boolean));
    },
  };

  // Kommende Tage einer Aufgabe mit Varianten: je Tag eine Fassung oder frei.
  app.bildschirme.plan = {
    zeichne(el, daten) {
      const aufgabe = daten && app.state.aufgaben.find(a => a.id === daten.id);
      if (!aufgabe || !aufgabe.varianten) return app.zeige('aufgaben');
      const plan = app.state.plan || {};
      const wahl = aufgabe.varianten.liste.map(v => ({ id: v.id, name: v.name })).concat({ id: 'frei', name: 'frei' });
      const datum = tag => new Date(tag + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });
      el.append(
        h('h1', { class: 'titel' }, 'Tage im Voraus'),
        h('p', { class: 'leise' }, 'Trag ein, was du schon weißt. Bei leeren Tagen fragt die App am Abend vorher.'),
        h('div', { class: 'plan' }, AH.aufgaben.planTage(aufgabe, app.heute(), 14).map(tag =>
          h('div', { class: 'plan-zeile', role: 'group', 'aria-label': datum(tag) },
            h('span', { class: 'plan-tag' }, datum(tag)),
            wahl.map(w => h('button', { class: 'plan-knopf', 'aria-pressed': String(plan[tag] === w.id),
              // noch einmal antippen nimmt die Wahl zurück
              onclick: () => app.setze(AH.aufgaben.setzePlan(app.state, tag, plan[tag] === w.id ? null : w.id)) }, w.name))))),
        h('div', { class: 'reihe' }, h('button', { class: 'knopf knopf-haupt', onclick: () => app.zeige('jetzt') }, 'Fertig')));
    },
  };

  function feld(id, beschriftung, attrs) {
    const eingabe = h('input', Object.assign({ class: 'feld', id, type: 'text' }, attrs));
    return { eingabe, zeile: h('div', { class: 'feldzeile' }, h('label', { for: id }, beschriftung), eingabe) };
  }

  app.bildschirme.aufgabe = {
    zeichne(el, daten) {
      const aufgabe = daten && daten.id ? app.state.aufgaben.find(a => a.id === daten.id) : null;
      if (daten && daten.id && !aufgabe) return app.zeige('aufgaben');
      const zurLste = s => { app.aktuell = 'aufgaben'; app.daten = null; app.setze(s); };

      const titel = feld('f-titel', 'Name', { maxlength: '80', value: aufgabe ? aufgabe.titel : '', placeholder: 'Blumen gießen' });
      const bereich = h('select', { class: 'feld', id: 'f-bereich' },
        AH.pakete.BEREICHE.map(b => h('option', { value: b.id, selected: aufgabe ? aufgabe.bereich === b.id : false }, b.name)));
      const fertig = feld('f-fertig', 'Fertig heißt …', { maxlength: '120', value: aufgabe ? aufgabe.fertig : '', placeholder: 'Alle Pflanzen haben Wasser.' });
      const rhythmus = h('input', { class: 'feld feld-min', id: 'f-rhythmus', type: 'number', min: '1', max: '90', inputmode: 'numeric', value: aufgabe ? (aufgabe.rhythmus || 1) : 1 });
      const fehler = h('p', { class: 'fehler', role: 'alert', hidden: true }, 'Gib der Aufgabe einen Namen.');
      const mitRunden = aufgabe && aufgabe.zeiten;
      const einmalig = aufgabe && aufgabe.einmal;

      const groessen = {};
      const groessenZeilen = GROESSEN.map(g => {
        const vorhanden = aufgabe ? aufgabe.groessen[g.id] : null;
        const text = h('input', { class: 'feld', id: 'f-' + g.id, type: 'text', maxlength: '80', value: vorhanden ? vorhanden.text : '' });
        const min = h('input', { class: 'feld feld-min', id: 'f-' + g.id + '-min', type: 'number', min: '1', max: '180', inputmode: 'numeric',
          value: vorhanden ? vorhanden.min : '', 'aria-label': g.name + ': Minuten' });
        groessen[g.id] = { text, min };
        return h('div', { class: 'feldzeile' },
          h('label', { for: 'f-' + g.id }, g.name),
          h('div', { class: 'reihe reihe-min' }, text, min, h('span', { class: 'leise' }, 'Min')));
      });

      const speichern = () => {
        const name = titel.eingabe.value.trim();
        if (!name) {
          fehler.hidden = false;
          return titel.eingabe.focus();
        }
        const eingabe = {};
        for (const g of GROESSEN) eingabe[g.id] = { text: groessen[g.id].text.value, min: groessen[g.id].min.value };
        const basis = aufgabe ? aufgabe.groessen : AH.aufgaben.vorschlag(name.slice(0, 80));
        const felder = { titel: name, bereich: bereich.value, groessen: AH.aufgaben.groessenAus(eingabe, basis), fertig: fertig.eingabe.value, rhythmus: rhythmus.value };
        if (aufgabe) return zurLste(AH.aufgaben.aendere(app.state, aufgabe.id, felder));
        const nr = app.state.naechsteNr;
        zurLste(AH.aufgaben.aendere(AH.aufgaben.neu(app.state, felder), 'a' + nr, { fertig: felder.fertig }));
      };

      titel.eingabe.addEventListener('input', () => { fehler.hidden = true; });

      el.append(...[
        h('h1', { class: 'titel' }, aufgabe ? 'Aufgabe ändern' : 'Neue Aufgabe'),
        aufgabe && aufgabe.irgendwann ? h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: () => zurLste(AH.aufgaben.zurueckholen(app.state, aufgabe.id, app.heute())) }, 'Zurückholen')) : null,
        aufgabe && !aufgabe.irgendwann ? h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: () => app.bildschirme.jetzt.starte(aufgabe) }, 'Jetzt machen'),
          aufgabe.varianten ? h('button', { class: 'knopf', onclick: () => app.zeige('plan', { id: aufgabe.id }) }, 'Tage eintragen') : null) : null,
        titel.zeile,
        fehler,
        h('div', { class: 'feldzeile' }, h('label', { for: 'f-bereich' }, 'Bereich'), bereich),
        mitRunden || einmalig ? null : h('div', { class: 'feldzeile' },
          h('label', { for: 'f-rhythmus' }, 'Wie oft?'),
          h('div', { class: 'reihe reihe-min' }, h('span', { class: 'leise' }, 'alle'), rhythmus, h('span', { class: 'leise' }, 'Tage (1 heißt täglich)'))),
        h('details', { class: 'aufklappen', open: !!aufgabe },
          h('summary', {}, 'Größen anpassen'),
          h('p', { class: 'leise' }, aufgabe ? 'Jede Größe zählt als erledigt.' : 'Leere Felder füllt die App aus dem Namen. Jede Größe zählt als erledigt.'),
          groessenZeilen,
          fertig.zeile),
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: speichern }, 'Speichern'),
          h('button', { class: 'knopf knopf-still', onclick: () => app.zeige('aufgaben') }, 'Abbrechen')),
        aufgabe ? h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-still', onclick: () => app.frage('Diese Aufgabe löschen?', [
            { text: 'Löschen', haupt: true, tu: () => zurLste(AH.aufgaben.loesche(app.state, aufgabe.id)) },
            { text: 'Behalten' },
          ], aufgabe.titel) }, 'Aufgabe löschen')) : null,
      ].filter(Boolean));
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
