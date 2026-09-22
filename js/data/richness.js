// Mineralischer Reichtum: skaliert die industrielle Produktivität.
// Multiplikatoren für Rich (2x) und Ultra-Rich (3x) sind im Analyse-Dokument
// explizit belegt; die übrigen Stufen sind plausible Zwischenwerte für den
// Prototyp und später feinjustierbar.
export const RICHNESS = [
  { id: "ultra_poor", name: "Ultra-Poor", multiplier: 0.25 },
  { id: "poor", name: "Poor", multiplier: 0.5 },
  { id: "abundant", name: "Abundant", multiplier: 1.0 },
  { id: "rich", name: "Rich", multiplier: 2.0 },
  { id: "ultra_rich", name: "Ultra-Rich", multiplier: 3.0 },
];

export const RICHNESS_WEIGHTS = [
  { id: "ultra_poor", weight: 10 },
  { id: "poor", weight: 25 },
  { id: "abundant", weight: 35 },
  { id: "rich", weight: 22 },
  { id: "ultra_rich", weight: 8 },
];

export function getRichness(id) {
  return RICHNESS.find((r) => r.id === id);
}
