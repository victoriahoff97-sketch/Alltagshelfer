// Sticker-Look: ein Maskottchen mit Gesicht je Bereich.
(function (root) {
  const AH = root.AH;
  const h = AH.app.h;

  function gesicht(cx, cy) {
    return '<circle class="s-auge" cx="' + (cx - 7) + '" cy="' + cy + '" r="2"/><circle class="s-auge" cx="' + (cx + 7) + '" cy="' + cy + '" r="2"/>' +
      '<circle class="s-wange" cx="' + (cx - 12) + '" cy="' + (cy + 5) + '" r="2.8"/><circle class="s-wange" cx="' + (cx + 12) + '" cy="' + (cy + 5) + '" r="2.8"/>' +
      '<path class="s-strich" d="M' + (cx - 3) + ' ' + (cy + 4) + ' q3 3 6 0"/>';
  }

  const FIGUREN = {
    haushalt: '<circle class="s-blase" cx="6" cy="9" r="4"/><circle class="s-blase" cx="50" cy="6" r="3"/><circle class="s-blase" cx="51" cy="41" r="3.5"/>' +
      '<rect class="s-koerper" x="8" y="10" width="40" height="30" rx="10"/>' + gesicht(28, 23),
    pflege: '<path class="s-koerper" d="M28 4 C40 18 46 26 46 32 a18 14 0 0 1 -36 0 C10 26 16 18 28 4 z"/>' + gesicht(28, 29),
    bewegung: '<path class="s-strich" d="M3 19 h6 M1 26 h7 M3 33 h6"/><circle class="s-koerper" cx="30" cy="25" r="19"/>' + gesicht(30, 23),
    lernen: '<rect class="s-koerper" x="9" y="8" width="38" height="33" rx="5"/><path class="s-strich" d="M15 9 v31"/>' +
      '<path class="s-blase" d="M37 8 v10 l3 -3 l3 3 v-10"/>' + gesicht(31, 25),
    haustiere: '<circle class="s-blase" cx="20" cy="17" r="3.5"/><circle class="s-blase" cx="28" cy="14" r="3.5"/><circle class="s-blase" cx="36" cy="17" r="3.5"/>' +
      '<path class="s-koerper" d="M7 21 h42 l-5 19 a4 4 0 0 1 -4 3 h-24 a4 4 0 0 1 -4 -3 z"/>' + gesicht(28, 29),
    kontakte: '<rect class="s-koerper" x="7" y="9" width="42" height="32" rx="6"/><path class="s-strich" d="M9 13 l19 11 l19 -11"/>' + gesicht(28, 30),
    erledigungen: '<rect class="s-koerper" x="10" y="8" width="36" height="35" rx="5"/><rect class="s-blase" x="21" y="4" width="14" height="8" rx="3"/>' +
      '<path class="s-strich" d="M17 18 h8 M17 36 h22"/>' + gesicht(28, 25),
    beziehung: '<path class="s-koerper" d="M28 43 C9 30 5 20 11 12 a9.5 9.5 0 0 1 17 3 a9.5 9.5 0 0 1 17 -3 c6 8 2 18 -17 31 z"/>' + gesicht(28, 22),
  };

  function maskottchen(bereichId) {
    const el = h('span', { class: 'maskottchen', 'aria-hidden': 'true' });
    el.innerHTML = '<svg viewBox="0 0 56 48">' + (FIGUREN[bereichId] || FIGUREN.haushalt) + '</svg>';
    return el;
  }

  // Drei Knöpfe zur Wahl des Wesens; das gewählte zieht sofort ein.
  function wesenwahl(titel) {
    const app = AH.app;
    return h('section', { class: 'wesenwahl' },
      h('h2', { class: 'gruppe-titel' }, titel),
      h('div', { class: 'wesenwahl-reihe', role: 'group', 'aria-label': titel },
        AH.wesenbild.ARTEN.map(a => {
          const knopf = h('button', { class: 'wesen-knopf', 'aria-pressed': String(app.state.wesen === a.id),
            onclick: () => app.setze(Object.assign({}, app.state, { wesen: a.id })) },
            h('span', { class: 'wesen-bild', 'aria-hidden': 'true' }),
            h('span', {}, a.name));
          knopf.firstChild.innerHTML = '<svg class="wesen" viewBox="0 0 120 130">' + AH.wesenbild.innen(a.id, 'wach') + '</svg>';
          return knopf;
        })));
  }

  AH.sticker = { maskottchen, wesenwahl };
})(typeof globalThis !== 'undefined' ? globalThis : this);
