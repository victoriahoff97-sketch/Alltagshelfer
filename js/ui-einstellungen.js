// Sicherung als Datei herunterladen und wieder einspielen.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  const DATEI_MAX = 2 * 1024 * 1024;
  const UNLESBAR = 'Die Datei ließ sich nicht lesen. Dein Stand ist unverändert.';

  function herunterladen() {
    const blob = new Blob([AH.speicher.alsText(app.state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = h('a', { href: url, download: 'alltagshelfer-' + app.heute() + '.json' });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Liefert den Meldungstext für die Statuszeile.
  function einspielen(text) {
    const r = AH.speicher.ausText(text);
    if (!r.ok) return UNLESBAR;
    app.frage('Jetzigen Stand ersetzen?', [
      { text: 'Ersetzen', haupt: true, tu: () => {
        app.laeuft = null;
        app.meldung = 'Die Sicherung ist eingespielt.';
        // ältere Sicherungen bekommen die eigenen Aufgaben, Zimmer und Wesen bleiben
        app.setze(AH.aufgaben.meineEinsetzen(r.state, app.heute()));
      } },
      { text: 'Abbrechen' },
    ], 'Alles, was jetzt in der App steht, wird durch die Sicherung ersetzt.');
    return '';
  }

  app.bildschirme.sicherung = {
    einspielen,
    zeichne(el) {
      const status = h('p', { class: 'leise', role: 'status' }, app.meldung || '');
      app.meldung = null;
      const datei = h('input', { class: 'datei', id: 'f-datei', type: 'file', accept: '.json,application/json', onchange: () => {
        const f = datei.files && datei.files[0];
        datei.value = '';
        if (!f) return;
        if (f.size > DATEI_MAX) { status.textContent = UNLESBAR; return; }
        f.text().then(text => { status.textContent = einspielen(text); }, () => { status.textContent = UNLESBAR; });
      } });

      el.append(
        h('h1', { class: 'titel' }, 'Sicherung'),
        h('p', { class: 'leise' }, 'Dein Stand liegt nur auf diesem Gerät in diesem Browser. Eine Sicherung ist eine Datei, die du aufbewahren und später wieder einspielen kannst.'),
        h('div', { class: 'reihe' },
          h('button', { class: 'knopf knopf-haupt', onclick: () => { herunterladen(); status.textContent = 'Die Sicherung liegt bei deinen Downloads.'; } }, 'Sicherung herunterladen')),
        h('div', { class: 'feldzeile' }, h('label', { for: 'f-datei' }, 'Sicherung einspielen'), datei),
        status);
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
