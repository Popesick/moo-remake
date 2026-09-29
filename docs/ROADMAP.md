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

- **v0.17 – KI-Schiffsklassen-Redesign im Spielverlauf**
  Bisher entwarf jede KI zu Partiebeginn genau ein Start-Design
  (`createStarterDesign`: Small-Rumpf, Level-1-Komponenten) und blieb dabei
  für den Rest der Partie – noch nach hundert erforschten Runden baute sie
  weiter dieselben schwachen Erstlings-Kriegsschiffe. `js/ai.js`
  `maybeRedesignShips` prüft jetzt alle 20 Runden (`runAiTurn`, vor
  `applyEconomyPolicy`, damit ein frisches Design noch in derselben Runde
  als Produktionsziel greift), ob eine größere Rumpfklasse oder eine
  bessere Waffe verfügbar ist, und legt bei Bedarf ein neues Design an.

  Rumpfklassen sind im Techbaum nicht freigeschaltet (alle vier stehen von
  Anfang an offen, siehe `js/data/hulls.js`) – die KI schaltet sie sich
  stattdessen selbst anhand der Summe aller sechs Forschungsdisziplin-Stufen
  frei (dieselbe Kennzahl wie die Techstufen-Anzeige der Kopfleiste):
  Medium ab 40, Large ab 100, Huge ab 180. Armor/Schild/Antrieb/Waffe werden
  jeweils als das höchststufige erforschte Modul dieser Art gewählt
  (`pickBestTech`), die Waffenanzahl füllt die verbleibende Rumpfkapazität
  bis zu einem Deckel von 8. Alte Designs werden NICHT verschrottet, wenn
  ein besseres entsteht – bereits gebaute Schiffe eines verschrotteten
  Designs wären sonst im nächsten Gefecht unsichtbar (`js/combat.js`
  `buildUnits` überspringt Stacks ohne passendes Design). Neue Produktion
  zielt stattdessen über `empire.currentWarshipDesignId` auf das jeweils
  neueste Design; `applyEconomyPolicy`s bisherige feste Referenz auf
  `shipDesigns[0]` wäre nach einem Redesign nicht mehr korrekt gewesen und
  wurde entsprechend korrigiert.

  Da `MAX_SHIP_DESIGNS` bei 6 liegt, würde allein die Zahl der Panzerungs-
  und Schildstufen (7 bzw. 11 Stufen) das Kontingent aufbrauchen, bevor je
  eine größere Rumpfklasse erreicht wird – ein Redesign löst deshalb nur
  bei einer Rumpfklassen-Aufwertung oder einer neuen Bestwaffe aus (nicht
  bei reiner Panzerungs-/Schild-/Antriebs-Verbesserung), und der letzte
  freie Slot ist ausschließlich für eine künftige Rumpfklassen-Aufwertung
  reserviert. Ab der zweiten Design-Generation trägt der Name ein
  "Mk."-Suffix (dieselbe Konvention wie die Battle-Computer-Techstufen im
  Techbaum), damit mehrere Redesigns derselben Rumpfklasse im Kampfbericht
  unterscheidbar bleiben. Verifiziert über einen 400-Runden-Testlauf: KI-
  Imperien wechseln zuverlässig von Small- auf Medium- und (bei
  ausreichendem Forschungsvorsprung) auf Large-Rümpfe, ohne das
  Design-Kontingent vorzeitig zu erschöpfen.

  *Vereinfacht:* Rumpfklassen-Freischaltung ist ein reiner KI-interner
  Platzhalter-Schwellenwert (keine Analyse-Quelle beziffert dies); die KI
  bewertet Designs rein nach höchster Technikstufe, nicht nach tatsächlicher
  Kampfkraft/Kosten-Nutzen-Abwägung; alte, ungenutzte Designs bleiben bis
  Partieende in `shipDesigns` stehen statt bei völligem Verschwinden aller
  ihrer Schiffe automatisch aufgeräumt zu werden.

- **v0.18 – Beam-Distanzabfall & Feuerreichweiten-Technologie**
  Baut auf der im interaktiven Kampf-Grid (v0.16) eingeführten Reichweite
  auf: Direktfeuerwaffen (Strahlen/Kanonen, alles außer `isMissile`)
  verlieren jetzt linear an Wirkung, je weiter das Ziel entfernt ist –
  voller Schaden auf Distanz 1, absinkend auf 50% bei maximaler
  Waffenreichweite (`js/combat.js` `rangeDamageMultiplier`, in
  `js/hexcombat.js` `resolveAttack` auf den gewürfelten Schaden vor dem
  Schildabzug angewendet). Gelenkte Raketen/Torpedos (`isMissile`) treffen
  weiterhin distanzunabhängig mit voller Stärke. Gilt ausschließlich für
  das Kampf-Grid – die statistische Auto-Auflösung bleibt wie in ROADMAP
  v0.14 dokumentiert ohne Positionsbegriff.

  Zugleich wird die bislang wirkungslose Techbaum-Technologie "High Energy
  Focus" (Antrieb, Stufe 34: "+3 Feuerreichweite für Direktfeuerwaffen (ab
  v0.5)") erstmals ausgewertet: `js/combat.js` `rangeBonusForEmpire` prüft
  `empire.research.completedTechs` und reicht den Bonus als `rangeBonus` an
  jede Kampf-Grid-Einheit weiter (`js/hexcombat.js` `createBattle`,
  einmalig pro Imperium statt bei jeder Reichweitenprüfung erneut
  nachgeschlagen). Rakete/Torpedos profitieren nicht zusätzlich davon, da
  sie bereits mit voller Basisreichweite gelenkt sind.

  Verifiziert: Schadensvergleich über 200 Gefechte je Distanz bestätigt die
  erwartete ~50%-Halbierung zwischen Distanz 1 und maximaler Reichweite;
  ein Ziel außerhalb der Basisreichweite ist ohne die Technologie
  unerreichbar und mit ihr treffbar; 150-Runden-Regression mit
  abwechselnd manuell gespieltem und automatisch aufgelöstem Kampf-Grid
  ohne Fehler.

  *Vereinfacht:* der Abfallwert (50% Minimum) ist ein plausibler,
  zentral tunbarer Platzhalter – keine Analyse-Quelle beziffert einen
  konkreten Wert; der Bonus gilt pauschal für alle Direktfeuerwaffen eines
  Imperiums, nicht gestaffelt nach Waffentyp.

- **v0.19 – Kampf-Grid-Spezialfähigkeiten (verbliebene "(ab v0.5)"-Techs)**
  Alle bis dahin verbliebenen, als `effect: { type: "flavor" }` wirkungslosen
  Techbaum-Technologien wirken jetzt im interaktiven Kampf-Grid
  (`js/hexcombat.js`, neuer Abschnitt "Spezialfähigkeiten", `computeAbilities`
  einmal pro Imperium bei Gefechtsbeginn ausgewertet). Battle-Computer-/
  ECM-Jammer-Stufen und alle Deflector-Schild-Klassen funktionierten dagegen
  bereits vorher (über `applyTechEffect` bzw. das Schiffsdesign-Modulsystem)
  – ihr irreführender "(ab v0.5)"-Beschreibungstext wurde entfernt, ebenso
  bei allen hier neu umgesetzten Technologien.

  Umgesetzt: **Battle Scanner** (+1 Angriffswert), **Oracle Interface**
  (Direktfeuerwaffen ignorieren Schilde), **Technology Nullifier** (senkt
  bei Treffer den Angriffswert des Ziels dauerhaft um 2-6),
  **Advanced Damage Control** (heilt 30% der Schiffs-HP pro Runde),
  **Repulsor Beam** (stößt getroffene Ziele ein Feld weiter weg),
  **Cloaking Device** (+20 Ausweichwert), **Zyro-/Lightning Shield**
  (75%/100% Chance, Raketen vor dem Einschlag zu zerstören), **Stasis
  Field**/**Black Hole Generator** (je Einheit einmal pro Gefecht
  auslösbares Sondergerät statt regulärem Waffenfeuer: Stasis friert ein
  Ziel 1 Runde ein, Black Hole zerstört 25-100% aller Schiffe im
  Wirkungsbereich – Black Hole ersetzt Stasis, falls beide erforscht sind),
  **Inertial Stabilizer**/**Inertial Nullifier** (+2/+4 Ausweichwert, +2
  Kampffeld-Bewegung bei Nullifier, kein Stapeln), **Energy/Ionic Pulsar**
  (5/10 Flächenschaden an Nachbarfeldern des Ziels, einmal pro
  Angriffsaktion statt pro Einzelschuss), **Warp Dissipator** (-2
  Ausweichwert für alle gegnerischen Einheiten), **Sub Space Teleporter**
  (praktisch unbegrenzte Kampffeld-Bewegung) mit **Sub Space Interdictor**
  als Gegenmaßnahme (negiert den gegnerischen Teleporter, aber nur über
  einer eigenen Kolonie des Interdiktor-Besitzers) und **Displacement
  Device** (33% Chance, dass jeder gegnerische Angriff automatisch
  verfehlt, unabhängig von der normalen Trefferchance).

  Verifiziert: jede Fähigkeit einzeln über gezielte Vorher/Nachher- bzw.
  Mehrfachversuchs-Tests (Wahrscheinlichkeiten über 300 Versuche bestätigt);
  eine 300-Runden-Regression mit allen neu ausgewerteten Technologien
  gleichzeitig auf beiden Kriegsparteien lief ohne Fehler.

  *Vereinfacht:* keine Analyse-Quelle beziffert die genaue Kampf-Grid-
  Wirkung dieser Fähigkeiten – alle Werte/Formeln sind plausible, zentral
  tunbare Platzhalter, die den Techtree-Beschreibungstext so direkt wie im
  Rahmen des bestehenden Kampf-Grids möglich umsetzen. Stasis Field/Black
  Hole lösen automatisch beim ersten Angriff der Einheit aus (keine eigene
  UI-Auswahl, ob das Sondergerät diesmal eingesetzt werden soll). Warp
  Dissipator ist ein fester Malus für die Gefechtsdauer statt einer "pro
  Runde" ansteigenden Wirkung, um keinen zusätzlichen Rundenzustand pro
  Einheit einzuführen. Technology Nullifier wirkt pro Treffer (wie im
  Beschreibungstext "pro Schuss") und kann bei großen Flotten-Stacks sehr
  stark ausfallen. Gilt wie alle Kampf-Grid-Mechaniken nur für Gefechte des
  Spielers bei aktiviertem Schalter – Guardian-of-Orion- und galaktische
  Zufallsereignis-Kämpfe bleiben weiterhin Auto-Resolve-only.

  Damit sind alle ursprünglich im Techbaum als "(ab v0.5)" markierten
  Spezialfähigkeiten umgesetzt.

- **v0.20 – Taktischere KI im Kampf-Grid**
  Die KI-Gegnerphase im interaktiven Kampf-Grid (`js/hexcombat.js`
  `runAiPhase`) wählte bisher (ROADMAP v0.16) für jede Einheit stur das
  nächstgelegene gegnerische Ziel und feuerte automatisch das
  Sondergerät (Stasis Field/Black Hole Generator, ROADMAP v0.19) beim
  erstbesten Angriff ab – unabhängig davon, ob das lohnend war.

  **Zielwahl** (`scoreAiTarget`/`pickAiTarget`): bewertet erreichbare
  gegnerische Stacks jetzt nach Stackgröße (mehr Schiffe = höhere
  Priorität), verbleibender HP des vordersten Schiffs (fast zerstörte
  Stacks werden bevorzugt, um Kills zu sichern), Bedrohungswert
  (Angriffswert × Stückzahl) und Distanz – statt reiner Nächstenwahl.

  **Sondergerät-Einsatz** (`aiShouldUseSpecialDevice`): Black Hole
  Generator wird nur noch ausgelöst, wenn Ziel plus gegnerische
  Nachbareinheiten im Wirkungsbereich zusammen mindestens 2 Schiffe
  stellen (sonst normales Waffenfeuer, das Gerät bleibt für einen
  lohnenderen Moment aufgespart); Stasis Field nur gegen die aktuell
  gefährlichste gegnerische Einheit gefechtsweit (höchster
  Angriffswert×Stückzahl) und nur, solange sie nicht ohnehin durch
  normales Feuer gleich fallen würde (HP-Anteil über 30%).

  Verifiziert: KI überspringt Black Hole gezielt bei einem einzelnen
  1-Schiff-Ziel und nutzt es zuverlässig bei einem lohnenden 4-Schiffe-
  Stack (3 von 4 Schiffen in einem Schuss vernichtet); Stasis Field
  friert im Test die stärkste von zwei gleichzeitig erreichbaren
  gegnerischen Einheiten ein, nicht die schwächere, fast zerstörte
  daneben; 250-Runden-Regression mit allen v0.19-Spezialfähigkeiten
  gleichzeitig aktiv lief ohne Fehler; Live-Durchklicken im Kampf-Grid
  bestätigt fehlerfreies Verhalten.

  *Vereinfacht:* rein additive Gewichtungsformel ohne Berücksichtigung der
  eigenen Restbewegung/-reichweite über die aktuelle Runde hinaus; gilt nur
  für die KI-Gegnerseite im Kampf-Grid, der Spieler entscheidet weiterhin
  selbst, wann er sein eigenes Sondergerät einsetzt (automatisch beim
  gewählten Angriffsziel, siehe ROADMAP v0.19).

- **v0.21 – Fraktionswahl, Menü/Einstellungen-Überarbeitung & moderneres UI**
  Nutzer-Feedback zum Spielstart und zur Kopfleiste, in drei Teilen:

  **Fraktionswahl**: der Spieler spielte bislang immer fest die Menschen
  (`generateEmpires` in `js/galaxyGen.js` griff hart auf `RACES[0]` zu). Der
  "Neue Galaxie"-Dialog zeigt jetzt ein Porträt-Raster aller zehn Fraktionen
  (`js/ui.js` `renderRaceSelector`, Porträts bereits unter
  `assets/images/races/` vorhanden) – ein Klick wählt sie aus und zeigt
  darunter groß Porträt, Name und Eigenschaftstext (`blurb` aus
  `js/data/races.js`). Die gewählte `raceId` läuft über
  `generateGalaxy`/`generateEmpires` durch: die KI-Rassen werden aus dem
  Pool ohne die vom Spieler gewählte Fraktion ausgelost (vorher hart gegen
  die Zeichenkette `"human"` gefiltert – funktioniert jetzt auch, wenn der
  Spieler selbst eine KI-Fraktion "wegnimmt").

  **Menü & Einstellungen**: Speichern/Laden/Neue Galaxie und der bisher lose
  in der Kopfleiste sitzende Interaktive-Kämpfe-Schalter sind jetzt in einem
  Spielmenü gebündelt (neuer `#menu-dialog`, 2×2-Raster), aus dem heraus ein
  eigener Einstellungen-Dialog (`#settings-dialog`) erreichbar ist. Dort:
  Interaktive Kämpfe an/aus, Musik an/aus + Lautstärke-Regler, Soundeffekte
  an/aus + Lautstärke-Regler, sowie – nur informativ – der Seed der aktuell
  geladenen Galaxie. Diese Einstellungen leben bewusst in einem eigenen
  localStorage-Eintrag (neues `js/settings.js`, Schlüssel
  `moo-remake:settings`) statt im Spielstand: es sind Präferenzen des
  Spielers als Person, die über "Neue Galaxie" und verschiedene Spielstände
  hinweg erhalten bleiben sollen. Interaktive Kämpfe wird beim Laden/Starten
  einer Galaxie auf das Spielerimperium angewendet (`applySettingsToPlayer`)
  – die Einstellung ist jetzt die Quelle der Wahrheit, nicht das, was
  zuletzt in einem Spielstand gespeichert war.

  **Musik-/Soundeffekt-Infrastruktur**: neues `js/audio.js` – ein
  AudioManager mit `playMusic`/`stopMusic`/`playSfx` sowie den von den
  Einstellungen gesteuerten An/Aus- und Lautstärke-Reglern. Es liegen noch
  keine Audio-Dateien im Projekt (eigenes späteres Release); fehlt eine
  Datei unter `assets/audio/`, schlägt das Laden einmalig fehl und wird
  danach lautlos ignoriert (kein Konsolenspam, kein Absturz) – die
  Einstellungen-UI ist bereits vollständig, sie hat nur noch nichts zum
  Abspielen. `init()` startet probeweise einen `"theme"`-Loop.

  **Kopfleisten-/UI-Überarbeitung**: die Zeile "Runde X · Seed Y · N
  Systeme · M Planeten · K Imperien" zeigt jetzt nur noch die Runde (Seed
  siehe Einstellungen, Zählwerte entfallen ganz). Forschung/Schiffsdesign/
  Diplomatie/Runde beenden sind feste Icon+Label-Buttons; Heimatsystem und
  Hall of Fame wurden zu kompakten Icon-only-Buttons (Planet-Symbol,
  Pokal-Symbol) verkleinert. Neues, handgezeichnetes SVG-Icon-Set
  (`js/icons.js`, kein Icon-Font/CDN) für alle Kopfleisten-/Menü-/
  Einstellungen-Buttons. Allgemeine visuelle Auffrischung
  (`css/style.css`): zusätzliche Farbtoken, abgerundetere Ecken,
  Hover-/Aktiv-Zustände mit sanften Übergängen, Backdrop-Blur auf
  Dialog-Overlays, Schatten auf Dialogen/Kopfleiste.

  Verifiziert: alle zehn Fraktionen einzeln als Spielerwahl über je einen
  60-Runden-Lauf (KI-Pool schließt die gewählte Fraktion korrekt aus, auch
  wenn der Spieler eine sonst KI-typische Fraktion wählt); Einstellungen-
  Werte überleben einen Neustart des Prozesses (localStorage); Interaktive-
  Kämpfe-Schalter wirkt sofort auf das laufende Spielerimperium; Speichern/
  Laden/Neue Galaxie über das neue Menü funktionsfähig; Kopfleisten-Buttons
  bei 1400px Fensterbreite vollständig sichtbar ohne Überlappung; keine
  Konsolenfehler außer den erwarteten, harmlosen 404s für die noch fehlenden
  Audio-Dateien.

  *Vereinfacht:* keine echten Audio-Assets in diesem Release (nur die
  Abspiel-Infrastruktur); Musik-Trigger nur beim Spielstart (kein
  situatives Umschalten zwischen Tracks, z.B. für Kampf vs. Frieden);
  Rassen-Porträts sind die bereits zuvor erzeugten großen PNGs (keine
  eigens generierten Thumbnails, Browser skaliert per CSS).

- **v0.22 – Auto-Erkundung-Bugfix, Kolonisieren-auf-Zuruf & Menü-Reihenfolge**
  Drei Nutzer-Feedback-Punkte:

  **Menü-Reihenfolge**: das Spielmenü (ROADMAP v0.21) zeigt jetzt oben
  Speichern/Laden, unten Einstellungen/Neue Galaxie (reine
  `index.html`-Reihenfolge im 2×2-Raster).

  **Auto-Erkundung-Bugfix**: "Automatisch erforschen" blieb nach dem ersten
  Sprung meist einfach stehen. Ursache: `js/exploration.js` `runAutoExplore`
  wählte Kandidatenziele nach Distanz AB DER AKTUELLEN FLOTTENPOSITION,
  während `sendFleet` (`js/fleets.js`) die Treibstoffreichweite davon
  unabhängig AB DER NÄCHSTEN EIGENEN KOLONIE prüft (`isSystemInRange`).
  Sobald die Flotte ein bis zwei Erkundungssprünge von jeder Kolonie weg
  war, wirkte ein Nachbarsystem aus Flottensicht "nah genug", scheiterte
  dann aber stillschweigend an `sendFleet`s Treibstoffprüfung – die Flotte
  bekam nie ein neues Ziel und blieb stehen. Die Kandidatenauswahl
  filtert jetzt zusätzlich mit genau derselben `isSystemInRange`-Prüfung,
  die `sendFleet` ohnehin anwendet. Verifiziert per direktem Vergleich:
  die alte Logik blieb nach einem einzigen Sprung hängen, die neue
  erkundete im selben Testlauf drei Systeme, bis die Treibstoffreichweite
  tatsächlich erschöpft war.

  **Kolonisieren-auf-Zuruf** (`js/economy.js` `orderColonization`, neue
  Helfer in `js/fleets.js`): "Kolonisieren" ist jetzt auch ohne ein vor Ort
  stehendes Kolonieschiff anklickbar, solange der Planet erforscht,
  kolonisierbar, nicht bewacht ist und irgendwo im Imperium ein noch nicht
  zugeteiltes Kolonieschiff existiert, das das Ziel in Treibstoffreichweite
  erreichen kann. Ein Klick spaltet – falls nötig – genau ein Kolonieschiff
  aus der nächstgelegenen unzugeteilten Flotte ab (`extractSingleColonyShip`,
  lässt Kriegsschiff-Eskorten oder weitere Kolonieschiffe im Ursprungs-Stack
  unberührt zurück), schickt es los und markiert es per
  `fleet.colonizeTarget = { systemId, planetId }` als zugeteilt. Bei Ankunft
  kolonisiert `simulateTurn` automatisch (neuer Hook direkt nach
  `advanceFleets`), ohne dass der Spieler erneut klicken muss. Solange ein
  Kolonieschiff für einen bestimmten Planeten unterwegs ist, zeigt die
  Planetenkarte statt des Buttons "Kolonieschiff im Transfer"
  (`findColonizeAssignment`). Die Kolonieschiffe-Kennzahl in der Kopfleiste
  (`countColonyShips`) zählt zugeteilte, im Transfer befindliche
  Kolonieschiffe nicht mehr mit – Beispiel aus dem Nutzer-Feedback (3
  Kolonieschiffe, 2 im Transfer, 1 untätig) zeigt jetzt korrekt "1
  Kolonieschiff".

  Verifiziert: Order-Dispatch reduziert die angezeigte Kolonieschiffzahl
  sofort korrekt und erstellt die Zuteilung; automatische Kolonisierung bei
  Ankunft nach der erwarteten Reisezeit; "Kein Kolonieschiff verfügbar."-
  bzw. Reichweiten-Hinweis, wenn kein Schiff bzw. keines in Reichweite
  existiert; vollständiger Durchlauf über echte Klicks in der Live-UI
  (System auswählen, Kolonisieren klicken, mehrere Runden über den echten
  "Runde beenden"-Button, automatische Kolonisierung bestätigt); 200-Runden-
  Regression mit gemischter Auto-Erkundung und mehreren
  Kolonisieren-auf-Zuruf-Aufträgen ohne Fehler.

  *Vereinfacht:* die Auswahl des zu entsendenden Kolonieschiffs
  berücksichtigt nur die Sternenstraßen-Pfaddistanz ab der jeweiligen
  Flottenposition, nicht die tatsächliche verbleibende Reisezeit oder
  laufende Aufträge anderer Flotten.

- **v0.23 – Bugfix: neues Schiffsdesign erst nächste Runde wählbar**
  Nutzer-Feedback: ein frisch erstelltes Schiffsdesign ließ sich im
  Produktionsziel-Dropdown eines Planeten (`js/ui.js`
  `buildOwnedPlanetCard`) erst nach der nächsten, aus anderem Grund
  ausgelösten Seitenleisten-Aktualisierung auswählen – meist faktisch
  erst nach "Runde beenden", obwohl das Design bereits sofort einsatzbereit
  war. Ursache: `js/main.js` `shipDesignCallbacks.onCreateDesign` (und
  `onScrap`) aktualisierten nach `addShipDesign`/`scrapShipDesign` zwar den
  Schiffsdesign-Dialog selbst und die Kopfleiste, riefen aber kein
  `refreshSidePanel()` auf – das Dropdown ist eine eigene DOM-Struktur, die
  ohne diesen Aufruf die veraltete `player.shipDesigns`-Liste stehen ließ.
  Beide Callbacks rufen `refreshSidePanel()` jetzt zusätzlich auf.

  Verifiziert über echte Klicks in der Live-UI: Design im
  Schiffsdesign-Dialog erstellt, Dialog geschlossen, Dropdown zeigt das
  neue Design sofort (vorher fehlte es bis zum nächsten Refresh);
  Auswahl setzt `planet.productionTarget` korrekt; nachfolgende Runde
  spart tatsächlich BC für das neue Design an statt für Kolonieschiffe;
  Verschrotten aktualisiert das Dropdown ebenso sofort; 150-Runden-
  Regression ohne Fehler.

- **v0.24 – Imperiumskontakt & Rundenereignis-Panel**
  Nutzer-Feedback: Diplomatie mit einem fremden Imperium sollte erst nach
  tatsächlichem Sichtkontakt möglich sein, und der Spieler sollte zu
  Rundenbeginn eine gesammelte Übersicht der wichtigen Vorkommnisse
  bekommen statt sie einzeln aus der Karte herauslesen zu müssen.

  **Imperiumskontakt** (`js/exploration.js` `updateEmpireDiscovery`): ein
  Imperium gilt als entdeckt, sobald der Spieler eines seiner Schiffe oder
  einen seiner besiedelten Planeten in einem SELBST erforschten System
  (`exploredSystemIds`, nicht nur einem sichtbaren Nachbarsystem) gesehen
  hat. Läuft jede Runde direkt nach `updateExploredSystems`, damit ein
  gerade erst erforschtes System noch in derselben Runde zählt.
  `js/ui.js` `renderDiplomacyDialog` blendet noch nicht entdeckte Imperien
  komplett aus der Liste aus (mit erklärendem Hinweistext, falls welche
  fehlen) – Krieg/Frieden/Handel/Spionage sind für sie schlicht nicht
  erreichbar. *Vereinfacht:* gilt nur für den Spieler, die KI bleibt
  allwissend und initiiert ohnehin nie selbst Diplomatie (ROADMAP v0.12).

  **Rundenereignis-Panel** (neue Spalte zwischen Karte und Seitenleiste,
  `js/turnEvents.js`): fasst zu Rundenbeginn per Vorher/Nachher-Vergleich
  des Spielerbesitzstands sowie den während `simulateTurn` gesammelten
  Rohdaten fünf Ereignistypen zusammen, jeweils mit eigenem Icon
  (`js/icons.js`, im bestehenden handgezeichneten Inline-SVG-Stil statt
  ChatGPT-Bildern – Konsistenz mit dem übrigen UI-Chrome-Icon-Set aus
  v0.21):
  - *Neues Imperium entdeckt*: Klick öffnet einen Dialog mit Porträt
    ("Du entdeckst das Volk der X.") und den Optionen OK (schließt nur)
    und "Kontakt aufnehmen" (öffnet direkt die jetzt gefilterte
    Diplomatie).
  - *Neues Schiff gebaut* (nur Kriegsschiffe, keine Kolonieschiffe):
    Klick springt zum produzierenden System, damit der Flotte sofort
    Befehle erteilt werden können.
  - *Feind gesichtet* / *Planet besetzt* / *System verloren*: per
    Lupen-Icon Sprung zum betroffenen System, per X schließen ohne
    Aktion. "Feind gesichtet" gilt für eine fremde, im Krieg stehende
    Flotte, die diese Runde in einem zuvor eigenen System angekommen ist
    (`isAtWar`); "Planet besetzt"/"System verloren" werden aus dem
    Besitzstands-Diff berechnet, nicht an jeder einzelnen
    Besitzwechsel-Stelle (Invasion, Bioangriff, KI-Eroberung) einzeln
    ausgelöst. *Vereinfacht:* da es keinen formalen Bündnis-Mechanismus
    gibt (nur Krieg/Frieden/Handelsabkommen, siehe `js/diplomacy.js`),
    wird "verbündetes System/Planet" aus dem Nutzer-Feedback als
    "eigenes System/Planet" interpretiert.

  Die Ereignisberechnung läuft unabhängig von offenen interaktiven
  Kampf-Grid-Gefechten oder einer Ratssitzung erst, sobald die komplette
  Rundenabwicklung abgeschlossen ist (Kontext wird durch
  `turnEndContext`/`pendingCouncilVote` bis zum finalen
  `finishTurnDisplay` durchgereicht) und wird dort UNABHÄNGIG von der
  bestehenden Prioritätenkette (Kampfbericht > galaktisches Ereignis >
  Durchbruch > Ankunft) immer angezeigt. Ereignisse sind bewusst nicht
  Teil des Speicherstands – reine Anzeige des letzten Rundenwechsels.

  Verifiziert: Entdeckung per direkter Modul-Aufrufe (Diplomatie vorher
  gesperrt, danach freigeschaltet, korrektes neu-entdecktes Imperium);
  Besitzstands-Diff-Logik für Feind gesichtet/Planet besetzt/System
  verloren inkl. Mehrfachereignis im selben System in derselben Runde;
  vollständiger Durchlauf über echte Klicks in der Live-UI (Diplomatie
  zeigt Hinweistext bei komplett unentdeckter Galaxie, Entdeckungsdialog
  mit korrektem Porträt/Name, "Kontakt aufnehmen" öffnet die jetzt
  gefilterte Diplomatie mit dem neuen Imperium gelistet, Lupen-/X-Buttons
  im Ereignis-Panel lösen die richtigen Aktionen aus und respektieren
  Event-Bubbling korrekt); 60-Runden-Regression über die echte
  `simulateTurn`/`computeTurnEvents`-Kette ohne Fehler.

- **v0.25 – Planeten-Übersicht mit sperrbaren Reglern**
  Nutzer-Feedback: eine Gesamtübersicht aller eigenen Planeten fehlte
  bisher – Produktionswerte ließen sich nur planetenweise über die
  Kartenauswahl in der Seitenleiste einsehen.

  Neuer Kopfleisten-Button "Planeten" (`js/icons.js` neues Icon,
  `#planets-dialog`) listet alle eigenen Planeten als Kartenraster
  (Bild, Porträt, Umwelt/Größe/Ergiebigkeit, Bevölkerung, Fabriken/
  Produktion, aktuelles Schiffsproduktionsziel samt Baufortschritt,
  Slider). Die Karten sind dieselbe Komponente wie in der System-
  Seitenleiste (`buildOwnedPlanetCard`), daher gilt die neue
  Sperren-Funktion automatisch auch dort.

  **Sperrbare Slider**: hinter jedem der fünf Zuteilungs-Regler sitzt ein
  Schloss-Icon (`planet.sliderLocks[key]`, neues optionales Feld,
  Standard ungesetzt/false – kein `SAVE_VERSION`-Bump nötig). Gesperrte
  Regler behalten ihren Wert, wenn ein anderer Regler verstellt wird; der
  Rest bis 100% verteilt sich unter den verbleibenden, nicht gesperrten
  Reglern proportional zu ihrem bisherigen Anteil (bei allen auf 0
  gleichmäßig). Reicht der freie Platz nicht aus (z. B. alle vier
  anderen Regler gesperrt), wird der gerade bediente Regler entsprechend
  gekappt, statt die gesperrten Werte zu verletzen
  (`js/data/economy.js` `normalizeSlidersWithLocks`, ersetzt
  `normalizeSliders` als Normalisierung für manuelle Slider-Eingaben;
  `normalizeSliders` bleibt für die Fälle ohne Sperr-Kontext bestehen).

  Verifiziert: `normalizeSlidersWithLocks` per direktem Modul-Aufruf für
  drei Szenarien (ein gesperrter Regler, zwei gesperrte Regler mit
  Kappung des gezogenen Reglers, alle vier anderen gesperrt); Summe in
  allen Fällen exakt 100. Vollständiger Durchlauf in der Live-UI: Dialog
  öffnet mit korrekten Karten, Schloss-Klick sperrt/entsperrt (aktive
  Färbung), Regler-Drag verteilt den Rest live und korrekt unter den
  freien Reglern, Zustand ist danach im echten Planeten-Objekt persistiert
  und übersteht 40 simulierte Runden unverändert.

- **v0.26 – Flotten aufteilen neu gestaltet & friedliche Erkundung**
  Nutzer-Feedback: der Aufteilen-Befehl fühlte sich an, als würde er ein
  zufälliges Schiff entfernen – Ursache war die alte Inline-Eingabe (ein
  Zahlenfeld + eigener "Aufteilen"-Button PRO Schiffstyp-Zeile einer
  Flotte): bei mehreren Schiffstypen in einer Flotte war leicht der
  falsche Zeilen-Button getroffen, ohne dass vorher klar war, wie viele
  Schiffe dieser Typ überhaupt gerade hatte.

  **Neuer Aufteilen-Dialog** (`#splitfleet-dialog`, `js/ui.js`
  `renderSplitFleetDialog`): ein Klick auf "Aufteilen" (jetzt ein
  einzelner Button pro Flotte, nicht mehr pro Stack) öffnet ein Fenster
  mit zwei Spalten. Links die "Bestehende Flotte" mit "−"/"+" hinter jeder
  Zeile, rechts die reine Anzeige der "Neuen Flotte". "−" verschiebt ein
  Schiff dieses Typs nach rechts, "+" wieder zurück; beide Buttons sind
  deaktiviert, wenn auf der jeweiligen Seite nichts zu verschieben ist.
  Die Verschiebung ist rein clientseitig (Entwurf im Dialog), bis "OK" sie
  in einem Rutsch über die neue `js/fleets.js` `splitFleetMulti(galaxy,
  fleetId, transfers)` anwendet – transfers ist eine
  {designId: Anzahl}-Zuordnung für BELIEBIG viele Schiffstypen auf einmal,
  ersetzt das alte `splitStack` (nur ein Typ pro Aufruf). "Abbrechen"
  verwirft den Entwurf.

  **Auto-Erkundung in umkämpftem Gebiet** (Nutzer-Feedback: "die Schiffe
  sollen immer nach unentdeckten Systemen suchen und diese auch anfliegen,
  auch wenn diese in feindlichen ... Gebieten liegen"): Sternenstraßen-
  Pfadfindung und Treibstoffreichweiten-Prüfung kannten ohnehin keine
  Gebietsgrenzen – blockiert wurde de facto nur durch das anschließende
  Gefecht, wenn eine Erkunder-Flotte an einem von feindlichen Kampfflotten
  besetzten System landete und dort zerstört wurde. Neue Regel in
  `js/economy.js` `resolveAllCombats`: sind an einem System AUSSCHLIESSLICH
  Erkunder-Flotten (`fleet.autoExplore === true`) verschiedener,
  verfeindeter Imperien anwesend, löst das KEIN Gefecht aus – sie
  koexistieren friedlich ("Schiffe im Erkundungsmodus attackieren keine
  feindlichen Schiffe"). Sobald mindestens ein Imperium dort auch nur eine
  reguläre (nicht erkundende) Flotte stehen hat, gilt der normale Kampf wie
  gehabt – anwesende Erkunder-Flotten kämpfen dann mit und können dabei
  zerstört werden ("können aber attackiert werden"). Die
  Auto-Erkundungs-Berechtigung selbst (nur reine Small-Rumpf-Flotten, siehe
  `isFleetEligibleForAutoExplore`, ROADMAP v0.15) war bereits korrekt und
  blieb unverändert.

  Verifiziert: `splitFleetMulti` und die neue Dialog-Logik per direktem
  Modul-Aufruf (Mehrfach-Stack-Flotte, +/- Buttons bewegen die richtige
  Anzahl in beide Richtungen, Buttons korrekt deaktiviert, OK wendet den
  Entwurf exakt an); vollständiger Durchlauf über echte Klicks in der
  Live-UI inkl. Speicherung. Kampf-Ausnahme per direktem
  `simulateTurn`-Aufruf in zwei Szenarien verifiziert: zwei verfeindete
  reine Erkunder-Flotten am selben System erzeugen keinen Kampfbericht und
  überleben beide; eine Erkunder- und eine reguläre feindliche Flotte am
  selben System lösen weiterhin normalen Kampf aus. 50-Runden-Regression
  über die echte `simulateTurn`-Kette ohne Fehler.

- **v0.27 – Bugfix: interaktive Kämpfe gegen den Guardian of Orion**
  Nutzer-Feedback: "Interaktive Kämpfe funktioniert nicht. Obwohl die
  Option aktiv war wurde der Kampf gegen den Guardian automatisch
  ausgewürfelt." Ursache: `js/economy.js` `simulateTurn` rief für
  Guardian-Gefechte IMMER `resolveOrionGuardianCombat` (statistische
  Sofort-Auflösung) auf, unabhängig von der Interaktive-Kämpfe-Einstellung
  – ein komplett separater Codepfad neben der regulären
  `resolveAllCombats`/`pendingBattles`-Weiche für Zwei-Imperien-Gefechte,
  der die Einstellung schlicht nie geprüft hat.

  `simulateTurn` stellt ein Guardian-Gefecht jetzt genauso zurück
  (`galaxy.pendingBattles`), wenn der Spieler mit einer Flotte am
  Guardian-System steht und interaktive Kämpfe aktiv sind.
  `js/hexcombat.js` `createBattle` unterstützt den Guardian jetzt als
  besonderen zweiten Gegner (`buildGuardianUnit`, `MONSTER_EMPIRE_ID`
  statt eines echten Imperiums) – er ist kein Eintrag in `galaxy.fleets`
  und hat keine Spezialfähigkeiten/Schiffsdesign, daher ein eigener,
  minimaler Einheiten-Baustein statt der Design-Lookup-Logik für reguläre
  Flotten. Die Nachbearbeitung (Sieg-Belohnungen: Death-Ray-Technologie
  und Miniaturisierungsbonus auf alle Disziplinen, `galaxy.orion.
  guardianAlive`/`defeatedByEmpireId` für den Highscore) ist als
  `finalizeGuardianCombat` aus `js/orion.js` `resolveOrionGuardianCombat`
  herausgezogen und wird jetzt von beiden Pfaden geteilt – der neuen
  `applyInteractiveGuardianResult` (Kampf-Grid) und der bestehenden
  Auto-Auflösung. Auch "Automatisch auflösen" INNERHALB des Kampf-Grids
  (`resolvePendingBattleAuto`) kennt den Guardian jetzt, statt bei nur
  einer "echten" Partei am System (der Guardian selbst ist ja keine
  Flotte) folgenlos leerzulaufen.

  Verifiziert über echte Klicks in der Live-UI: mit aktivierter
  Einstellung öffnet "Runde beenden" am Guardian-System jetzt das
  Kampf-Grid statt automatisch auszuwürfeln, Guardian erscheint als
  eigene rot markierte Einheit (10.000 HP) auf der gegnerischen Seite;
  Niederlage- UND Sieg-Szenario je einmal per "Automatisch auflösen"
  innerhalb des Grids durchgespielt – Niederlage lässt den Guardian am
  Leben und meldet den Kampfbericht korrekt, Sieg setzt
  `guardianAlive: false`, `defeatedByEmpireId` korrekt und schaltet
  Death-Ray-Technologie sowie den Miniaturisierungsbonus frei. Reguläres
  Zwei-Imperien-Kampf-Grid per Regressionstest unverändert funktionsfähig
  (`isGuardianBattle: false`). 40-Runden-Regression ohne Fehler.

- **v0.28 – Bugfix: "Geisterschiffe" durch Verschrotten während im Einsatz**
  Nutzer-Feedback: "Wenn sich zwei Flotten in einem System befinden kann
  ich die feindliche Flotte nicht aktiv angreifen. Stattdessen endet jede
  Schlacht mit 0 Verlusten auf beiden Seiten." Nach ausführlicher, zunächst
  erfolgloser Fehlersuche (direkte Kampf-Engine-Aufrufe, passiver-Spieler-
  KI-Szenario, vollständiger Klick-Durchlauf durchs echte Kampf-Grid –
  überall korrektes, entscheidendes Kampfergebnis) lieferte ein vom Nutzer
  geschickter echter Kampfbericht-Screenshot den entscheidenden Hinweis:
  Sieger stand fest, aber "0 Schiffe verloren" auf BEIDEN Seiten und
  "Keine Schiffe zerstört" – ein Kampf mit 0 Runden.

  Ursache: `js/shipDesign.js` `scrapShipDesign` entfernte ein Design bisher
  bedingungslos aus `empire.shipDesigns`, auch wenn noch Schiffe dieses
  Designs in aktiven Flotten unterwegs waren (leicht auszulösen, sobald das
  6-Design-Limit erreicht ist und ein Design verschrottet werden muss, um
  Platz für ein neues zu schaffen – siehe ROADMAP v0.4). Für den Kampf sind
  Stacks ohne passendes Design unsichtbar (`js/combat.js` `buildUnits`
  überspringt sie – dieselbe Logik, die absichtlich Kolonieschiffe vom
  Kampf ausnimmt) und werden von `js/economy.js` `applyBattleResult`
  fälschlich als "nicht-kämpfende Fracht" behandelt: sie überleben JEDES
  Gefecht unbeschadet, kämpfen aber selbst nie mit. Bestand die gegnerische
  Flotte an einem System nur noch aus solchen Geisterschiffen, erzeugte das
  einen Kampf mit 0 Runden, 0 Verlusten auf beiden Seiten und einem
  automatischen Sieger – Runde für Runde erneut, da die Geisterflotte nie
  verschwand.

  `scrapShipDesign` verweigert das Verschrotten jetzt (mit Fehlermeldung),
  solange noch Schiffe dieses Designs in einer eigenen Flotte existieren.
  Für bereits bestehende, davon betroffene Spielstände sorgt die neue
  `js/fleets.js` `purgeGhostDesignStacks` (aufgerufen ganz zu Beginn jeder
  `simulateTurn`, noch vor der Kampfauflösung derselben Runde) dafür, dass
  vorhandene Geisterschiff-Stacks entfernt werden – erkannt daran, dass
  ihre designId weder das Kolonieschiff-Sentinel noch ein aktuelles Design
  ihres Imperiums ist.

  Verifiziert: `scrapShipDesign` blockiert das Verschrotten eines
  Designs mit Schiffen im Feld (per direktem Aufruf UND über einen echten
  Klick auf "Verschrotten" in der Live-UI, inkl. korrekter Fehlermeldung
  in der Kopfleiste) und erlaubt es wieder, sobald keine Schiffe dieses
  Designs mehr existieren; `purgeGhostDesignStacks` entfernt eine
  reproduzierte Geisterflotte korrekt (kein Geister-Fleet-Rest, kein
  fauler 0-Runden-Kampfbericht mehr), lässt Kolonieschiff-Stacks
  unangetastet (9 vor/nach Testlauf) und die reale eigene Flotte
  unverändert. 40-Runden-Regression ohne Fehler.

## Weitere Post-Prototyp-Releases

- Polish-Kandidaten: interaktives Kampf-Grid auch für galaktische
  Zufallsereignis-Kämpfe, tatsächliche Musik-/Soundeffekt-
  Dateien für die in v0.21 gebaute Audio-Infrastruktur

## Grafik-Pipeline

Rassen-Portraits und Planeten-Umwelt-Icons wurden über ChatGPT
(Bildgenerierung, via Claude-in-Chrome-Erweiterung im eingeloggten Account)
erzeugt und liegen unter `assets/images/`. Schiffs-Sprites folgen bei
Bedarf nach demselben Verfahren.
