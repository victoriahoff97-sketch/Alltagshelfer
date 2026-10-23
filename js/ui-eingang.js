// Eingang sortieren: ein Eintrag nach dem anderen, als Muss (mit Frist), Wochenziel,
// Gewohnheit (mit Häufigkeit) oder weg. Der Text lässt sich vorher ändern.
// Nur Anzeige und Antippen; gerechnet wird in AH.eingang.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  function zeichne() {
    const s = app.state;
    const eintrag = s.eingang[0];

    const kopf = h('header', { class: 'kopf' },
      h('h1', { class: 'datum' }, 'Eingang sortieren'),
      h('button', { class: 'klein', type: 'button', onclick: () => app.zeige('start') }, 'Zurück'));

    if (!eintrag) {
      return h('div', { class: 'seite' }, kopf, h('p', { class: 'leer' }, 'Der Eingang ist leer.'));
    }

    const heute = app.heute();
    const text = app.bauteile.textFeld('Text', eintrag.text);
    const aktion = h('div', { class: 'aktion' });

    // Fertig sortiert: der nächste Eintrag kommt, oder es geht zurück zur Startseite.
    const fertig = (neu, meldung) => {
      const vorher = app.state;
      app.setze(neu);
      if (neu.eingang.length === 0) app.zeige('start');
      else {
        const ueberschrift = document.querySelector('#app h1');
        if (ueberschrift) { ueberschrift.tabIndex = -1; ueberschrift.focus({ preventScroll: true }); }
      }
      if (meldung) app.rueckgaengig(meldung, vorher);
    };

    // Die zweite Frage unter dem Textfeld; „Anders wählen“ führt zu den vier Knöpfen zurück.
    const frage = (titel, auswahl) => {
      const t = h('p', { class: 'frage', tabindex: '-1' }, titel);
      aktion.replaceChildren(t, auswahl,
        h('button', { class: 'klein', type: 'button', onclick: erste }, 'Anders wählen'));
      t.focus({ preventScroll: true });
    };

    const muss = () => {
      if (!text.pruefe()) return;
      frage('Bis wann?', app.bauteile.fristAuswahl(null, wahl => {
        const t = text.pruefe();
        if (!t) return;
        fertig(AH.eingang.sortiere(app.state, eintrag.id, { art: 'muss', frist: wahl, text: t }, heute));
      }));
    };
    const ziel = () => {
      const t = text.pruefe();
      if (t) fertig(AH.eingang.sortiere(app.state, eintrag.id, { art: 'ziel', text: t }, heute));
    };
    const gewohnheit = () => {
      if (!text.pruefe()) return;
      frage('Wie oft pro Woche?', app.bauteile.zahlAuswahl(null, n => {
        const t = text.pruefe();
        if (!t) return;
        fertig(AH.eingang.sortiere(app.state, eintrag.id, { art: 'gewohnheit', ziel: n, text: t }, heute));
      }));
    };
    const weg = () => fertig(AH.eingang.sortiere(app.state, eintrag.id, { art: 'weg' }, heute), 'Weg');

    function erste() {
      aktion.replaceChildren(h('div', { class: 'vier' },
        h('button', { class: 'knopf knopf-gross sek-muss', type: 'button', onclick: muss }, 'Muss'),
        h('button', { class: 'knopf knopf-gross sek-ziele', type: 'button', onclick: ziel }, 'Diese Woche'),
        h('button', { class: 'knopf knopf-gross sek-gewohnheiten', type: 'button', onclick: gewohnheit }, 'Gewohnheit'),
        h('button', { class: 'knopf knopf-gross', type: 'button', onclick: weg }, 'Weg')));
    }
    erste();

    return h('div', { class: 'seite' }, kopf,
      h('p', { class: 'leer' }, '1 von ' + s.eingang.length),
      h('div', { class: 'formular karte' },
        h('label', { class: 'etikett' }, 'Was ist das?', text),
        aktion));
  }

  app.bildschirme.eingang = { zeichne };
})(typeof globalThis !== 'undefined' ? globalThis : this);
