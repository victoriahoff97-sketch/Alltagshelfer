// Die Wesen, die im Zimmer wohnen können: je ein waches und ein eingekuscheltes Bild.
// Gezeichnet in einem Feld von 120 x 128, die Füße stehen bei y = 125.
(function (root) {
  const ARTEN = [
    { id: 'otter', name: 'Otter', satz: 'Der Otter' },
    { id: 'axolotl', name: 'Axolotl', satz: 'Der Axolotl' },
    { id: 'pilz', name: 'Pilzgeist', satz: 'Der Pilzgeist' },
  ];

  const DUNKEL = '#4a3b3b';
  // Das äußere g trägt den Platz, das innere blinzelt.
  const auge = (x, y, g) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (g || 1) + ')" stroke="none"><g class="auge">' +
    '<ellipse rx="4.8" ry="5.8" fill="' + DUNKEL + '"/><circle cx="1.7" cy="-2.1" r="1.8" fill="#ffffff"/><circle cx="-1.7" cy="1.9" r="0.8" fill="#ffffff"/></g></g>';
  const zu = (x, y) => '<path d="M' + (x - 4.5) + ' ' + y + ' q4.5 4.5 9 0" fill="none" stroke="' + DUNKEL + '" stroke-width="1.6"/>';
  const augen = (schlaeft, x1, x2, y, g) => schlaeft ? zu(x1, y) + zu(x2, y) : auge(x1, y, g) + auge(x2, y, g);
  const wange = (x, y) => '<ellipse cx="' + x + '" cy="' + y + '" rx="5" ry="3.4" fill="#ffb3c4" opacity="0.8" stroke="none"/>';
  const schatten = rx => '<ellipse cx="60" cy="124" rx="' + rx + '" ry="5" fill="#5a4a44" opacity="0.12" stroke="none"/>';
  const rahmen = (farbe, inhalt) => '<g stroke="' + farbe + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">' + inhalt + '</g>';
  // Kopf für die liegende Haltung: kleiner und nach vorn unten gesetzt.
  const gelegt = (kopf, cx, cy) => '<g transform="translate(38 100) scale(0.86) translate(' + (-cx) + ' ' + (-cy) + ')">' + kopf + '</g>';

  function otterKopf(schlaeft) {
    return '<circle cx="33" cy="42" r="6.5" fill="#cfa98c"/><circle cx="87" cy="42" r="6.5" fill="#cfa98c"/>' +
      '<circle cx="33" cy="42" r="3" fill="#f3c9b8" stroke="none"/><circle cx="87" cy="42" r="3" fill="#f3c9b8" stroke="none"/>' +
      '<ellipse cx="60" cy="59" rx="31" ry="26" fill="#cfa98c"/>' +
      '<ellipse cx="60" cy="68" rx="17" ry="12" fill="#f8e6d2" stroke="none"/>' +
      augen(schlaeft, 46, 74, 56) + wange(38, 66) + wange(82, 66) +
      '<ellipse cx="60" cy="63" rx="4.5" ry="3.2" fill="' + DUNKEL + '" stroke="none"/>' +
      '<path d="M60 66 v3 M60 69 q-3.5 4 -7 1 M60 69 q3.5 4 7 1" fill="none" stroke="' + DUNKEL + '" stroke-width="1.5"/>' +
      '<g fill="#9c7a62" stroke="none"><circle cx="46" cy="69" r="0.9"/><circle cx="49" cy="72" r="0.9"/><circle cx="74" cy="69" r="0.9"/><circle cx="71" cy="72" r="0.9"/></g>';
  }

  function otter(schlaeft) {
    const schwanz = d => '<path d="' + d + '" fill="none" stroke="#9c7a62" stroke-width="13"/><path d="' + d + '" fill="none" stroke="#cfa98c" stroke-width="10"/>';
    if (schlaeft) {
      return rahmen('#9c7a62', schatten(44) + schwanz('M96 112 q20 0 18 -16') +
        '<ellipse cx="68" cy="108" rx="36" ry="16" fill="#cfa98c"/>' +
        '<ellipse cx="96" cy="121" rx="9" ry="4.5" fill="#b98f72"/>' +
        gelegt(otterKopf(true), 60, 59) +
        '<ellipse cx="30" cy="122" rx="7" ry="4.5" fill="#b98f72"/><ellipse cx="47" cy="123" rx="7" ry="4.5" fill="#b98f72"/>');
    }
    return rahmen('#9c7a62', schatten(32) + schwanz('M82 110 q28 4 24 -22') +
      '<ellipse cx="60" cy="96" rx="25" ry="26" fill="#cfa98c"/>' +
      '<ellipse cx="60" cy="101" rx="15" ry="18" fill="#f8e6d2" stroke="none"/>' +
      '<ellipse cx="48" cy="121" rx="9" ry="5" fill="#b98f72"/><ellipse cx="72" cy="121" rx="9" ry="5" fill="#b98f72"/>' +
      otterKopf(false) +
      '<path d="M60 83.5 l3 7.5 h7.5 l-6 5.1 l2.4 7.8 l-6.9 -4.8 l-6.9 4.8 l2.4 -7.8 l-6 -5.1 h7.5 z" fill="#ffe08a" stroke="#d6a93a" stroke-width="1.2"/>' +
      '<ellipse cx="48" cy="97" rx="6.5" ry="5" fill="#b98f72"/><ellipse cx="72" cy="97" rx="6.5" ry="5" fill="#b98f72"/>');
  }

  function axolotlKopf(schlaeft) {
    const kieme = (cx, cy, w) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="12" ry="4.5"' + (w ? ' transform="rotate(' + w + ' ' + cx + ' ' + cy + ')"' : '') + '/>';
    return '<g fill="#ff9fb8">' + kieme(27, 46, 28) + kieme(22, 60, 0) + kieme(27, 74, -28) + kieme(93, 46, -28) + kieme(98, 60, 0) + kieme(93, 74, 28) + '</g>' +
      '<ellipse cx="60" cy="60" rx="33" ry="25" fill="#ffd9e3"/>' +
      '<g fill="#ffb3c8" stroke="none"><circle cx="52" cy="42" r="1.4"/><circle cx="60" cy="40" r="1.4"/><circle cx="68" cy="42" r="1.4"/></g>' +
      augen(schlaeft, 42, 78, 58, 0.9) + wange(38, 68) + wange(82, 68) +
      '<path d="M49 66 q11 9 22 0" fill="none" stroke="' + DUNKEL + '" stroke-width="1.6"/>';
  }

  function axolotl(schlaeft) {
    if (schlaeft) {
      return rahmen('#d98a9f', schatten(44) +
        '<path d="M96 106 q16 -4 20 -20 q2 20 -10 30 z" fill="#ffb3c8"/>' +
        '<ellipse cx="70" cy="110" rx="34" ry="14" fill="#ffd9e3"/>' +
        '<ellipse cx="94" cy="121" rx="8" ry="4.5" fill="#ffd9e3"/>' +
        gelegt(axolotlKopf(true), 60, 60) +
        '<ellipse cx="54" cy="123" rx="7" ry="4" fill="#ffd9e3"/>');
    }
    return rahmen('#d98a9f', schatten(32) +
      '<path d="M76 106 q24 -2 30 -24 q0 22 -14 32 z" fill="#ffb3c8"/>' +
      '<ellipse cx="60" cy="100" rx="20" ry="21" fill="#ffd9e3"/>' +
      '<ellipse cx="60" cy="104" rx="11" ry="13" fill="#fff1f5" stroke="none"/>' +
      '<ellipse cx="42" cy="100" rx="5" ry="8" fill="#ffd9e3" transform="rotate(25 42 100)"/><ellipse cx="78" cy="100" rx="5" ry="8" fill="#ffd9e3" transform="rotate(-25 78 100)"/>' +
      '<ellipse cx="50" cy="120" rx="8" ry="4.5" fill="#ffd9e3"/><ellipse cx="70" cy="120" rx="8" ry="4.5" fill="#ffd9e3"/>' +
      axolotlKopf(false));
  }

  // Der Pilzgeist legt sich nicht hin, er zieht den Hut tief ins Gesicht.
  function pilz(schlaeft) {
    const hut = '<path d="M18 62 a42 40 0 0 1 84 0 q0 9 -42 9 q-42 0 -42 -9 z" fill="#ffc2b8" stroke="#d99488"/>' +
      '<g fill="#ffffff" stroke="none"><circle cx="38" cy="42" r="6"/><circle cx="62" cy="32" r="7"/><circle cx="84" cy="46" r="5.5"/><circle cx="52" cy="56" r="3.5"/><circle cx="74" cy="60" r="3"/></g>' +
      '<path d="M60 22 q-2 -10 6 -14 q4 8 -6 14 z" fill="#bfe3c8" stroke="#7fb98a" stroke-width="1.3"/>';
    const augenhoehe = schlaeft ? 93 : 86;
    return rahmen('#b8958a', schatten(32) +
      '<path d="M92 122 q2 -10 -2 -14 M92 114 q6 -6 10 -2 q-2 6 -10 2 M91 118 q-6 -5 -9 -1 q3 5 9 1" fill="#bfe3c8" stroke="#7fb98a" stroke-width="1.3"/>' +
      '<path d="M40 66 q-6 52 20 56 q26 -4 20 -56 z" fill="#fff6ee"/>' +
      '<ellipse cx="60" cy="106" rx="12" ry="11" fill="#ffffff" stroke="none"/>' +
      '<ellipse cx="50" cy="121" rx="8" ry="4.5" fill="#fff6ee"/><ellipse cx="70" cy="121" rx="8" ry="4.5" fill="#fff6ee"/>' +
      '<ellipse cx="38" cy="98" rx="4.6" ry="8" fill="#fff6ee" transform="rotate(24 38 98)"/><ellipse cx="82" cy="98" rx="4.6" ry="8" fill="#fff6ee" transform="rotate(-24 82 98)"/>' +
      (schlaeft ? '<g transform="translate(0 9)">' + hut + '</g>' : hut) +
      augen(schlaeft, 50, 70, augenhoehe) + wange(42, augenhoehe + 8) + wange(78, augenhoehe + 8) +
      '<path d="M56 ' + (augenhoehe + 8) + ' q4 4 8 0" fill="none" stroke="' + DUNKEL + '" stroke-width="1.5"/>');
  }

  const BILDER = { otter, axolotl, pilz };

  function art(id) {
    return ARTEN.find(a => a.id === id) || ARTEN[0];
  }

  // zustand: 'wach' | 'klein' | 'freut' (freut zeigt das wache Bild, die Bewegung kommt aus dem Stil)
  function innen(id, zustand) {
    return BILDER[art(id).id](zustand === 'klein');
  }

  const api = { ARTEN, art, innen };
  root.AH = root.AH || {};
  root.AH.wesenbild = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
