# Roadmap – MoO Remake (Browser 4X)

Ziel: Ein im Browser lauffähiges 4X-Strategiespiel, das sich mechanisch eng an
Master of Orion (1993) anlehnt. Grundlage sind die Analysen in
[`design-analyse.docx`](design-analyse.docx) (Gesamtübersicht) und
[`techtree-analyse.docx`](techtree-analyse.docx) (vollständiger Technologiebaum
mit Kosten-/Durchbruchsformeln, siehe `js/data/techTree.js`). Umfang für den ersten
spielbaren Prototyp: **Standard 4X-Kern** – vollständige Partie gegen KI,
gewinnbar durch Elimination oder Punktzahl. Diplomatie, Spionage,
Bodeninvasion, Galaktischer Rat und Orion-Wächter folgen erst nach dem
Prototyp in späteren Releases.

Tech-Stack: reines HTML5 / CSS / JavaScript (ES-Module), Canvas-Rendering,
kein Build-Tool, keine Server-Komponente. Speicherstand liegt im
`localStorage` des Browsers. Kein Framework-Unterbau, um Iterationsgeschwindigkeit
hochzuhalten und Node/npm-Abhängigkeiten zu vermeiden.

## Releases bis zum Prototyp

- **v0.1 – Projekt-Setup & Galaxie-Karte**
  Grundgerüst (HTML/CSS/JS, Dev-Server), prozedurale Galaxie-Generierung
  (Sternensysteme, 1–8 Planeten pro System, Größe/Habitabilität/Reichtum je
  StrategyWiki-Tabelle), Canvas-Rendering mit Zoom/Pan, Systeminfo-Panel.

- **v0.2 – Kolonisierung & Wirtschaft**
  Heimatwelt + Kolonieschiff/Scouts als Startbedingung, Kolonisierung neuer
  Welten, 5 Produktions-Slider (Ship/Def/Ind/Eco/Tech), Bevölkerungs-Glockenkurve,
  Fabriken/Robotic-Controls-Skalierung, Verschmutzung, Speichern/Laden
  (localStorage).

- **v0.3 – Technologiebaum & Miniaturisierung**
  6 Forschungsdisziplinen, quadratische Kostenfunktion, Entdeckungschance-Formel,
  50%-Zufallsauswahl der verfügbaren Techs pro Partie, Miniaturisierung
  (Level 51–99) für Modulgröße/-kosten.

- **v0.4 – Schiffsdesign & Logistik**
  4 Rumpfgrößen, Design-Editor, hartes 6-Design-Limit, Stack-Splitting als
  offizielles Kampf-Feature (statt Design-Cloning-Exploit).

- **v0.5 – Taktischer Weltraumkampf**
  Rundenbasiertes Grid-Kampfsystem, Sigmoid-Trefferformel, Schadensarten
  (Beam-Distanzabfall, Raketen/Torpedos mit PD-Abwehr), Schild-Stacking,
  Initiative durch Antrieb/Manövrierfähigkeit.

- **v0.6 – KI-Fraktionen & einfache Diplomatie**
  10 spielbare/KI-Fraktionen mit vollem Regelbruch-Set (Alkari … Silicoids),
  6 KI-Persönlichkeiten × 5 Ziele als Verhaltensmatrix, einfache Diplomatie
  (Krieg/Frieden/Verträge, kein Rat, keine Spionage).

→ **Prototyp erreicht**: vollständige 4X-Partie in einer generierten Galaxie
gegen KI-Gegner, Sieg durch Elimination oder Punktzahl-Vergleich am Rundenlimit.

## Nach dem Prototyp (spätere Releases, nicht Teil des Prototyp-Scopes)

- v0.7 Bodeninvasion (Infanterie-Formel, Eroberung/Tech-Diebstahl)
- v0.8 Spionage & Framing
- v0.9 Galaktischer Rat & Diplomatie-Sieg
- v0.10 Orion-System & Guardian, galaktische Zufallsereignisse
- v0.11 Highscore/Hall-of-Fame-Formel

## Grafik-Pipeline

Rassen-Portraits, Schiffs-Sprites und Planeten-Icons werden über ChatGPT
(Bildgenerierung, via Claude-in-Chrome-Erweiterung im eingeloggten Account)
erzeugt und unter `assets/images/` abgelegt. Downloads werden in Batches je
Release mit dem Nutzer kurz bestätigt.
