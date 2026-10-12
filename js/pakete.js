// Inhalte: Bereiche und der Vorrat an Zimmerstücken.
(function (root) {
  const BEREICHE = [
    { id: 'haushalt', name: 'Haushalt', farbe: 'gelb' },
    { id: 'pflege', name: 'Pflege', farbe: 'rosa' },
    { id: 'bewegung', name: 'Bewegung', farbe: 'gruen' },
    { id: 'lernen', name: 'Lernen', farbe: 'flieder' },
    { id: 'haustiere', name: 'Haustiere', farbe: 'mint' },
    { id: 'kontakte', name: 'Kontakte', farbe: 'blau' },
    { id: 'beziehung', name: 'Beziehung', farbe: 'pfirsich' },
    // ohne eigene Stücke: Erledigtes von hier füllt den Bereich, in dem am meisten fehlt
    { id: 'erledigungen', name: 'Erledigungen', farbe: 'sand' },
  ];

  const STUECKE = {
    haushalt: ['Teppich', 'Lichterkette', 'Kissen', 'Vorhang', 'Tischdecke', 'Decke', 'Wandbild', 'Stehlampe'],
    pflege: ['Spiegel', 'Tiegelchen', 'Handtuch', 'Seifenschale', 'Haarbürste', 'Duftkerze', 'Schleife', 'Schminktisch'],
    bewegung: ['Yogamatte', 'Trinkflasche', 'Farn', 'Ball', 'Turnschuhe', 'Springseil', 'Monstera', 'Hängepflanze'],
    lernen: ['Erstes Buch', 'Notizheft', 'Stiftebecher', 'Bücherstapel', 'Leselampe', 'Globus', 'Lesezeichen', 'Bücherregal'],
    haustiere: ['Napf', 'Wollknäuel', 'Körbchen', 'Spielmaus', 'Kratzbaum', 'Pfotenteppich', 'Federangel', 'Kuschelhöhle'],
    kontakte: ['Postkarte', 'Teetasse', 'Fotorahmen', 'Briefpapier', 'Zweite Tasse', 'Wimpelkette', 'Gästekissen', 'Keksdose'],
    beziehung: ['Blümchen', 'Herzkissen', 'Kerze', 'Fotostreifen', 'Blumenvase', 'Plattenspieler', 'Picknickkorb', 'Lichterglas'],
  };

  const BESONDERE = ['Sternenlampe', 'Mondkissen', 'Goldfischglas', 'Wolkenmobile', 'Teekanne mit Gesicht', 'Regenbogenfenster'];

  const api = { BEREICHE, STUECKE, BESONDERE };
  root.AH = root.AH || {};
  root.AH.pakete = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
