# Roadmap – MoO Remake (Browser 4X)

Ziel: Ein im Browser lauffähiges 4X-Strategiespiel, das sich mechanisch eng an
Master of Orion (1993) anlehnt. Grundlage sind die Analysen in
[`design-analyse.docx`](design-analyse.docx) (Gesamtübersicht),
[`techtree-analyse.docx`](techtree-analyse.docx) (vollständiger Technologiebaum
mit Kosten-/Durchbruchsformeln, siehe `js/data/techTree.js`) und
[`shipklassen-analyse.docx`](shipklassen-analyse.docx) (Rumpf-HP/Ausweichboni,
siehe `js/data/hulls.js`). Umfang für den ersten spielbaren Prototyp:
**Standard 4X-Kern** – vollständige Partie gegen KI, gewinnbar durch
Elimination oder Punktzahl. Diplomatie, Spionage, Bodeninvasion,
Galaktischer Rat und Orion-Wächter folgen erst nach dem Prototyp in
späteren Releases.

Tech-Stack: reines HTML5 / CSS / JavaScript (ES-Module), Canvas-Rendering,
kein Build-Tool, keine Server-Komponente. Speicherstand liegt im
`localStorage` des Browsers. Kein Framework-Unterbau, um Iterationsgeschwindigkeit
hochzuhalten und Node/npm-Abhängigkeiten zu vermeiden.

## ✅ Prototyp erreicht (v0.1 – v0.6)

- **v0.1 – Projekt-Setup & Galaxie-Karte**
  Prozedurale Galaxie-Generierung (Sternensysteme, 1–8 Planeten,
  Größe/Habitabilität/Reichtum), Canvas-Rendering mit Zoom/Pan,
  seed-basierte Reproduzierbarkeit, Speichern/Laden.

- **v0.2 – Kolonisierung & Wirtschaft**
  5 Produktions-Slider (Ship/Def/Ind/Eco/Tech), Bevölkerungs-Glockenkurve
  (Scheitel bei 50 % Kapazität), Fabrik-/Robotic-Controls-Skalierung,
  Verschmutzung, Kolonisierung über Ship-Slider-finanzierte Kolonieschiffe.

- **v0.3 – Technologiebaum & Miniaturisierung**
  Vollständiger Techbaum (~160 Technologien, 6 Disziplinen, 10 Rungs) aus
  `techtree-analyse.docx`, quadratische Kostenfunktion, Rung-Freischaltung
  mit Auswahl unter mehreren Kandidaten, korrigierte Durchbruchsformel,
  rassenspezifische Forschungskosten-Faktoren. *Vereinfacht:* Miniaturisierung
  (Level 51-99) ist strukturell vorbereitet, aber ohne konkrete
  Advanced-Technologies-Inhalte – folgt bei Bedarf als Politur.

- **v0.4 – Schiffsdesign & Logistik**
  4 Rumpfgrößen (HP/Ausweichboni aus `shipklassen-analyse.docx`),
  Design-Editor mit Panzerung/Schild/Antrieb/Waffen, hartes 6-Design-Limit,
  Flotten mit Position/Bewegung (Parsec/Zug aus Antriebstech),
  Stack-Splitting als Flottenmanagement-Aktion.

- **v0.5 – Taktischer Weltraumkampf**
  Sigmoid-Trefferformel, Schild-Subtraktion (inkl. Halbierung/Ignorieren),
  Initiative durch Kampfgeschwindigkeit, Battle-Computer-/ECM-Boni.
  *Vereinfacht:* automatische Auflösung mit Kampfbericht-Log statt
  interaktivem Grid; kein Beam-Distanzabfall (abstrakter Nahbereich).

- **v0.6 – KI-Fraktionen & einfache Diplomatie**
  Alle 10 Rassen-Regelbrüche (Produktions-/Forschungs-/Wachstumsboni,
  Robotic-Controls-/Angriffs-/Manöverboni, Silicoiden-Sonderregeln),
  KI-Verhaltensmatrix (6 Persönlichkeiten × 5 Ziele) steuert Slider,
  Forschungsfokus, Kolonisierung und Kriegsneigung je KI-Imperium,
  Krieg/Frieden-Diplomatie (Kampf nur im Kriegszustand), Sieg durch
  Elimination oder Punktzahl-Vergleich am Rundenlimit (150 Runden).
  *Vereinfacht:* keine Vertragsarten über Krieg/Frieden hinaus, keine
  Kill-Zuordnung für den Eliminations-Bonus in der Punkteformel.

→ Ergebnis: vollständige 4X-Partie in einer generierten Galaxie gegen
KI-Gegner mit eigener Wirtschafts-, Forschungs- und Diplomatiepolitik,
spielbar von der Kolonisierung bis zum Sieg.

## Nach dem Prototyp

- **v0.7 – Bodeninvasion**
  Infanterie-Formel aus `design-analyse.docx` (Panzerungs-/Waffen-Techstufe,
  Exoskelett-/Powered-Armor- und Personal-Shield-Ketten als Ground-Boni,
  Bulrathi-Rassenbonus), automatische Invasionsauflösung mit Tech-Diebstahl
  bei Erfolg, Fabriken bleiben beim Eroberer erhalten. Biowaffen (Death
  Spores/Doom Virus/Bio Terminator, Antidote bereits aus v0.3) töten
  Bevölkerung direkt statt Infrastruktur, mit diplomatischem Fallout
  (Kriegs-Chance bei allen anderen Imperien). KI führt Invasionen bei
  gesicherter Umlaufbahn automatisch durch. *Vereinfacht:* keine dedizierten
  Transporter-Schiffe (Transportkapazität = Flottengröße × 5), Truppen
  entstammen automatisch dem bevölkerungsreichsten eigenen Planeten statt
  einer frei wählbaren Quelle, KI setzt keine Biowaffen ein.

- **v0.8 – Spionage & Framing**
  Spionagepunkte (SP) werden jede Runde aus einem einstellbaren Anteil der
  Gesamtproduktion generiert (Standard 10 %, bis 30 % einstellbar) und in
  einem Vorrat pro Imperium gesammelt. Drei Aktionen mit festen SP-Kosten:
  Technologie stehlen (fremde, noch nicht erforschte Technologie kopieren),
  Industrielle Sabotage (Fabriken auf dem größten gegnerischen Planeten
  zerstören) und Rebellion anzetteln (Fabriken und Bevölkerung durch
  Unruhen reduzieren). Missionserfolg und Entdeckung werden getrennt
  ausgewürfelt; bei Entdeckung kann wahlweise ein zufälliges drittes
  Imperium beschuldigt werden (Framing) – gelingt es, erklärt der
  Verteidiger dem Unschuldigen den Krieg statt dem wahren Angreifer.
  Darloks erhalten dabei eine deutlich höhere Framing-Erfolgschance und
  eine geringere Entdeckungswahrscheinlichkeit. Ein einfacher
  Gegenspionage-Dämpfer senkt die gegnerische Missionserfolgschance mit
  steigendem eigenen SP-Vorrat. KI-Imperien mit ausreichender Kriegsneigung
  spionieren gelegentlich zufällige Rivalen aus, nutzen aber kein Framing.
  *Vereinfacht:* kein Galaktischer Rat oder dedizierter
  Gegenspionage-Dienst, Framing-Ziel ist immer zufällig statt strategisch
  gewählt, KI verzichtet auf Framing, Spionage-Budget wirkt nur auf den
  SP-Vorrat und nicht zusätzlich auf die reguläre Wirtschaftsproduktion.

## Weitere Post-Prototyp-Releases

- v0.9 Galaktischer Rat, Handelsabkommen/Verträge & Diplomatie-Sieg
- v0.10 Orion-System & Guardian, Miniaturisierungs-Inhalte, galaktische Zufallsereignisse
- v0.11 Highscore/Hall-of-Fame-Formel (inkl. Guardian-/Kill-Boni)
- Polish-Kandidaten: interaktives Kampf-Grid statt Auto-Resolve, KI-Redesign
  neuer Schiffsklassen im Spielverlauf, Beam-Distanzabfall

## Grafik-Pipeline

Rassen-Portraits und Planeten-Umwelt-Icons wurden über ChatGPT
(Bildgenerierung, via Claude-in-Chrome-Erweiterung im eingeloggten Account)
erzeugt und liegen unter `assets/images/`. Schiffs-Sprites folgen bei
Bedarf nach demselben Verfahren.
