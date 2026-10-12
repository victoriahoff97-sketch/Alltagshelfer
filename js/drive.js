// Sicherung in Google Drive: nach jeder Änderung landet der Stand als eine Datei im eigenen Drive.
// Die App darf dort nur Dateien sehen, die sie selbst angelegt hat.
(function (root) {
  // Die Client-ID aus der Google Cloud Console (APIs & Dienste → Anmeldedaten). Sie ist kein Geheimnis.
  const CLIENT_ID = '';
  const DATEI = 'alltagshelfer-sicherung.json';
  const BEREICH = 'https://www.googleapis.com/auth/drive.file';
  const MERKER = 'alltagshelfer.drive'; // je Gerät: verbunden, Datei, letztes Sichern
  const WARTEN = 5000;
  const API = 'https://www.googleapis.com/';
  const zwei = n => String(n).padStart(2, '0');

  // s: { an, geaendert, laeuft, tokenBis, jetzt }
  function naechstes(s) {
    if (!s.an || !s.geaendert || s.laeuft) return 'nichts';
    return s.tokenBis > s.jetzt ? 'hochladen' : 'anmelden';
  }

  const FEHLER = {
    netz: 'Gerade kein Netz. Die Sicherung holt das nach.',
    anmeldung: 'Die Anmeldung bei Google ist abgelaufen. „Jetzt sichern“ meldet dich wieder an.',
    google: 'Google hat die Sicherung gerade nicht angenommen. Die App versucht es wieder.',
  };

  // m: der Merker dieses Geräts; heute: 'JJJJ-MM-TT'
  function zeile(m, heute) {
    if (!m.an) return 'Nicht verbunden.';
    if (m.fehler) return FEHLER[m.fehler] || FEHLER.google;
    if (!m.zuletzt) return 'Verbunden. Noch nichts gesichert.';
    const tag = m.zuletzt.slice(0, 10);
    const wann = tag === heute ? 'heute' : tag.slice(8, 10) + '.' + tag.slice(5, 7) + '.';
    return 'Zuletzt gesichert: ' + wann + ', ' + m.zuletzt.slice(11, 16);
  }

  let merker = { an: false };
  let token = null;
  let tokenBis = 0;
  let geaendertNr = 0;   // zählt Änderungen, damit eine während des Hochladens nicht verloren geht
  let gesichertNr = 0;
  let laeuft = false;
  let wartetAufTipp = false;
  let takt = null;
  let googleDa = null;
  let hoerer = null;
  let quelle = { text: () => '', ruhig: () => false };

  function lies() {
    try {
      const m = JSON.parse(root.localStorage.getItem(MERKER));
      if (m && typeof m === 'object') merker = m;
    } catch (e) { /* ohne Merker gilt: nicht verbunden */ }
  }

  function merke(felder) {
    merker = Object.assign({}, merker, felder);
    try { root.localStorage.setItem(MERKER, JSON.stringify(merker)); } catch (e) { /* hält nur bis zum Schließen */ }
    if (hoerer) hoerer();
  }

  // Lädt Googles Anmeldung. Muss vor dem Tipp geschehen sein, sonst sperrt der Browser das Anmeldefenster.
  function vorbereiten() {
    if (!CLIENT_ID) return Promise.reject(new Error('einrichtung'));
    if (!googleDa) {
      googleDa = new Promise((ok, nein) => {
        const s = root.document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = ok;
        s.onerror = () => { googleDa = null; nein(new Error('netz')); };
        root.document.head.append(s);
      });
    }
    return googleDa;
  }

  const googleBereit = () => !!(root.google && root.google.accounts && root.google.accounts.oauth2);

  function anmelden() {
    return new Promise((ok, nein) => {
      if (!googleBereit()) return nein(new Error('netz'));
      root.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: BEREICH, prompt: '',
        callback: r => {
          if (!r || !r.access_token) return nein(new Error('anmeldung'));
          token = r.access_token;
          tokenBis = Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000;
          ok();
        },
        error_callback: () => nein(new Error('anmeldung')),
      }).requestAccessToken();
    });
  }

  function anfrage(pfad, opt) {
    const o = Object.assign({}, opt);
    o.headers = Object.assign({ Authorization: 'Bearer ' + token }, o.headers);
    return root.fetch(API + pfad, o).then(r => {
      if (r.status === 401) { token = null; tokenBis = 0; throw new Error('anmeldung'); }
      if (!r.ok) { const e = new Error('google'); e.status = r.status; throw e; }
      return r;
    }, () => { throw new Error('netz'); });
  }

  function findeDatei() {
    const q = encodeURIComponent("name = '" + DATEI + "' and trashed = false");
    return anfrage('drive/v3/files?q=' + q + '&orderBy=modifiedTime%20desc&fields=files(id)')
      .then(r => r.json()).then(j => (j.files && j.files[0] ? j.files[0].id : null));
  }

  function lege(text) {
    const grenze = 'alltagshelfer' + Date.now();
    const koerper = '--' + grenze + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify({ name: DATEI, mimeType: 'application/json' }) +
      '\r\n--' + grenze + '\r\nContent-Type: application/json\r\n\r\n' + text + '\r\n--' + grenze + '--';
    return anfrage('upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + grenze }, body: koerper, keepalive: true,
    }).then(r => r.json()).then(j => j.id);
  }

  function ueberschreibe(id, text) {
    return anfrage('upload/drive/v3/files/' + id + '?uploadType=media&fields=id', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: text, keepalive: true,
    }).then(() => id, e => {
      // die Datei wurde in Drive gelöscht: neu anlegen
      if (e.status === 404) return lege(text);
      throw e;
    });
  }

  function hochladen() {
    laeuft = true;
    const nr = geaendertNr;
    const text = quelle.text();
    return Promise.resolve(merker.dateiId || findeDatei())
      .then(id => (id ? ueberschreibe(id, text) : lege(text)))
      .then(id => {
        laeuft = false;
        gesichertNr = nr;
        const d = new Date();
        merke({ dateiId: id, fehler: null,
          zuletzt: d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()) + 'T' + zwei(d.getHours()) + ':' + zwei(d.getMinutes()) + ':00' });
        if (geaendertNr !== gesichertNr) plane();
      }, e => {
        laeuft = false;
        if (e.message === 'anmeldung') wartetAufTipp = true;
        merke({ fehler: e.message === 'anmeldung' ? null : e.message });
        throw e;
      });
  }

  function lauf() {
    takt = null;
    const was = naechstes({ an: merker.an, geaendert: geaendertNr !== gesichertNr, laeuft, tokenBis, jetzt: Date.now() });
    if (was === 'hochladen') hochladen().catch(() => { /* steht in der Statuszeile */ });
    else if (was === 'anmelden') wartetAufTipp = true;
  }

  function plane() {
    if (takt) root.clearTimeout(takt);
    takt = root.setTimeout(lauf, WARTEN);
  }

  // Die App meldet jede gespeicherte Änderung.
  function geaendert() {
    if (!merker.an) return;
    geaendertNr += 1;
    plane();
  }

  // Bei jedem Tipp: ist die Anmeldung abgelaufen und liegt etwas an, erneuert sie sich hier,
  // denn nur während eines Tipps lässt der Browser Googles Fenster zu.
  function beimTipp() {
    if (!wartetAufTipp || !merker.an || quelle.ruhig() || !googleBereit()) return;
    wartetAufTipp = false;
    anmelden().then(lauf, () => merke({ fehler: 'anmeldung' }));
  }

  // Verbinden: meldet an und sagt, ob in Drive schon eine Sicherung liegt. Hochgeladen wird erst
  // nach uebernehmen(), damit ein leeres Gerät keine vorhandene Sicherung überschreibt.
  function verbinden() {
    return anmelden().then(findeDatei).then(id => {
      if (id) merker = Object.assign({}, merker, { dateiId: id });
      return { vorhanden: !!id };
    });
  }

  function uebernehmen() {
    merke({ an: true, fehler: null });
    geaendertNr += 1;
    return hochladen();
  }

  // Verbindet, ohne hochzuladen: der Stand kommt gleich aus Drive.
  function nurVerbinden() {
    merke({ an: true, fehler: null });
  }

  function holen() {
    return (tokenBis > Date.now() ? Promise.resolve() : anmelden())
      .then(() => merker.dateiId || findeDatei())
      .then(id => {
        if (!id) throw new Error('leer');
        return anfrage('drive/v3/files/' + id + '?alt=media').then(r => r.text());
      });
  }

  function jetztSichern() {
    geaendertNr += 1;
    return (tokenBis > Date.now() ? Promise.resolve() : anmelden()).then(hochladen);
  }

  function trennen() {
    if (token && googleBereit()) root.google.accounts.oauth2.revoke(token, () => {});
    token = null;
    tokenBis = 0;
    wartetAufTipp = false;
    merke({ an: false, dateiId: null, zuletzt: null, fehler: null });
  }

  // q: { text(): der Stand als Text, ruhig(): true, wenn gerade nichts aufgehen darf }
  function start(q) {
    quelle = q;
    lies();
    if (!merker.an || !CLIENT_ID) return;
    vorbereiten().catch(() => {});
    // beim Weglegen des Handys sofort sichern, statt die Wartezeit abzuwarten
    root.document.addEventListener('visibilitychange', () => {
      if (root.document.hidden && takt) { root.clearTimeout(takt); lauf(); }
    });
  }

  const api = {
    naechstes, zeile, start, vorbereiten, verbinden, uebernehmen, nurVerbinden, holen, jetztSichern, trennen, geaendert, beimTipp,
    eingerichtet: () => !!CLIENT_ID,
    merker: () => merker,
    beiAenderung(fn) { hoerer = fn; },
  };
  root.AH = root.AH || {};
  root.AH.drive = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
