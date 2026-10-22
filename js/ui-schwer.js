// Schwerer-Tag-Bildschirm: immer nur ein Schritt, keine Auswahl.
// Nur Anzeige und Antippen; gerechnet wird in AH.schwer.
// Den Wechsel um 20:15 fängt der Minutentakt der App-Hülle ab (js/app.js), hier gibt es keinen eigenen.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  const GESCHAFFT_MS = 2000;
  let geschafft = false; // true, solange „Geschafft“ zu sehen ist; währenddessen gibt es keine Knöpfe
  const SPERRE_MS = 500;  // nach einem neuen Schritt zählt ein Tippen so lange nicht (Doppeltippen)
  let gezeigt = null;     // Kennung des zuletzt gezeigten Schritts
  let sperreBis = 0;

  // Zwei Sekunden „Geschafft“, danach normal neu zeichnen (dann steht dort „Für heute reicht's“).
  function zeigeGeschafft() {
    geschafft = true;
    setTimeout(() => {
      geschafft = false;
      app.zeichne();
    }, GESCHAFFT_MS);
  }

  function gehtWieder() {
    // erst die Startseite wählen, sonst zeichnet setze noch einmal den Schwerer-Tag-Bildschirm
    app.aktuell = 'start';
    app.setze(AH.schwer.aus(app.state));
  }

  function link() {
    return h('button', { class: 'schwer-link', type: 'button', 'data-fokus': 'wieder', onclick: gehtWieder }, 'Geht wieder');
  }

  const kennung = a => a.routine + '|' + a.nummer + '|' + a.text;

  // Ein Tippen gilt nur für den Schritt, der beim Zeichnen des Knopfs galt, und nicht in den
  // ersten 500 ms nach einem neuen Schritt: sonst überspringt ein Doppeltippen einen Schritt.
  function gilt(a) {
    if (Date.now() < sperreBis) return false;
    const jetzt = AH.schwer.ansicht(app.state, app.jetzt());
    return Boolean(jetzt) && jetzt.art === 'schritt' && kennung(jetzt) === kennung(a);
  }

  function schritt(a) {
    if (gezeigt !== kennung(a)) {
      gezeigt = kennung(a);
      sperreBis = Date.now() + SPERRE_MS;
    }
    const erledigt = () => {
      if (!gilt(a)) return;
      const r = AH.schwer.erledigt(app.state, app.jetzt());
      if (r.fertig) zeigeGeschafft();
      app.setze(r.state);
    };
    const gehtNicht = () => {
      if (!gilt(a)) return;
      const r = AH.schwer.gehtNicht(app.state, app.jetzt());
      if (r.fertig) zeigeGeschafft();
      app.setze(r.state);
    };
    return h('div', { class: 'schwer' },
      h('h1', { class: 'schwer-name' }, a.name),
      h('div', { class: 'schwer-mitte' },
        h('p', { class: 'schwer-text' }, a.text),
        h('button', { class: 'schwer-erledigt', type: 'button', 'data-fokus': 'erledigt', onclick: erledigt }, 'Erledigt'),
        h('p', { class: 'schwer-zaehler' }, 'Schritt ' + a.nummer + ' von ' + a.von),
        h('button', { class: 'schwer-leise', type: 'button', 'data-fokus': 'geht-nicht', onclick: gehtNicht }, 'Geht gerade nicht')),
      h('footer', { class: 'schwer-fuss' }, link()));
  }

  function zeichne() {
    // starte legt den Lauf der gerade gültigen Routine an; ohne ihn gibt ansicht nichts zurück
    const gestartet = AH.schwer.starte(app.state, app.jetzt());
    if (gestartet !== app.state) {
      app.state = gestartet;
      app.sichere();
    }

    if (geschafft) {
      return h('div', { class: 'schwer' },
        h('div', { class: 'schwer-mitte' },
          h('h1', { class: 'schwer-gross', tabindex: '-1' }, 'Geschafft')));
    }

    const a = AH.schwer.ansicht(app.state, app.jetzt());
    if (a && a.art === 'schritt') return schritt(a);

    return h('div', { class: 'schwer' },
      h('div', { class: 'schwer-mitte' },
        a ? h('h1', { class: 'schwer-gross' }, 'Für heute reicht\'s') : null),
      h('footer', { class: 'schwer-fuss' }, link()));
  }

  app.bildschirme.schwer = { zeichne };
})(typeof globalThis !== 'undefined' ? globalThis : this);
