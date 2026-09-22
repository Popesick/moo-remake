# MoO Remake

Ein im Browser lauffähiges 4X-Strategiespiel, mechanisch angelehnt an
*Master of Orion* (1993). Spielbarer Prototyp (v0.1–v0.6): Galaxie erkunden,
kolonisieren, erforschen, Schiffe designen und gegen KI-Imperien bestehen –
mit eigener Wirtschafts-, Forschungs- und Diplomatiepolitik pro KI. Details
zur Spielmechanik-Analyse und zum Umsetzungsplan stehen in
[`docs/design-analyse.docx`](docs/design-analyse.docx),
[`docs/techtree-analyse.docx`](docs/techtree-analyse.docx),
[`docs/shipklassen-analyse.docx`](docs/shipklassen-analyse.docx) und
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Ausführen

Kein Build-Schritt nötig – ein beliebiger statischer Webserver reicht:

```bash
python3 -m http.server 8000
```

Danach im Browser `http://localhost:8000` öffnen.

## Stack

- Reines HTML5 / CSS / JavaScript (ES-Module), Canvas-Rendering
- Kein Framework, kein Bundler, keine Server-Komponente
- Spielstand liegt im `localStorage` des Browsers
