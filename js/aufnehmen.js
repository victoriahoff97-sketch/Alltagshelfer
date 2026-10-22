// Aufnehmen: Text per Sprache (Android-Hülle oder Web Speech) oder getippt, immer mit
// derselben Rückgabe: fertig(text). Die Antwort selbst legt der Aufrufer in den Eingang.
(function (root) {
  let offen = null; // das gerade offene Feld: { zu() }

  const app = () => root.AH.app;

  function schliesse() {
    if (!offen) return;
    const o = offen;
    offen = null;
    o.zu();
  }

  // Kleine Leiste unten über dem Rahmen; zu() räumt sie weg und gibt den Fokus zurück.
  function oeffne(kinder, beschriftung, vorFokus) {
    const { h } = app();
    const vorher = document.activeElement;
    const feld = h('div', { class: 'aufnahme', role: 'group', 'aria-label': beschriftung }, kinder);
    const zu = () => {
      feld.remove();
      if (vorher && vorher.isConnected) vorher.focus({ preventScroll: true });
    };
    document.querySelector('.rahmen').append(feld);
    offen = { zu };
    if (vorFokus) vorFokus(feld);
    return feld;
  }

  // Textfeld statt Sprache.
  function tippen(fertig) {
    schliesse();
    const { h } = app();
    const feld = h('input', {
      class: 'aufnahme-feld', type: 'text', 'aria-label': 'Was soll in den Eingang?', placeholder: 'Was fällt dir ein?',
      enterkeyhint: 'done', autocomplete: 'off',
      onkeydown: e => {
        if (e.key === 'Enter') { e.preventDefault(); speichern(); }
        else if (e.key === 'Escape') schliesse();
      },
    });
    const speichern = () => {
      const text = feld.value.trim();
      if (!text) { feld.focus(); return; }
      offen = null;
      kasten.remove();
      fertig(text);
    };
    const kasten = oeffne([
      feld,
      h('div', { class: 'aufnahme-knoepfe' },
        h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: speichern }, 'Speichern'),
        h('button', { class: 'knopf', type: 'button', onclick: schliesse }, 'Abbrechen')),
    ], 'Aufnehmen', () => feld.focus());
  }

  // Anzeige „Ich höre zu …“ mit den Wegen heraus.
  function hoeren(fertig, abbruch) {
    const { h } = app();
    oeffne([
      h('p', { class: 'aufnahme-text', role: 'status' }, 'Ich höre zu …'),
      h('div', { class: 'aufnahme-knoepfe' },
        h('button', { class: 'knopf', type: 'button', onclick: () => { abbruch(); tippen(fertig); } }, 'Lieber tippen'),
        h('button', { class: 'knopf', type: 'button', onclick: () => { abbruch(); schliesse(); } }, 'Abbrechen')),
    ], 'Aufnehmen');
  }

  // Sprache aufnehmen; wo das nicht geht, öffnet sich das Textfeld.
  function starte(fertig) {
    schliesse();
    const huelle = root.Huelle;
    if (huelle && typeof huelle.sprechen === 'function') {
      // Die Hülle ruft AH_sprache(text), sobald Android den Text hat (leer, wenn nichts kam).
      root.AH_sprache = text => {
        root.AH_sprache = () => {};
        schliesse();
        if (typeof text === 'string' && text.trim()) fertig(text);
      };
      hoeren(fertig, () => { root.AH_sprache = () => {}; });
      try { huelle.sprechen(); } catch (e) { root.AH_sprache = () => {}; tippen(fertig); }
      return;
    }

    const Erkennung = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!Erkennung) { tippen(fertig); return; }
    let r;
    let text = '';
    let fehler = '';
    let abgebrochen = false;
    try {
      r = new Erkennung();
      r.lang = 'de-DE';
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onresult = e => { text = e.results[0][0].transcript; };
      r.onerror = e => { fehler = e.error || 'fehler'; };
      r.onend = () => {
        if (abgebrochen) return;
        schliesse();
        if (text.trim()) fertig(text);
        else if (!fehler || fehler === 'no-speech') app().melde('Nichts gehört.');
        else tippen(fertig); // Mikrofon nicht erlaubt, kein Netz o. Ä.
      };
      hoeren(fertig, () => { abgebrochen = true; try { r.abort(); } catch (e) { /* schon fertig */ } });
      r.start();
    } catch (e) {
      abgebrochen = true;
      tippen(fertig);
    }
  }

  const api = { starte, tippen };
  root.AH = root.AH || {};
  root.AH.aufnehmen = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
