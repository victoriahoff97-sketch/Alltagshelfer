// Das Zimmer als ein Bild: feste Einrichtung, das Wesen und je erledigter Sache ein gezeichnetes Stück.
// Jedes Stück hat einen festen Platz. z legt fest, was vor wem steht: 0 Wand, 1 Boden hinten,
// 2 Teppiche, danach das Wesen, 4 vorn.
(function (root) {
  const wesenbild = typeof require === 'function' ? require('./wesen.js') : root.AH.wesenbild;

  const F = {
    rosa: '#ffc9d6', gelb: '#ffe9a8', gruen: '#bfe3c8', blatt: '#9fd3a8', blau: '#bcd9f5', hell: '#dcecfb',
    flieder: '#c9b8f0', holz: '#f0d9bd', korb: '#e3c9a8', ton: '#f0a58a', weiss: '#ffffff', dunkel: '#5a4a44',
    gold: '#ffd27a', grau: '#d9d2de',
  };

  const R = (x, y, w, h, rx, f) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + f + '"/>';
  const E = (cx, cy, rx, ry, f) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"/>';
  const C = (cx, cy, r, f) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"/>';
  const P = (d, f) => '<path d="' + d + '" fill="' + f + '"/>';
  const L = (d, farbe, breite) => '<path d="' + d + '" fill="none" stroke="' + (farbe || '#9a7f72') + '" stroke-width="' + (breite || 1.2) + '" stroke-linecap="round"/>';
  const G = (cx, cy) => '<g class="zb-gesicht"><circle cx="' + (cx - 2.5) + '" cy="' + cy + '" r="0.9"/><circle cx="' + (cx + 2.5) + '" cy="' + cy + '" r="0.9"/></g>' +
    L('M' + (cx - 1.2) + ' ' + (cy + 1.6) + ' q1.2 1.2 2.4 0', F.dunkel, 0.8);
  const tasse = (x, f) => P('M' + x + ' 79 h10 l-1.5 9 h-7 z', f) + L('M' + (x + 10) + ' 81 q4 2 -1 5');
  const schuh = (x, y) => P('M' + x + ' ' + y + ' q5 -8 9 -2 q9 1 9 5 h-18 z', F.rosa);

  const STUECKE = {
    haushalt: {
      Teppich: { z: 2, s: E(168, 222, 78, 14, '#ffdce6') + '<ellipse cx="168" cy="222" rx="62" ry="9" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3 4"/>' },
      Lichterkette: { z: 0, s: L('M8 12 q42 18 84 2 q40 16 78 0', '#c9b8d8') + C(28, 19, 3.5, F.rosa) + C(50, 22, 3.5, F.gelb) + C(72, 19, 3.5, F.gruen) + C(110, 20, 3.5, F.blau) + C(132, 22, 3.5, F.rosa) + C(154, 18, 3.5, F.gelb) },
      Kissen: { z: 1, s: R(92, 204, 26, 18, 7, F.flieder) + G(105, 212) },
      Vorhang: { z: 0, s: P('M13 30 h13 q-5 30 2 62 h-15 z', F.rosa) + P('M85 30 h-13 q5 30 -2 62 h15 z', F.rosa) + L('M9 30 H89', '#9a7f72', 2) },
      Tischdecke: { z: 1, s: P('M248 183 h44 v8 q-5.5 5 -11 0 q-5.5 5 -11 0 q-5.5 5 -11 0 q-5.5 5 -11 0 z', F.hell) },
      Decke: { z: 1, s: R(214, 178, 30, 11, 4, F.gruen) + L('M220 179 v9 M229 179 v9 M238 179 v9', '#ffffff', 1.5) },
      Wandbild: { z: 0, s: R(90, 36, 26, 22, 3, F.weiss) + P('M93 55 l8 -10 l5 6 l3 -3 l5 7 z', F.gruen) + C(109, 43, 2.5, F.gold) },
      Stehlampe: { z: 1, s: L('M328 112 V212', '#9a7f72', 2) + E(328, 213, 9, 3, F.holz) + P('M318 112 h20 l-5 -18 h-10 z', F.gelb) },
    },
    pflege: {
      Spiegel: { z: 0, s: E(147, 58, 14, 19, F.weiss) + E(147, 58, 10.5, 15.5, F.hell) + L('M142 52 q3 -4 7 -5', '#ffffff', 1.5) },
      Tiegelchen: { z: 0, s: R(125, 86, 9, 10, 3, F.rosa) + R(124, 84, 11, 3.5, 1.5, F.weiss) },
      Handtuch: { z: 0, s: R(152, 100, 14, 24, 2, F.hell) + L('M152 118 h14', '#ffffff', 2) },
      Seifenschale: { z: 0, s: R(137, 89, 9, 5, 2.5, F.gelb) + E(141.5, 94.5, 7, 2, F.weiss) },
      'Haarbürste': { z: 0, s: L('M154 96 v-5', '#9a7f72', 2) + E(154, 87, 4, 5.5, F.flieder) },
      Duftkerze: { z: 0, s: R(163, 86, 7, 10, 2, F.weiss) + E(166.5, 83, 1.6, 2.8, F.gold) },
      Schleife: { z: 0, s: P('M147 39 l-9 -5 v10 z', F.rosa) + P('M147 39 l9 -5 v10 z', F.rosa) + C(147, 39, 2.5, F.rosa) },
      Schminktisch: { z: 1, s: L('M101 172 v-6', '#9a7f72', 1.5) + C(101, 158, 9, F.hell) + R(84, 172, 34, 5, 2, F.holz) + L('M88 177 V200 M114 177 V200', '#9a7f72', 2) },
    },
    bewegung: {
      Yogamatte: { z: 4, s: R(236, 232, 58, 10, 5, F.gruen) + C(291, 237, 5, F.blatt) },
      Trinkflasche: { z: 4, s: R(300, 206, 8, 18, 3, F.blau) + R(302, 202, 4, 5, 1, F.weiss) },
      Farn: { z: 1, s: E(18, 174, 5, 13, F.blatt) + '<ellipse cx="10" cy="180" rx="4" ry="10" fill="#bfe3c8" transform="rotate(-25 10 180)"/><ellipse cx="26" cy="180" rx="4" ry="10" fill="#bfe3c8" transform="rotate(25 26 180)"/>' + R(10, 186, 16, 14, 4, F.ton) },
      Ball: { z: 4, s: C(222, 240, 8, F.gelb) + L('M215 238 q7 5 14 0') },
      Turnschuhe: { z: 4, s: schuh(262, 226) + schuh(270, 231) },
      Springseil: { z: 4, s: L('M170 245 q10 -11 20 0 t20 0', F.flieder, 2) + R(165, 242, 6, 4, 2, F.rosa) + R(209, 242, 6, 4, 2, F.rosa) },
      Monstera: { z: 1, s: L('M307 188 v-10') + E(307, 168, 9, 13, F.blatt) + '<ellipse cx="297" cy="176" rx="6" ry="10" fill="#bfe3c8" transform="rotate(-30 297 176)"/><ellipse cx="317" cy="176" rx="6" ry="10" fill="#bfe3c8" transform="rotate(30 317 176)"/>' + R(298, 186, 18, 16, 4, F.ton) },
      'Hängepflanze': { z: 0, s: L('M204 0 V18') + C(198, 30, 3.5, F.blatt) + C(210, 30, 3.5, F.blatt) + C(204, 34, 3.5, F.gruen) + C(200, 39, 3, F.blatt) + P('M197 18 h14 l-2 9 h-10 z', F.ton) },
    },
    lernen: {
      'Erstes Buch': { z: 0, s: R(236, 48, 7, 18, 1.5, F.flieder) },
      Notizheft: { z: 0, s: R(246, 52, 6, 14, 1, F.gelb) + L('M248 55 v8', '#ffffff', 1) },
      Stiftebecher: { z: 0, s: L('M259 55 l-1 -7 M262 55 v-8 M264 55 l2 -6', '#9a7f72', 1.4) + R(257, 55, 9, 11, 2, F.blau) },
      'Bücherstapel': { z: 0, s: R(234, 99, 22, 5, 1, F.rosa) + R(236, 94, 20, 5, 1, F.gruen) + R(235, 89, 22, 5, 1, F.flieder) },
      Leselampe: { z: 0, s: L('M295 64 q-2 -11 5 -13') + E(295, 65, 6, 1.8, F.holz) + P('M297 48 l10 2 l-3 6 l-8 -2 z', F.gelb) },
      Globus: { z: 0, s: L('M272 100 v3') + E(272, 103.5, 5, 1.4, F.holz) + C(272, 92, 8, F.blau) + E(270, 90, 3.2, 2.2, F.gruen) + E(275, 95, 2, 1.4, F.gruen) },
      Lesezeichen: { z: 0, s: P('M238 66 v10 l1.5 -2 l1.5 2 v-10 z', F.rosa) },
      'Bücherregal': { z: 0, s: '<rect x="226" y="40" width="98" height="70" rx="4" fill="none" stroke="#e3c9a8" stroke-width="3"/>' + R(290, 86, 6, 18, 1.5, F.gruen) + R(298, 90, 6, 14, 1.5, F.gelb) + R(306, 84, 6, 20, 1.5, F.rosa) },
    },
    haustiere: {
      Napf: { z: 4, s: P('M16 232 h24 l-3 10 h-18 z', F.blau) + E(28, 232, 9, 2.5, F.korb) },
      'Wollknäuel': { z: 4, s: C(54, 241, 7, F.rosa) + L('M49 238 q5 4 10 2 M50 244 q4 -3 9 -1') + L('M60 245 q6 4 10 -1', F.rosa, 1.4) },
      'Körbchen': { z: 1, s: E(72, 214, 20, 8, F.korb) + E(72, 212, 15, 5, '#fff8f3') },
      Spielmaus: { z: 4, s: L('M102 244 q5 2 7 -2') + E(96, 243, 6, 4, F.grau) + C(92.5, 240, 2, F.rosa) },
      Kratzbaum: { z: 1, s: R(48, 140, 7, 58, 2, F.korb) + R(38, 135, 27, 6, 3, F.flieder) + R(38, 196, 27, 5, 2, F.flieder) },
      Pfotenteppich: { z: 2, s: E(28, 242, 25, 6.5, F.gelb) + C(48, 242, 1.6, '#ffffff') + C(45, 239.5, 1, '#ffffff') + C(49, 239, 1, '#ffffff') },
      Federangel: { z: 4, s: L('M121 247 L131 224', '#9a7f72', 1.5) + '<ellipse cx="133" cy="219" rx="3" ry="6.5" fill="#bcd9f5" transform="rotate(20 133 219)"/>' },
      'Kuschelhöhle': { z: 1, s: P('M2 214 a16 19 0 0 1 32 0 z', F.flieder) + P('M10 214 a8 10 0 0 1 16 0 z', '#8f7fb5') },
    },
    kontakte: {
      Postkarte: { z: 0, s: '<g transform="rotate(-6 189 46)">' + R(180, 40, 18, 13, 1.5, F.weiss) + R(192, 42, 4, 4, 0.5, F.rosa) + L('M183 47 h7 M183 50 h5', '#c9b8d8', 1) + '</g>' },
      Teetasse: { z: 0, s: tasse(24, F.rosa) },
      Fotorahmen: { z: 0, s: R(204, 38, 14, 17, 2, F.gelb) + R(207, 41, 8, 11, 1, F.weiss) + C(211, 45.5, 2, F.rosa) },
      Briefpapier: { z: 0, s: R(182, 60, 14, 18, 1.5, F.weiss) + L('M185 65 h8 M185 69 h8 M185 73 h5', '#c9b8d8', 1) },
      'Zweite Tasse': { z: 0, s: tasse(40, F.blau) },
      Wimpelkette: { z: 0, s: L('M176 6 q78 22 160 0', '#c9b8d8') + P('M196 11 h10 l-5 9 z', F.rosa) + P('M222 15 h10 l-5 9 z', F.gelb) + P('M250 17 h10 l-5 9 z', F.gruen) + P('M278 16 h10 l-5 9 z', F.blau) + P('M304 13 h10 l-5 9 z', F.flieder) },
      'Gästekissen': { z: 4, s: R(138, 234, 24, 12, 6, F.gruen) + L('M144 240 h12', '#ffffff', 1.5) },
      Keksdose: { z: 1, s: R(273, 173, 10, 10, 2, F.gelb) + R(272, 170.5, 12, 3.5, 1.5, F.weiss) },
    },
    beziehung: {
      'Blümchen': { z: 1, s: L('M256.5 177 v-7', '#7fb98a') + C(256.5, 168, 3, F.rosa) + C(256.5, 168, 1, F.gelb) + R(254, 176, 5, 7, 1.5, F.weiss) },
      Herzkissen: { z: 4, s: P('M104 242 c-10 -7 -12 -13 -8 -17 a5 5 0 0 1 8 2 a5 5 0 0 1 8 -2 c4 4 2 10 -8 17 z', F.rosa) + G(104, 231) },
      Kerze: { z: 1, s: R(264, 174, 4, 9, 1, F.weiss) + E(266, 171, 1.5, 2.6, F.gold) },
      Fotostreifen: { z: 0, s: R(206, 60, 9, 26, 1, F.weiss) + R(207.5, 62, 6, 6, 0.5, F.rosa) + R(207.5, 70, 6, 6, 0.5, F.blau) + R(207.5, 78, 6, 6, 0.5, F.gelb) },
      Blumenvase: { z: 1, s: L('M288 171 l-4 -7 M288 171 l2 -10 M288 171 l6 -5', '#7fb98a') + C(284, 164, 3.5, F.rosa) + C(290, 160, 3.5, F.gelb) + C(294, 165, 3.5, F.flieder) + R(284, 170, 8, 13, 3, F.blau) },
      Plattenspieler: { z: 4, s: R(298, 228, 30, 14, 3, F.holz) + C(310, 235, 5, F.dunkel) + C(310, 235, 1.6, F.rosa) + L('M322 231 l-6 4') },
      Picknickkorb: { z: 4, s: L('M70 231 q8 -12 16 0', '#9a7f72', 1.5) + R(66, 230, 24, 14, 3, F.korb) + P('M66 230 h24 v4 h-24 z', F.rosa) },
      Lichterglas: { z: 0, s: R(310, 54, 9, 12, 3, F.weiss) + C(313, 58, 1.2, F.gold) + C(316.5, 61, 1.2, F.gold) + C(313, 63, 1.2, F.gold) },
    },
  };

  const BESONDERE = {
    Sternenlampe: { z: 0, s: L('M170 0 V16') + P('M170 14 l3 8 h8 l-6.5 5 l2.5 8 l-7 -5 l-7 5 l2.5 -8 l-6.5 -5 h8 z', '#ffe08a') + G(170, 25) },
    Mondkissen: { z: 4, s: P('M190 230 a10 10 0 1 0 12 12 a8 8 0 1 1 -12 -12 z', F.gelb) },
    Goldfischglas: { z: 0, s: C(279, 57, 8, F.hell) + P('M277 58 a3 2 0 1 1 5 0 a3 2 0 1 1 -5 0 M277 58 l-3 -2 v4 z', '#ffb48a') },
    Wolkenmobile: { z: 0, s: L('M124 0 V10') + E(118, 16, 6, 4.5, F.weiss) + E(126, 14, 7, 5.5, F.weiss) + E(133, 17, 5, 4, F.weiss) + L('M119 23 v4 M126 23 v6 M132 23 v4', F.blau, 1.5) },
    'Teekanne mit Gesicht': { z: 0, s: L('M73 78 q6 -1 6 -6') + E(66, 80, 8, 7, F.weiss) + R(62, 71, 8, 3, 1.5, F.rosa) + G(66, 79) },
    Regenbogenfenster: { z: 0, s: L('M30 84 a19 19 0 0 1 38 0', F.rosa, 3) + L('M34.5 84 a14.5 14.5 0 0 1 29 0', F.gelb, 3) + L('M39 84 a10 10 0 0 1 20 0', F.blau, 3) },
  };

  // Wie sich ein Stück bewegt: wiege (von unten), pendel (von oben), funkel, flacker, roll, schwimm, hauch.
  const BEWEGT = {
    Lichterkette: 'funkel', Lichterglas: 'funkel', Vorhang: 'hauch', Kissen: 'hauch', Stehlampe: 'flacker',
    Duftkerze: 'flacker', Kerze: 'flacker', Farn: 'wiege', Monstera: 'wiege', 'Blümchen': 'wiege', Blumenvase: 'wiege',
    Federangel: 'wiege', 'Hängepflanze': 'pendel', Wimpelkette: 'pendel', Sternenlampe: 'pendel', Wolkenmobile: 'pendel',
    Ball: 'roll', 'Wollknäuel': 'roll', Spielmaus: 'roll', Goldfischglas: 'schwimm', Herzkissen: 'hauch',
    'Teekanne mit Gesicht': 'hauch', Plattenspieler: 'dreh', Globus: 'hauch', Springseil: 'hauch',
  };

  // Am Fenster zieht eine Wolke vorbei; bei viel Energie scheint die Sonne.
  const WOLKE = '<g class="zb-wolke"><ellipse cx="30" cy="52" rx="10" ry="5.5" fill="#ffffff"/><ellipse cx="39" cy="48" rx="9" ry="7" fill="#ffffff"/><ellipse cx="47" cy="52" rx="8" ry="5" fill="#ffffff"/></g>';
  const SONNE = '<g class="zb-sonne"><circle cx="49" cy="61" r="11" fill="#ffd27a"/>' +
    L('M49 44 v-5 M49 83 v-5 M32 61 h-5 M71 61 h-5 M37 49 l-3.5 -3.5 M61 73 l3.5 3.5 M37 73 l-3.5 3.5 M61 49 l3.5 -3.5', '#ffd27a', 2.6) + '</g>';

  const einrichtung = viel =>
    '<rect class="zb-wand" width="340" height="250" rx="22"/>' +
    '<path class="zb-boden" d="M0 170 h340 v58 a22 22 0 0 1 -22 22 h-296 a22 22 0 0 1 -22 -22 z"/>' +
    '<clipPath id="zb-fensterform"><rect x="20" y="34" width="58" height="54" rx="9"/></clipPath>' +
    '<rect class="zb-fenster" x="20" y="34" width="58" height="54" rx="9"/>' +
    '<g clip-path="url(#zb-fensterform)">' + (viel ? SONNE : WOLKE) + '</g>' +
    '<path class="zb-sprosse" d="M49 34 v54 M20 61 h58"/>' +
    '<rect class="zb-holz" x="15" y="88" width="68" height="4" rx="2"/>' +
    '<rect class="zb-holz" x="122" y="96" width="52" height="4" rx="2"/>' +
    '<rect class="zb-holz" x="230" y="66" width="90" height="4" rx="2"/><rect class="zb-holz" x="230" y="104" width="90" height="4" rx="2"/>' +
    '<rect class="zb-holz" x="267" y="188" width="6" height="24" rx="2"/><ellipse class="zb-holz" cx="270" cy="213" rx="12" ry="3"/><ellipse class="zb-holz" cx="270" cy="186" rx="24" ry="6"/>';

  function bild(name, bereich, besonders) {
    return besonders ? BESONDERE[name] : (STUECKE[bereich] || {})[name];
  }

  // zimmer: Einträge aus dem Zustand; zustand: 'wach' | 'klein' | 'viel' | 'freut'; neu: Name des Stücks, das gerade dazukam;
  // wesen: id der Art
  function svg(zimmer, zustand, neu, wesen) {
    const teile = [];
    zimmer.forEach((z, i) => {
      const b = bild(z.stueck, z.bereich, z.besonders);
      if (!b) return;
      const s = BEWEGT[z.stueck] ? '<g class="zb-' + BEWEGT[z.stueck] + '">' + b.s + '</g>' : b.s;
      teile.push({ z: b.z, i, s: z.stueck === neu ? '<g class="zb-neu">' + s + '</g>' : s });
    });
    teile.sort((a, b) => a.z - b.z || a.i - b.i);
    const hinten = teile.filter(t => t.z < 3).map(t => t.s).join('');
    const vorn = teile.filter(t => t.z >= 3).map(t => t.s).join('');
    const liegt = zustand === 'klein';
    const wer = wesenbild.art(wesen).satz;
    const viel = zustand === 'viel';
    const tut = liegt ? ' liegt eingekuschelt im Zimmer.' : viel ? ' hüpft voller Energie durchs Zimmer.' : ' sitzt im Zimmer und schaut dich an.';
    // Wach läuft das Wesen im Zimmer hin und her; eingekuschelt und beim Freuen bleibt es an seinem Platz.
    const laeuft = zustand === 'wach' || viel;
    const klassen = 'wesen' + (zustand === 'freut' ? ' freut' : '') + (viel ? ' viel' : '');
    const text = wer + tut +
      (zimmer.length ? ' Im Zimmer: ' + zimmer.map(z => z.stueck).join(', ') + '.' : '');
    return '<svg class="zimmerbild' + (viel ? ' zb-viel' : '') + '" viewBox="0 0 340 250" role="img" aria-label="' + text.replace(/"/g, '') + '">' +
      einrichtung(viel) + '<g class="zb-stuecke">' + hinten + '</g>' +
      '<g' + (laeuft ? ' class="zb-lauf"' : '') + '><g transform="translate(125 138) scale(0.72)"><g class="' + klassen + '">' + wesenbild.innen(wesen, zustand) + '</g></g></g>' +
      '<g class="zb-stuecke">' + vorn + '</g></svg>';
  }

  // Die Energie bestimmt, wie das Wesen gerade ist.
  function stimmung(state) {
    return { klein: 'klein', gross: 'viel' }[state.form.stufe] || 'wach';
  }

  function element(state, zustand, neu) {
    const el = document.createElement('div');
    el.className = 'szene';
    el.innerHTML = svg(state.zimmer, zustand || stimmung(state), neu, state.wesen);
    return el;
  }

  const api = { svg, element, stimmung, STUECKE, BESONDERE };
  root.AH = root.AH || {};
  root.AH.zimmerbild = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
