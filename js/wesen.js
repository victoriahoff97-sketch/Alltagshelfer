// Die Wesen, die im Zimmer wohnen können. Jedes hat vier Bilder: wach, eingekuschelt (klein),
// voller Energie (viel) und beim Mitmachen, während die Zeit läuft (eifer).
// Gezeichnet in einem Feld von 120 x 128, die Füße stehen bei y = 125.
// Die Klassen w-… tragen die Bewegung; sie steht in css/app.css.
(function (root) {
  const ARTEN = [
    { id: 'axolotl', name: 'Axolotl', satz: 'Der Axolotl' },
    { id: 'pilz', name: 'Pilzgeist', satz: 'Der Pilzgeist' },
  ];

  const DUNKEL = '#4a3b3b';
  // Das äußere g trägt den Platz, das innere blinzelt.
  const auge = (x, y, g) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (g || 1) + ')" stroke="none"><g class="auge">' +
    '<ellipse rx="4.8" ry="5.8" fill="' + DUNKEL + '"/><circle cx="1.7" cy="-2.1" r="1.8" fill="#ffffff"/><circle cx="-1.7" cy="1.9" r="0.8" fill="#ffffff"/></g></g>';
  const zu = (x, y) => '<path d="M' + (x - 4.5) + ' ' + y + ' q4.5 4.5 9 0" fill="none" stroke="' + DUNKEL + '" stroke-width="1.6"/>';
  const froh = (x, y) => '<path d="M' + (x - 5) + ' ' + (y + 1.5) + ' q5 -6.5 10 0" fill="none" stroke="' + DUNKEL + '" stroke-width="1.8"/>';
  function augen(pose, x1, x2, y, g) {
    if (pose === 'klein') return zu(x1, y) + zu(x2, y);
    if (pose === 'eifer') return froh(x1, y) + froh(x2, y);
    const gr = (g || 1) * (pose === 'viel' ? 1.18 : 1);
    return auge(x1, y, gr) + auge(x2, y, gr);
  }
  const wange = (x, y, kraeftig) => '<ellipse cx="' + x + '" cy="' + y + '" rx="5" ry="3.4" fill="' + (kraeftig ? '#ff9fb8' : '#ffb3c4') + '" opacity="0.85" stroke="none"/>';
  const lacht = (x, y, b) => '<path d="M' + (x - b) + ' ' + y + ' q' + b + ' ' + (b + 2) + ' ' + (2 * b) + ' 0 z" fill="#e8798f" stroke="' + DUNKEL + '" stroke-width="1.4"/>';
  const schatten = rx => '<ellipse cx="60" cy="124" rx="' + rx + '" ry="5" fill="#5a4a44" opacity="0.12" stroke="none"/>';
  const rahmen = (farbe, inhalt) => '<g stroke="' + farbe + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">' + inhalt + '</g>';
  const stern = (x, y, g) => '<g transform="translate(' + x + ' ' + y + ') scale(' + g + ')"><path class="w-funkel" d="M0 -6 l1.6 4.4 l4.4 1.6 l-4.4 1.6 l-1.6 4.4 l-1.6 -4.4 l-4.4 -1.6 l4.4 -1.6 z" fill="#ffd27a" stroke="none"/></g>';
  const funkeln = stern(12, 34, 1) + stern(110, 22, 1.2) + stern(106, 96, 0.8);
  // Kopf für die liegende Haltung: kleiner und nach vorn unten gesetzt.
  const gelegt = (kopf, cx, cy) => '<g transform="translate(38 100) scale(0.86) translate(' + (-cx) + ' ' + (-cy) + ')">' + kopf + '</g>';
  // Ein Arm, der zum Kopf hinaufreicht, mit der Hand obenauf.
  const reibarm = (d, hx, hy, farbe, linie, gegen) => '<g class="w-reib' + (gegen ? ' w-gegen' : '') + '">' +
    '<path d="' + d + '" fill="none" stroke="' + linie + '" stroke-width="8.5"/><path d="' + d + '" fill="none" stroke="' + farbe + '" stroke-width="5.5"/>' +
    '<ellipse cx="' + hx + '" cy="' + hy + '" rx="7" ry="5.5" fill="' + farbe + '"/></g>';

  function axolotlKopf(pose) {
    const kieme = (cx, cy, w) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="12" ry="4.5"' + (w ? ' transform="rotate(' + w + ' ' + cx + ' ' + cy + ')"' : '') + '/>';
    const kraeftig = pose === 'viel' || pose === 'eifer';
    return '<g class="w-kl" fill="#ff9fb8">' + kieme(27, 46, 28) + kieme(22, 60, 0) + kieme(27, 74, -28) + '</g>' +
      '<g class="w-kr" fill="#ff9fb8">' + kieme(93, 46, -28) + kieme(98, 60, 0) + kieme(93, 74, 28) + '</g>' +
      '<ellipse cx="60" cy="60" rx="33" ry="25" fill="#ffd9e3"/>' +
      '<g fill="#ffb3c8" stroke="none"><circle cx="52" cy="42" r="1.4"/><circle cx="60" cy="40" r="1.4"/><circle cx="68" cy="42" r="1.4"/></g>' +
      augen(pose, 42, 78, 58, 0.9) + wange(38, 68, kraeftig) + wange(82, 68, kraeftig) +
      (pose === 'viel' ? lacht(60, 65, 9) : '<path d="M49 66 q11 9 22 0" fill="none" stroke="' + DUNKEL + '" stroke-width="1.6"/>');
  }

  function axolotl(pose) {
    const linie = '#d98a9f';
    if (pose === 'klein') {
      return rahmen(linie, schatten(44) +
        '<path d="M96 106 q16 -4 20 -20 q2 20 -10 30 z" fill="#ffb3c8"/>' +
        '<g class="w-atmet"><ellipse cx="70" cy="110" rx="34" ry="14" fill="#ffd9e3"/>' +
        '<ellipse cx="94" cy="121" rx="8" ry="4.5" fill="#ffd9e3"/>' +
        gelegt(axolotlKopf(pose), 60, 60) +
        '<ellipse cx="54" cy="123" rx="7" ry="4" fill="#ffd9e3"/></g>');
    }
    const arm = (x, y, w, seite) => '<g class="w-arm-' + seite + '"><ellipse cx="' + x + '" cy="' + y + '" rx="5" ry="8" fill="#ffd9e3" transform="rotate(' + w + ' ' + x + ' ' + y + ')"/></g>';
    const unten = pose === 'wach' ? arm(42, 100, 25, 'l') + arm(78, 100, -25, 'r') : '';
    let oben = '';
    if (pose === 'viel') oben = arm(31, 88, -38, 'l') + arm(89, 88, 38, 'r');
    if (pose === 'eifer') oben = reibarm('M40 96 q-12 -24 3 -52', 46, 40, '#ffd9e3', linie, false) + reibarm('M80 96 q12 -24 -3 -52', 74, 40, '#ffd9e3', linie, true);
    return rahmen(linie, schatten(32) + (pose === 'viel' ? funkeln : '') +
      '<path class="w-schwanz" d="M76 106 q24 -2 30 -24 q0 22 -14 32 z" fill="#ffb3c8"/>' +
      '<g class="w-atmet"><ellipse cx="60" cy="100" rx="20" ry="21" fill="#ffd9e3"/>' +
      '<ellipse cx="60" cy="104" rx="11" ry="13" fill="#fff1f5" stroke="none"/>' +
      unten +
      '<ellipse cx="50" cy="120" rx="8" ry="4.5" fill="#ffd9e3"/><ellipse cx="70" cy="120" rx="8" ry="4.5" fill="#ffd9e3"/>' +
      axolotlKopf(pose) + oben + '</g>');
  }

  // Der Pilzgeist legt sich nicht hin, er zieht den Hut tief ins Gesicht.
  function pilz(pose) {
    const linie = '#b8958a';
    const schlaeft = pose === 'klein';
    const hut = '<path d="M18 62 a42 40 0 0 1 84 0 q0 9 -42 9 q-42 0 -42 -9 z" fill="#ffc2b8" stroke="#d99488"/>' +
      '<g fill="#ffffff" stroke="none"><circle cx="38" cy="42" r="6"/><circle cx="62" cy="32" r="7"/><circle cx="84" cy="46" r="5.5"/><circle cx="52" cy="56" r="3.5"/><circle cx="74" cy="60" r="3"/></g>' +
      '<path class="w-blatt" d="M60 22 q-2 -10 6 -14 q4 8 -6 14 z" fill="#bfe3c8" stroke="#7fb98a" stroke-width="1.3"/>';
    const augenhoehe = schlaeft ? 93 : 86;
    const arm = (x, y, w, seite) => '<g class="w-arm-' + seite + '"><ellipse cx="' + x + '" cy="' + y + '" rx="4.6" ry="8" fill="#fff6ee" transform="rotate(' + w + ' ' + x + ' ' + y + ')"/></g>';
    let arme = arm(38, 98, 24, 'l') + arm(82, 98, -24, 'r');
    if (pose === 'viel') arme = arm(32, 80, -38, 'l') + arm(88, 80, 38, 'r');
    if (pose === 'eifer') arme = '';
    const haende = pose === 'eifer'
      ? reibarm('M41 96 q-14 -12 -12 -34', 29, 58, '#fff6ee', linie, false) + reibarm('M79 96 q14 -12 12 -34', 91, 58, '#fff6ee', linie, true)
      : '';
    const kraeftig = pose === 'viel' || pose === 'eifer';
    return rahmen(linie, schatten(32) + (pose === 'viel' ? funkeln : '') +
      '<path class="w-blatt" d="M92 122 q2 -10 -2 -14 M92 114 q6 -6 10 -2 q-2 6 -10 2 M91 118 q-6 -5 -9 -1 q3 5 9 1" fill="#bfe3c8" stroke="#7fb98a" stroke-width="1.3"/>' +
      '<g class="w-atmet"><path d="M40 66 q-6 52 20 56 q26 -4 20 -56 z" fill="#fff6ee"/>' +
      '<ellipse cx="60" cy="106" rx="12" ry="11" fill="#ffffff" stroke="none"/>' +
      '<ellipse cx="50" cy="121" rx="8" ry="4.5" fill="#fff6ee"/><ellipse cx="70" cy="121" rx="8" ry="4.5" fill="#fff6ee"/>' +
      arme +
      (schlaeft ? '<g transform="translate(0 9)">' + hut + '</g>' : hut) +
      augen(pose, 50, 70, augenhoehe) + wange(42, augenhoehe + 8, kraeftig) + wange(78, augenhoehe + 8, kraeftig) +
      (pose === 'viel' ? lacht(60, augenhoehe + 7, 6)
        : '<path d="M56 ' + (augenhoehe + 8) + ' q4 4 8 0" fill="none" stroke="' + DUNKEL + '" stroke-width="1.5"/>') +
      haende + '</g>');
  }

  const BILDER = { axolotl, pilz };
  const POSEN = ['wach', 'klein', 'viel', 'eifer'];

  function art(id) {
    return ARTEN.find(a => a.id === id) || ARTEN[0];
  }

  // zustand: 'wach' | 'klein' | 'viel' | 'eifer' | 'freut' (freut zeigt das wache Bild, die Bewegung kommt aus dem Stil)
  function innen(id, zustand) {
    return BILDER[art(id).id](POSEN.includes(zustand) ? zustand : 'wach');
  }

  const api = { ARTEN, art, innen };
  root.AH = root.AH || {};
  root.AH.wesenbild = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
