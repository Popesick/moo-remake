// Umrechnung Karten-Pixel <-> Parsec für Flottenbewegung (v0.4). Bei diesem
// Wert liegen benachbarte Systeme (siehe js/galaxyGen.js minDist) etwa 4-10
// Parsec auseinander, passend zu den Flottenreichweiten-Technologien
// (Fuel Cells 4-10 Parsec) aus docs/techtree-analyse.docx.
export const PARSEC_PIXELS = 40;
export const DEFAULT_TRAVEL_SPEED = 1; // Retro Engines (Level 1, immer erforscht)

// Flottenreichweite (ROADMAP v0.10): jedes Ziel außerhalb eines Kreisradius
// um die eigenen Kolonien ist ohne ausreichende Fuel-Cell-Forschung
// (js/data/techTree.js, Propulsion) nicht erreichbar; Reisen zwischen zwei
// eigenen Systemen ist davon unabhängig immer uneingeschränkt möglich
// (siehe js/fleets.js isSystemInRange). Die MoO2-Vorlage nennt 4 Parsec
// Basisreichweite – empirisch liegen benachbarte Systeme in diesem Remake
// (bei PARSEC_PIXELS=40) aber typischerweise 4-9 Parsec auseinander, ein
// Wert von 4 würde die meisten Partien am Heimatsystem festnageln. Die
// Parsec-Stufen sind daher gegenüber der Vorlage proportional hochskaliert,
// damit nahe Nachbarsysteme von Beginn an erreichbar bleiben und trotzdem
// eine spürbare Progression bis zur unbegrenzten Reichweite (Thorium Cells)
// besteht.
export const DEFAULT_TRAVEL_RANGE_PARSEC = 8;
// Ersetzt "unbegrenzt" (Thorium Cells) durch einen großen endlichen Wert,
// da Infinity nicht JSON-serialisierbar ist (würde beim Speichern zu null).
export const UNLIMITED_TRAVEL_RANGE_PARSEC = 9999;
