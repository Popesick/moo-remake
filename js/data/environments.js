// Planetare Umweltkategorien, siehe docs/design-analyse.docx ("Planetare
// Eigenschaften, Habitabilität und mineralischer Reichtum"). techReq = Level
// der Planetologie-Technologie, die zur Kolonisierung nötig ist (0 = ohne
// Forschung besiedelbar), abgeglichen mit den konkreten "Controlled ... Env."
// Technologien aus docs/techtree-analyse.docx (js/data/techTree.js). Für
// Barren und Inferno ist dort keine eigene Kolonisierungs-Technologie
// gelistet, sie gelten daher als von Beginn an besiedelbar.
// habitability = relativer Wachstums-Basiswert für die Bevölkerungs-
// Glockenkurve (100 = Referenzwert Terranisch/Ozean), grobe Ableitung aus
// der Textbeschreibung, nicht aus exakten Originalwerten.
export const ENVIRONMENTS = [
  {
    id: "terran",
    name: "Terranisch / Ozean",
    techReq: 0,
    habitability: 100,
    note: "Basiswachstum, optimale Ausgangsbedingungen.",
  },
  {
    id: "tundra",
    name: "Tundra",
    techReq: 6,
    habitability: 70,
    note: "Reduziertes Wachstum, dient oft als Basis für weiteres Terraforming.",
  },
  {
    id: "barren",
    name: "Barren (Karg)",
    techReq: 0,
    habitability: 40,
    note: "Keine natürliche Atmosphäre, stark reduziertes Wachstum.",
  },
  {
    id: "dead",
    name: "Dead (Tot)",
    techReq: 9,
    habitability: 35,
    note: "Keine Biosphäre, stark reduziertes Wachstum.",
  },
  {
    id: "inferno",
    name: "Inferno",
    techReq: 0,
    habitability: 25,
    note: "Extreme Hitze, erfordert fortgeschrittene planetare Adaption.",
  },
  {
    id: "toxic",
    name: "Toxic (Toxisch)",
    techReq: 15,
    habitability: 18,
    note: "Extrem lebensfeindlich, höchste technologische Hürde vor radioaktiven Welten.",
  },
  {
    id: "radiated",
    name: "Radiated (Radioaktiv)",
    techReq: 18,
    habitability: 12,
    note: "Erfordert höchste Basis-Planetologie-Forschung für eine Besiedlung.",
  },
  {
    id: "gaia",
    name: "Gaia",
    techReq: 0,
    habitability: 150,
    note: "Erhöht die maximale planetare Bevölkerung um 50% und steigert das Wachstum drastisch.",
    rare: true,
  },
  {
    id: "artifact",
    name: "Artefaktwelt",
    techReq: 0,
    habitability: 70,
    note: "Verleiht bei Kolonisierung sofortigen Zugang zu fortschrittlichen Technologien und verdreifacht die Forschungsproduktion.",
    rare: true,
  },
];

// Relative Auftrittshäufigkeit bei der Galaxie-Generierung. Gaia/Artefaktwelt
// sind bewusst selten, um die strategische Bedeutung von Orion & Co. später
// zu unterstreichen (siehe ROADMAP v0.10).
export const ENVIRONMENT_WEIGHTS = [
  { id: "terran", weight: 18 },
  { id: "tundra", weight: 16 },
  { id: "barren", weight: 16 },
  { id: "dead", weight: 14 },
  { id: "inferno", weight: 12 },
  { id: "toxic", weight: 10 },
  { id: "radiated", weight: 8 },
  { id: "gaia", weight: 2 },
  { id: "artifact", weight: 2 },
];

export function getEnvironment(id) {
  return ENVIRONMENTS.find((e) => e.id === id);
}
