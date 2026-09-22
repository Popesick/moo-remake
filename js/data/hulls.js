// Schiffsrumpfgrößen: Small/Medium/Large/Huge, siehe design-analyse.docx
// ("Schiffsdesign, Logistik und das 6-Slot-Limit") und docs/
// shipklassen-analyse.docx. baseHP (3/18/100/600) und evasionBonus
// (Small +2, Medium +1, Large/Huge 0 auf Strahlen-/Raketenabwehr) sind aus
// Letzterem belegt. Raumkapazität (space) und Grundkosten sind in keiner
// der Analysen beziffert und daher plausible, hier zentral tunbare
// Platzhalter – bewusst mit steigenden Kosten pro Platzeinheit für größere
// Rümpfe, passend zur dort beschriebenen Kosteneffizienz kleiner Schiffe.
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
