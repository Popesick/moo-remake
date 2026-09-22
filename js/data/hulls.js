// Schiffsrumpfgrößen, siehe design-analyse.docx ("Schiffsdesign, Logistik
// und das 6-Slot-Limit"): Small/Medium/Large/Huge. Raumkapazität (space) und
// Grundkosten sind im Analyse-Dokument nicht beziffert und daher plausible,
// über diese Datei zentral tunbare Platzhalter. baseHP stammt aus der
// Titanium-Armor-Basispanzerung in docs/techtree-analyse.docx (3/18/100/600).
export const HULLS = [
  { id: "small", name: "Small (Klein)", space: 30, baseCostBC: 15, baseHP: 3, evasionBonus: 2 },
  { id: "medium", name: "Medium (Mittel)", space: 60, baseCostBC: 40, baseHP: 18, evasionBonus: 1 },
  { id: "large", name: "Large (Groß)", space: 140, baseCostBC: 100, baseHP: 100, evasionBonus: 0 },
  { id: "huge", name: "Huge (Riesig)", space: 300, baseCostBC: 250, baseHP: 600, evasionBonus: 0 },
];

export const MAX_SHIP_DESIGNS = 6; // hartes Design-Limit, siehe ROADMAP v0.4

export function getHull(id) {
  return HULLS.find((h) => h.id === id);
}
