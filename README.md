# MoO Remake

**[▶ Direkt im Browser spielen](https://popesick.github.io/moo-remake/)**

Ein im Browser lauffähiges 4X-Strategiespiel, mechanisch angelehnt an
*Master of Orion* (1993). Vollständige Partie (v0.1–v0.12): Galaxie
erkunden, kolonisieren, erforschen, Schiffe designen, gegen KI-Imperien
Krieg führen, Frieden schließen oder Handel treiben, Planeten erobern oder
mit Biowaffen angreifen, spionieren, den Galaktischen Rat für einen
diplomatischen Sieg nutzen, den Guardian of Orion herausfordern und mit
Konkurrenz-KIs mit eigenem diplomatischem Gedächtnis und
Zielbewertungs-Algorithmus antreten. Details zur Spielmechanik-Analyse und
zum Umsetzungsplan stehen in
[`docs/design-analyse.docx`](docs/design-analyse.docx),
[`docs/techtree-analyse.docx`](docs/techtree-analyse.docx),
[`docs/shipklassen-analyse.docx`](docs/shipklassen-analyse.docx),
[`docs/ki-verhalten-analyse.docx`](docs/ki-verhalten-analyse.docx) und
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Ausführen

Läuft direkt über GitHub Pages: https://popesick.github.io/moo-remake/

Lokal ist kein Build-Schritt nötig – ein beliebiger statischer Webserver reicht:

```bash
python3 -m http.server 8000
```

Danach im Browser `http://localhost:8000` öffnen.

## Stack

- Reines HTML5 / CSS / JavaScript (ES-Module), Canvas-Rendering
- Kein Framework, kein Bundler, keine Server-Komponente
- Spielstand liegt im `localStorage` des Browsers
