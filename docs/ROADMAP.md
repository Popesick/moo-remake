# Roadmap – MoO Remake (Browser 4X)

Ziel: Ein im Browser lauffähiges 4X-Strategiespiel, das sich mechanisch eng an
Master of Orion (1993) anlehnt. Grundlage sind die Analysen in
[`design-analyse.docx`](design-analyse.docx) (Gesamtübersicht),
[`techtree-analyse.docx`](techtree-analyse.docx) (vollständiger Technologiebaum
mit Kosten-/Durchbruchsformeln, siehe `js/data/techTree.js`) und
[`shipklassen-analyse.docx`](shipklassen-analyse.docx) (Rumpf-HP/Ausweichboni,
siehe `js/data/hulls.js`) und [`ki-verhalten-analyse.docx`](ki-verhalten-analyse.docx)
(KI-Diplomatie-Gedächtnis, Zielbewertungsformel, Orion-Sperr-Timer,
Verteidigungspriorisierung, siehe `js/ai.js`, ROADMAP v0.12). Umfang für den ersten spielbaren Prototyp:
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

- **v0.9 – Galaktischer Rat, Handelsabkommen & Diplomatie-Sieg**
  Handelsabkommen: der Spieler kann jedem befriedeten Imperium ein Abkommen
  vorschlagen, das die KI abhängig von Persönlichkeit und Ziel (xenophobe
  Imperien lehnen grundsätzlich ab, vertragstreue/diplomatische eher an)
  annimmt oder ablehnt. Aktive Abkommen laufen zunächst mehrere Runden mit
  leichtem Verlust an und reifen danach linear zu einem dauerhaften
  BC-Bonus für beide Partner heran (Obergrenze 40 BC/Runde), der anteilig
  in Forschung, Verteidigung und Kolonieschiff-Fortschritt einfließt.
  Kriegserklärung beendet ein bestehendes Abkommen automatisch.
  Galaktischer Rat: sobald 2/3 aller Planeten der Galaxie kolonisiert sind,
  tritt der Rat fortan in festen Intervallen zusammen. Die beiden Imperien
  mit der höchsten Gesamtbevölkerung werden Kandidaten; alle übrigen
  Imperien stimmen bevölkerungsgewichtet ab (KI-Stimmen richten sich nach
  Kriegs-/Friedensstatus zu den Kandidaten, sonst zufällig). Erreicht ein
  Kandidat 2/3 der Stimmen, gewinnt er die Partie durch diplomatische
  Vereinigung. Ist der Spieler nicht selbst Kandidat, muss er in einem
  eigenen Dialog für einen der beiden stimmen: lehnt er die Wahl eines
  KI-Kandidaten ab, der trotzdem die Mehrheit erreicht, erklären ihm
  stattdessen alle übrigen Imperien simultan den Krieg ("Final War",
  Soft-Enrage-Timer fürs Endgame) statt eines sofortigen Spielendes.
  *Vereinfacht:* Rat-Intervall in Spielrunden (10) statt 25 Jahren, da die
  Partie auf 150 Runden begrenzt ist; KI schlägt dem Spieler selbst keine
  Handelsabkommen vor (nur der Spieler kann initiieren); AI-AI-Handelsabkommen
  entstehen nicht automatisch; kein Bündnis-/Nichtangriffspakt-System über
  Krieg/Frieden/Handel hinaus; KI-Ratsstimmen berücksichtigen nur den
  binären Kriegsstatus, keine feinere Beziehungsskala.

- **v0.9.1 – UI-Fixes & Flottenreichweite**
  Zwei gemeldete UI-Bugs behoben: Die Seitenleiste wurde bei
  `devicePixelRatio > 1` (z.B. Retina-Displays) beim Rendern der Karte aus
  dem sichtbaren Bereich gedrängt, da der Canvas als Flex-Kind ohne
  `min-width: 0` seine (durch `canvas.width = clientWidth * devicePixelRatio`
  gesetzte) Attribut-Breite als Flexbox-Mindestbreite nutzte – behoben durch
  `min-width: 0` in `css/style.css`. Außerdem gab es keine Möglichkeit, zum
  eigenen Heimatsystem zurückzuspringen, nachdem man die Karte verschoben
  hat – neuer Topbar-Button "Heimatsystem" zentriert die Kamera darauf und
  wählt es in der Seitenleiste aus.

  Zusätzlich: Flottenreichweite (Fuel-Cell-Mechanik aus MoO2, auf Wunsch
  für dieses Remake übernommen). Jedes Ziel außerhalb eines Kreisradius um
  die eigenen Kolonien ist ohne ausreichende Treibstoffzellen-Forschung
  (Propulsion-Techs, bereits seit v0.3 im Baum vorbereitet) nicht
  erreichbar – weder für Kampfflotten noch für Kolonieschiffe. Reisen
  zwischen zwei eigenen Systemen bleibt davon unabhängig immer uneingeschränkt
  möglich. Während der Zielwahl einer Flottenbewegung zeigt die Karte die
  aktuelle Reichweite als transluzenten Kreis um jede eigene Kolonie.
  *Vereinfacht:* kein diskreter Sternenstraßen-Graph, sondern ein reiner
  Radius-Check (wie im Original); die MoO2-Parsec-Werte (4-10) wurden
  gegenüber der Vorlage hochskaliert (Basis 8, bis 36 vor der finalen
  unbegrenzten Reichweite durch Thorium Cells), da sie empirisch zur
  tatsächlichen Systemdichte dieses Remakes passen müssen, statt Spieler an
  ihrem Heimatsystem festzunageln.

- **v0.10 – Orion-System & Guardian, Miniaturisierung, galaktische Zufallsereignisse**
  Miniaturisierung: Komponentenkosten und -platzbedarf im Schiffsdesign
  sinken jetzt tatsächlich, je weiter das kumulierte Forschungsniveau einer
  Disziplin (`effectiveTechLevel`, seit v0.3 berechnet, aber bis jetzt
  wirkungslos) über das Level einer Komponente hinausgeht – bis zu -50 %
  Kosten und -66 % Platz, exakt wie in der Quelle beziffert. Ein
  Hochskalieren um 40 Levels erreicht die volle Miniaturisierung.

  Orion-System & Guardian: ein zufälliges Nicht-Heimatsystem wird zur
  Orion-Welt (Artefakt, Ultra-Rich, Huge) und vom Guardian of Orion bewacht
  (10.000 HP, Schild Klasse 9, Death Ray 200-1000 Schaden) – auf der Karte
  violett markiert. Kolonisierung ist erst nach seiner Zerstörung möglich;
  jede an seinem System stationierte Flotte kämpft automatisch gegen ihn
  (kooperativ, falls mehrere Imperien gleichzeitig anwesend sind). Der
  Sieger erhält den Death Ray dauerhaft als Schiffsdesign-Waffe sowie einen
  pauschalen Miniaturisierungssprung (+15 effektive Levels) über alle
  Disziplinen – als Abstraktion der "vier zufälligen Advanced
  Technologies" aus dem Original, da dieses Remake keine diskreten
  Advanced-Technologies-Level 51-99 modelliert.

  Galaktische Zufallsereignisse: ab Runde 15 pro Runde eine geringe Chance
  auf einen Kometeneinschlag (Bevölkerungs-/Fabrikverlust auf einem
  zufälligen Planeten), eine Supernova (dasselbe für ein ganzes System) oder
  ein Weltraum-Monster (Pulsarwaffe 1-1000 Schaden, kämpft gegen eine
  verteidigende Flotte oder bombardiert sonst den Planeten direkt) – dieselbe
  Kampf-Infrastruktur wie der Guardian, nur mit schwächeren Werten.
  *Vereinfacht:* Space Amoeba und Space Crystal sind zu einem generischen
  Monster zusammengefasst; kein Kometen-Abschuss durch Verteidigungsflotten
  (Schaden ist unausweichlich); KI greift den Guardian nicht proaktiv an;
  genau ein Guardian-/Monster-Gefecht pro Runde ohne persistenten Schaden
  über mehrere Runden hinweg.

- **v0.11 – Highscore/Hall-of-Fame-Formel (inkl. Guardian-/Kill-Boni)**
  Die Score-Formel (Basiswert nach Galaxiegröße, minus Runden, plus
  Kolonisten, plus 3 pro Techstufe) war seit dem Prototyp vollständig, bis
  auf die beiden Boni, die eine echte Kill-Zuordnung bzw. das Orion-System
  voraussetzten: +50 pro eliminierter Konkurrenz-Fraktion und +100 für die
  Zerstörung des Guardian of Orion. Beides ist jetzt ergänzt. Kill-Zuordnung
  läuft über einen neuen `galaxy.lastDamagedBy`-Verlauf, den Flottengefechte
  (siegreiches Imperium), Invasionen und tödliche Bioangriffe aktualisieren;
  wird ein Imperium eliminiert, wird die Elimination dem zuletzt
  eingetragenen Angreifer gutgeschrieben. Der Guardian-Bonus greift über
  `galaxy.orion.defeatedByEmpireId` (siehe v0.10). Beide Boni erscheinen im
  Spielende-Dialog als eigene Zeile pro Imperium.

  Zusätzlich: eine persistente Hall of Fame (`localStorage`, unabhängig vom
  Spielstand) protokolliert das Siegerimperium jeder abgeschlossenen Partie
  (Score, Rundenanzahl, Galaxiegröße, Sieggrund, Datum) und zeigt die besten
  20 sortiert nach Punktzahl über einen neuen Topbar-Button. *Vereinfacht:*
  Elimination wird stets dem letzten Angreifer zugeschrieben (keine anteilige
  Zuordnung bei mehreren Beteiligten); die Hall of Fame speichert nur das
  jeweilige Siegerimperium, nicht die volle Abschlusstabelle aller Partien.

- **v0.12 – KI-Verhalten-Politur**
  Umsetzung von `MoO KI Verhalten.docx` (vom Nutzer bereitgestelltes
  Anforderungsdokument zum originalen KI-Verhalten):
  - **Diplomatisches Gedächtnis**: ein Groll-Wert pro Imperiumspaar steigt
    bei unprovozierter Kriegserklärung (+40) und einseitig gekündigten
    Handelsabkommen (+15) und bleibt über Statuswechsel hinweg bestehen. Er
    senkt danach dauerhaft die KI-Bereitschaft, Frieden zu schließen oder
    Handelsabkommen anzunehmen – zusätzlich zu den bestehenden
    Persönlichkeits-/Kriegsneigungsfaktoren.
  - **Zielbewertungs-Algorithmus**: Kolonisierungs- und Angriffsziele der KI
    werden jetzt nach `PlanetValue = PlanetSize / 1.045^TimeToDevelop +
    Spezialwert` bewertet (Spezialwert nach Biom-Stufe 0–6, Rich/Artefakt
    ×2, Ultra-Rich ×3, exakt wie im Quelldokument beziffert) statt nach
    reiner Distanz – ersetzt sowohl das "nächstbeste Ziel" bei der
    Kolonisierung als auch das bisherige "immer die gegnerische Heimatwelt"
    bei Angriffen. Bewusst ohne Berücksichtigung der gegnerischen
    Verteidigungsstärke, wie in der Quelle beschrieben. *Vereinfacht:* keine
    Raketenbasen-Abschreckung, da dieses Remake keine diskreten planetaren
    Verteidigungsbauten kennt.
  - **Orion-Sperr-Timer**: KI ignoriert das bewachte Orion-System bis exakt
    Runde 121 vollständig; danach greifen hinreichend kriegerische Imperien
    mit einer Heimatflotte ab 20 Schiffen gelegentlich den Guardian an
    (derselbe Automatik-Kampf wie beim Spieler, siehe v0.10).
  - **Rebellion stürzt Herrscher**: eine erfolgreiche Rebellions-Spionage
    gegen ein KI-Imperium hat eine Zusatzchance, Persönlichkeit und
    strategisches Ziel des Opfers komplett neu zu würfeln – der Spieler kann
    so gezielt versuchen, einen feindlichen Machthaber zu stürzen.
  - **Verteidigungspriorisierung**: steht ein Kriegsgegner an oder auf dem
    Weg zu einem eigenen System, ruft die KI alle offensiven Flottenbewegungen
    sofort zurück (neue Funktion `recallFleet`), bevor sie neue Angriffe
    startet – "im Kriegsfall zuerst der Schutz der eigenen Planeten".
  - Bereits ohne Änderung erfüllt: kein Fog of War (KI sieht immer die volle
    Galaxie), keine Synchronisation mehrerer KI-Angriffsflotten
    untereinander, keine Vorab-Prüfung der eigenen/gegnerischen
    Kampfkraft vor einem Angriff.

- **v0.13 – Sternenstraßen & Flottensystem-Überarbeitung**
  Setzt den vom Nutzer nachgereichten Teil der ursprünglichen
  Reise-Anforderungen um ("Jeder Planet ist sofort von überall erreichbar.
  Planeten müssen durch Reiserouten/Starlanes verbunden sein"): Flotten
  bewegen sich nicht mehr frei im leeren Raum, sondern folgen einem festen
  Sternenstraßen-Netz (`js/starlanes.js`), das bei der Galaxie-Generierung
  einmalig erzeugt wird (Minimum Spanning Tree für garantierte
  Zusammenhängigkeit, plus die beiden nächstgelegenen Nachbarn jedes
  Systems für Routenalternativen und Zyklen statt einer reinen
  Baumstruktur) und für die gesamte Partie fix bleibt. Das Netz wird
  durchgehend als feines Liniengeflecht auf der Karte dargestellt.

  `sendFleet` berechnet den kürzesten Sternenstraßen-Pfad (Dijkstra) zum
  Ziel und lässt die Flotte automatisch über mehrere Etappen reisen –
  Zwischenankünfte lösen keine Benachrichtigung aus, nur das eigentliche
  Ziel; übrig gebliebenes Bewegungsbudget einer Runde wird sofort in die
  nächste Etappe übertragen, sodass schnelle Flotten mehrere kurze Etappen
  pro Runde zurücklegen können. Die Treibstoffreichweite (v0.9.1/v0.10)
  misst jetzt die Pfaddistanz entlang der Sternenstraßen statt der
  Luftlinie – ein geometrisch naher, aber nicht direkt angebundener
  Planet kann dadurch weiter entfernt sein als vorher. Die
  Reichweiten-Anzeige beim Verlegen einer Flotte hebt deshalb einzelne
  erreichbare Systeme hervor statt eines (jetzt irreführenden)
  geometrischen Kreises. Die KI-Zielbewertung (v0.12) nutzt für Kolonisierung
  und Angriffe ebenfalls Pfad- statt Luftliniendistanz (ein einziger
  Multi-Source-Dijkstra pro Zug statt eines Pfads pro Kandidat).

  Dabei einen Fehler gefunden und behoben: Die KI-Zielauswahl filterte
  Kandidaten nur nach "über Sternenstraßen erreichbar", nicht nach der
  tatsächlichen Treibstoffreichweite – sie wählte dadurch systematisch den
  wertvollsten Planeten IRGENDWO im (jetzt weit verzweigten) Netz, den
  `colonizePlanet`/`sendFleet` wegen Reichweitenüberschreitung
  anschließend stillschweigend ablehnten. KI-Imperien stauten dadurch
  Kolonieschiffe ungenutzt an, statt zu expandieren.

  Neue Funktion `recallFleet` (siehe v0.12) springt beim Rückruf an das
  Ursprungssystem der AKTUELLEN Etappe zurück statt an den allerersten
  Startpunkt der gesamten Reise. *Vereinfacht:* Sternenstraßen sind
  ungerichtet und haben keine Kapazitätsbeschränkung; kein
  Ausrüstungsmodul für "Erweiterte Treibstofftanks" (aus der
  Nutzer-Recherche zur MoO2-Reichweitenmechanik) – nur die
  Fuel-Cell-Forschung (v0.9.1) erhöht die Reichweite.

- **v0.14 – Flottenverwaltung & physische Kolonieschiffe**
  Setzt den Rest der Flottensystem-Anforderungen um: Ein Klick auf ein
  System zeigt bereits seit v0.7 alle dort stationierten und ankommenden
  eigenen Flotten einzeln mit Aufteilen- und Verlegen-Aktion pro Flotte;
  neu ist eine **Zusammenlegen**-Funktion (`js/fleets.js` `mergeFleets`),
  die alle eigenen, stationären Flotten an einem System per Klick zu einer
  einzigen vereint (gleiche Design-Stacks werden addiert). Die
  Ankunftsanzeige einer reisenden Flotte nennt jetzt das tatsächliche Ziel
  und zeigt eine korrekte Gesamt-ETA über die volle (ggf. mehrstufige)
  Restroute (`estimateFleetEta`) statt nur der aktuellen Etappe.

  Kolonieschiffe waren bisher ein rein abstrakter, imperiumsweiter Zähler
  (`empire.colonyShips`), der Kolonisierung unabhängig von jeder
  physischen Position erlaubte. Sie sind jetzt echte Flotten-Stacks
  (`COLONY_SHIP_DESIGN_ID`): jeder Planet ohne explizites
  Kriegsschiff-Ziel baut sie an seinem eigenen System an (derselbe
  Ansparungs-Mechanismus wie beim Kriegsschiffbau, nur mit fixen Kosten
  statt eines Designs), das Startkolonieschiff jedes Imperiums entsteht als
  Flotte am Heimatsystem. `colonizePlanet` verlangt jetzt eine eigene,
  stationäre Flotte mit einem Kolonieschiff-Stack am Zielsystem und
  verbraucht bei Erfolg eines daraus – die vorherige, separate
  Reichweitenprüfung entfällt, da diese bereits beim Losschicken der
  Flotte erfolgt. Die KI kolonisiert dementsprechend sofort, wenn eines
  ihrer Kolonieschiffe bereits an einem passenden System steht, und
  verlegt sonst jedes einzelne, unbeschäftigte Kolonieschiff eigenständig
  zum besten ab seiner aktuellen Position erreichbaren Ziel (weiterhin nach
  der Attraktivitätsformel aus v0.12). Kolonieschiffe zählen dabei
  konsequent nicht mehr als Kampfschiffe: weder für die
  "starke Flotte"-Schwelle bei Angriffen/Guardian-Angriffen noch für die
  Transportkapazität bei Bodeninvasionen (`fleetTroopCapacity`).

  SAVE_VERSION auf 11 erhöht (alte Speicherstände kennen keine physischen
  Kolonieschiff-Flotten). *Vereinfacht:* Kolonieschiffe sind in
  `js/combat.js` unsichtbar (kein Design-Eintrag, siehe
  `computeDesignStats`) und daher nie an einem Kampf beteiligt – ein
  unbeschütztes Kolonieschiff in einem umkämpften System wird weder
  angegriffen noch kann es sich verteidigen; kein Fog of War, das ändert
  nichts am Zielwahl-Verhalten.

  **Nachbesserung** (Nutzer-Feedback nach dem Release): `applyEconomyPolicy`
  stellte bei militanter Ausrichtung (Militarist-Ziel oder `warBias ≥ 0.5`)
  bisher UNBEDINGT alle eigenen Planeten auf Kriegsschiffbau um, sobald ein
  Design existierte – dadurch baute ein militantes Imperium nie wieder ein
  Kolonieschiff und blieb faktisch für den Rest der Partie bei seinen
  Startkolonien (meist 2) stehen. Jetzt bleibt immer der
  bevölkerungsreichste eigene Planet für Kolonieschiffbau reserviert,
  unabhängig von der Ausrichtung; alle übrigen bauen bei militanter
  Ausrichtung weiterhin Kriegsschiffe.

- **v0.15 – Imperiumsplatzierung, Nebel des Krieges & Auto-Erkundung**
  Drei Nutzer-Feedback-Punkte zum bisherigen Prototyp:

  **Imperiumsplatzierung** (`js/galaxyGen.js` `assignHomeworlds`): Die
  bestehende "größter Mindestabstand zu bereits gewählten Heimatsystemen"
  Greedy-Auswahl (Farthest-Point-Sampling) war korrekt, lief aber nur über
  die (räumlich oft zufällig geclusterten) terranisch/Gaia-Systeme als
  Kandidatenpool, wodurch die Abstandsmaximierung ausgehebelt werden
  konnte und Imperien mitunter benachbart starteten. Die Auswahl läuft
  jetzt über ALLE Systeme der Galaxie; besitzt das gewählte System keine
  terranische/Gaia-Welt, wird eine künstlich angelegt (Fallback-Logik gab
  es bereits). Zusätzlich toter Code entfernt (`minSeparation` wurde
  berechnet, aber nie verwendet). Verifiziert über 15 Seeds/4-Imperien:
  minimaler Paarabstand zwischen Heimatsystemen 26,7–38,0 Parsec
  (Ø 31,5), keine Häufungen mehr.

  **Nebel des Krieges** (neues Modul `js/exploration.js`): Der Spieler
  sieht nur, welche Sternenstraßen von bereits besuchten Systemen
  wegführen – unbesuchte Systeme dahinter bleiben verborgen, direkte
  Nachbarn eines erforschten Systems sind nur als Position (ohne Details)
  sichtbar. `empire.exploredSystemIds` wird bei Galaxie-Erzeugung mit dem
  Heimatsystem initialisiert und nach jeder Flottenbewegung
  (`updateExploredSystems`, `js/economy.js` `simulateTurn`) um alle
  Systeme mit eigenen Kolonien oder eigenen Flotten erweitert – einmal
  erforscht bleibt dauerhaft bekannt (kein erneutes Vernebeln). Die
  Kartendarstellung (`js/render.js`) zeigt unerforschte, aber sichtbare
  Systeme nur als gedimmten Punkt ohne Namen/Planetenzahl/Besitzring,
  verborgene Systeme, Sternenstraßen und Flottenmarker außerhalb des
  sichtbaren Bereichs werden gar nicht gezeichnet; `pickSystemAt`
  verweigert die Auswahl verborgener Systeme. Die Seitenleiste
  (`js/ui.js`) zeigt für sichtbare-aber-unerforschte Systeme einen
  "Unerforscht"-Platzhalter statt der Planeten-/Flottendetails.

  **Automatisch erforschen** (`js/exploration.js`
  `isFleetEligibleForAutoExplore`/`runAutoExplore`): Flotten, die
  ausschließlich aus Schiffen mit Small-Rumpf bestehen, können in der
  Seitenleiste (`js/ui.js` `renderFleetSection`) einen Umschalter
  "Automatisch erforschen" aktivieren. Jede Runde wird eine so markierte,
  stationäre Flotte automatisch zum nächstgelegenen (Sternenstraßen-Weg-
  Distanz), noch unerforschten und in Reichweite liegenden System
  geschickt; ist die Flotte bereits unterwegs oder gibt es kein
  erreichbares unerforschtes Ziel mehr, bleibt sie stehen. Ein manueller
  "Verlegen"-Befehl deaktiviert die Auto-Erkundung der betroffenen Flotte
  wieder (`js/main.js` `onArmFleetMove`), damit der nächste automatische
  Zug den manuellen Befehl nicht sofort überschreibt.

  SAVE_VERSION auf 12 erhöht (alte Speicherstände kennen weder
  `empire.exploredSystemIds` noch `fleet.autoExplore`). *Vereinfacht:*
  Der Nebel des Krieges gilt ausschließlich für den Spieler – die KI bleibt
  wie in "MoO KI Verhalten.docx" (v0.12) beschrieben allwissend und wählt
  ihre Ziele unverändert ohne jede Sichtbarkeitsprüfung; Erforschung ist
  binär (besucht/nicht besucht) ohne graduellen "einmal gesehen, dann
  wieder vergessen"-Verfall; Auto-Erkundung ist auf reine
  Small-Rumpf-Flotten beschränkt (Kolonieschiffe und gemischte Flotten
  sind nicht wählbar) und plant nur eine Runde im Voraus statt eine
  vollständige Route vorzuberechnen.

- **v0.16 – Interaktives Kampf-Grid (Hexfeld-Taktik)**
  Optionale Alternative zur bisherigen statistischen Auto-Auflösung
  (`js/combat.js` `resolveSystemCombat`), auf Nutzerwunsch: ein neuer Schalter
  "Interaktive Kämpfe" in der Kopfleiste (`empire.interactiveCombat`,
  standardmäßig AUS) lässt den Spieler eigene Gefechte selbst auf einem
  Hexfeld führen, wie in einem klassischen Rundenstrategiespiel – Flotten
  gezielt bewegen und angreifen statt nur zuzusehen.

  **Ablauf**: `js/economy.js` `resolveAllCombats` erkennt beim Rundenwechsel
  Zwei-Parteien-Gefechte, an denen der Spieler beteiligt ist, und stellt sie
  bei aktiviertem Schalter zurück (`galaxy.pendingBattles`) statt sie sofort
  auszuwürfeln – die beteiligten Flotten bleiben bis zur Entscheidung
  unverändert am System stehen. `js/main.js` blockiert den weiteren
  Rundenwechsel, bis alle zurückgestellten Gefechte entschieden sind, und
  öffnet dafür das neue Kampf-Grid (`hexcombat-dialog`). Das Ergebnis
  mündet über dieselbe Form (`{ empireIds, winnerEmpireId, survivorsByEmpire,
  shipsLostByEmpire, log }`) wie die Auto-Auflösung in denselben
  Flotten-Wiederaufbau und denselben Kampfbericht-Dialog wie bisher – aus
  Sicht des restlichen Spiels ist ein Kampf-Grid-Ergebnis nicht von einem
  automatisch aufgelösten zu unterscheiden.

  **Mechanik** (neues Modul `js/hexcombat.js`): jeder Flotten-Stack (ein
  Design, alle Schiffe eines Imperiums an diesem System) belegt genau ein
  Hexfeld auf einem 11×7-Grid (Odd-Q-Offset-Koordinaten). Jede Einheit darf
  pro Runde einmal ziehen (Bewegungsreichweite aus Antriebsgeschwindigkeit
  und Rumpf-Ausweichbonus) und einmal angreifen (nur Waffen mit
  ausreichender Reichweite feuern); Treffer landen immer auf dem vordersten
  noch lebenden Schiff des Ziel-Stacks. Die Spielerphase endet über
  "Runde beenden", woraufhin eine einfache KI-Heuristik (nächstes Ziel
  anvisieren, bei Bedarf annähern, feuern sobald in Reichweite) die
  gegnerischen Einheiten zieht. "Zurückziehen" beendet das Gefecht sofort
  zugunsten des Gegners, die eigenen Überlebenden fliehen mit ihrem
  aktuellen Zustand. "Automatisch auflösen" ist jederzeit verfügbar und
  verwirft einen begonnenen manuellen Verlauf zugunsten der klassischen
  Zufallsauflösung auf Basis des ursprünglichen (unbeschädigten)
  Kräfteverhältnisses – die zweite, feinere Ebene der "optional"-Vorgabe
  neben dem globalen Schalter.

  Treffer-/Schadensmathematik pro Schuss (`hitChance`, `missileHitChance`,
  `rollDamage`, `defenseRating`) ist aus `js/combat.js` in den Kampf-Grid-Code
  wiederverwendet, damit beide Auflösungsarten konsistent bleiben; neu ist
  nur `weaponRangeHexes` (Feuerreichweite in Hexfeldern, siehe unten).

  **Nachbesserung** (beim Testen dieses Release gefunden, nicht erst durch
  das Kampf-Grid verursacht): die Flotten-Wiederaufbau-Logik nach einem
  Gefecht hat bisher JEDE Flotte am umkämpften System gelöscht und nur aus
  den Kampf-Überlebenden neu aufgebaut – ein Kolonieschiff (nimmt laut
  ROADMAP v0.14 nie am Kampf teil) in derselben Flotte wie kämpfende
  Kriegsschiffe wurde dadurch unabhängig vom Kampfausgang mit zerstört.
  `js/economy.js` `applyBattleResult` (aus der bisherigen
  `resolveAllCombats` herausgezogen, jetzt auch vom Kampf-Grid genutzt)
  entfernt jetzt nur noch die kampfbeteiligten Design-Stacks und erhält
  alle übrigen (Kolonieschiff-)Stacks einer betroffenen Flotte.

  SAVE_VERSION auf 13 erhöht (neue Felder `empire.interactiveCombat`,
  `galaxy.pendingBattles`). *Vereinfacht:* nur Zwei-Parteien-Gefechte sind
  interaktiv spielbar, ein Zusammentreffen von drei oder mehr Imperien am
  selben System läuft weiterhin automatisch; Guardian-of-Orion- und
  galaktische Zufallsereignis-Kämpfe (`js/orion.js`, `js/events.js`) bleiben
  vorerst ebenfalls Auto-Resolve-only. Ein Hexfeld trägt einen ganzen
  Stack statt eines einzelnen Schiffs. Feuerreichweite ist in keiner
  Analyse-Quelle beziffert (außer dem Disruptor, siehe techtree-analyse.docx)
  – Platzhalter: 3 Hexfelder für Direktfeuerwaffen, 5 für Raketen/Torpedos.
  Bewegungsreichweite ist ebenfalls unbeziffert – Platzhalter aus halbierter
  Antriebsgeschwindigkeit plus Rumpf-Ausweichbonus. Die zahlreichen, im
  Techbaum als "(ab v0.5)" markierten Spezialfähigkeiten (Flächenschaden,
  Tarnung, Stasisfeld, Verdrängung, Teleport-Vorrang, Schadenskontrolle
  usw.) sind bewusst noch nicht umgesetzt – nur Waffen, Schilde,
  Geschwindigkeit und Angriffs-/ECM-Boni wirken bereits über die gemeinsame
  Kampfmathematik.

## Weitere Post-Prototyp-Releases

- Polish-Kandidaten: KI-Redesign neuer Schiffsklassen im Spielverlauf,
  Beam-Distanzabfall über die im interaktiven Kampf-Grid (v0.16) bereits
  eingeführte Reichweite hinaus, die im Techbaum als "(ab v0.5)" markierten
  Spezialfähigkeiten (Flächenschaden, Tarnung, Stasisfeld usw.)

## Grafik-Pipeline

Rassen-Portraits und Planeten-Umwelt-Icons wurden über ChatGPT
(Bildgenerierung, via Claude-in-Chrome-Erweiterung im eingeloggten Account)
erzeugt und liegen unter `assets/images/`. Schiffs-Sprites folgen bei
Bedarf nach demselben Verfahren.
