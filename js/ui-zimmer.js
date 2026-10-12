// Zimmer-Bildschirm: das Zimmerbild groß und darunter, was schon alles da ist.
(function (root) {
  const AH = root.AH;
  const app = AH.app;
  const h = app.h;

  function liste(titel, farbe, namen) {
    return h('section', { class: 'regal' + (farbe ? ' b-' + farbe : ' regal-besonders') },
      h('h2', { class: 'regal-titel' }, titel),
      h('p', { class: 'regal-namen' }, namen.join(' · ')));
  }

  app.bildschirme.zimmer = {
    zeichne(el) {
      const s = app.state;
      const klein = s.form.stufe === 'klein';
      let satz = 'Mit jeder erledigten Sache kommt hier etwas dazu.';
      if (s.heute.stuecke >= AH.zimmer.GRENZE) satz = 'Für heute ist es schön hier.';
      else if (klein) satz = 'Heute wird gekuschelt. Kleine Schritte zählen genauso.';
      else if (s.zimmer.length) satz = 'Schön, dass du da bist.';

      el.append(h('h1', { class: 'titel' }, 'Dein Zimmer'), AH.zimmerbild.element(s), h('p', { class: 'leise' }, satz),
        AH.sticker.wesenwahl('Wer wohnt hier?'));

      const besondere = s.zimmer.filter(z => z.besonders).map(z => z.stueck);
      if (besondere.length) el.append(liste('Besonderes', null, besondere));
      for (const b of AH.pakete.BEREICHE) {
        const namen = s.zimmer.filter(z => !z.besonders && z.bereich === b.id).map(z => z.stueck);
        if (namen.length) el.append(liste(b.name, b.farbe, namen));
      }
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
