// Forschungskosten-Faktor k in BaseCost(level) = k * level^2, siehe
// design-analyse.docx ("Die Basis-Kosten ... skalieren quadratisch ...
// Wobei der [Faktor] von 20 auf der Stufe Simple bis 40 auf Impossible
// reicht.").
export const DIFFICULTIES = [
  { id: "simple", name: "Einfach", researchCostFactor: 20 },
  { id: "normal", name: "Normal", researchCostFactor: 26 },
  { id: "hard", name: "Schwer", researchCostFactor: 33 },
  { id: "impossible", name: "Unmöglich", researchCostFactor: 40 },
];

export function getDifficulty(id) {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}
