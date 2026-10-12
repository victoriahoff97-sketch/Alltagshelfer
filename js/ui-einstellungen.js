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
        app.setze(AH.speicher.eingespielt(AH.aufgaben.meineEinsetzen(r.state, app.heute())));
      } },
      { text: 'Abbrechen' },
    ], 'Alles, was jetzt in der App steht, wird durch die Sicherung ersetzt.');
    return '';
  }

  // Google Drive: verbinden, Stand der Sicherung, zurückholen.
  function driveAbschnitt() {
    const drive = AH.drive;
    const kasten = h('section', { class: 'drive' }, h('h2', { class: 'gruppe-titel' }, 'Google Drive'));
    if (!drive.eingerichtet()) {
      kasten.append(h('p', { class: 'leise' }, 'Die automatische Sicherung in Google Drive ist noch nicht eingerichtet.'));
      return kasten;
    }
    drive.vorbereiten().catch(() => {});
    const zeile = h('p', { class: 'leise', role: 'status' });
    const knoepfe = h('div', { class: 'drive-knoepfe' });
    const sag = text => { zeile.textContent = text; };
    const FEHLER = { netz: 'Gerade kein Netz. Versuch es gleich noch einmal.', anmeldung: 'Die Anmeldung bei Google hat nicht geklappt.', leer: 'In Drive liegt noch keine Sicherung.' };
    const schief = e => sag(FEHLER[e.message] || 'Das hat gerade nicht geklappt. Dein Stand ist unverändert.');
    const zurueckholen = () => drive.holen().then(text => {
      const meldung = einspielen(text);
      if (meldung) sag(meldung);
    }, schief);

    const zeichne = () => {
      const m = drive.merker();
      sag(drive.zeile(m, app.heute()));
      knoepfe.replaceChildren(...(m.an ? [
        h('button', { class: 'knopf knopf-haupt', onclick: () => { sag('Sichere …'); drive.jetztSichern().then(zeichne, schief); } }, 'Jetzt sichern'),
        h('button', { class: 'knopf', onclick: zurueckholen }, 'Aus Drive zurückholen'),
        h('button', { class: 'knopf knopf-still', onclick: () => drive.trennen() }, 'Trennen'),
      ] : [
        h('button', { class: 'knopf knopf-haupt', onclick: () => {
          sag('Verbinde …');
          drive.verbinden().then(r => {
            if (!r.vorhanden) return drive.uebernehmen().then(zeichne, schief);
            app.frage('In Drive liegt schon eine Sicherung.', [
              { text: 'Aus Drive zurückholen', haupt: true, tu: () => { drive.nurVerbinden(); zurueckholen(); } },
              { text: 'Mit dem Stand von diesem Gerät überschreiben', tu: () => drive.uebernehmen().then(zeichne, schief) },
              { text: 'Abbrechen', tu: zeichne },
            ], 'Was soll gelten?');
          }, schief);
        } }, 'Mit Google Drive verbinden'),
      ]));
    };
    drive.beiAenderung(() => { if (kasten.isConnected) zeichne(); });
    zeichne();
    kasten.append(
      h('p', { class: 'leise' }, 'Verbunden sichert die App jede Änderung von selbst in dein Drive. Sie sieht dort nur ihre eigene Datei.'),
      zeile, knoepfe);
    return kasten;
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
        status,
        driveAbschnitt());
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
