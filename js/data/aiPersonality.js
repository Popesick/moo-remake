// KI-Verhaltensmatrix: 6 Persönlichkeiten × 5 strategische Ziele, siehe
// design-analyse.docx ("KI-Verhalten und Systemlogik der Verhaltensmatrizen").
// warBias steuert die Kriegserklärungs-Neigung in js/ai.js (0 = nie aktiv
// Krieg erklären, 1 = sehr angriffslustig). erratic = Kriegserklärung per
// Zufallswurf unabhängig von Beziehungswert.
export const PERSONALITIES = [
  { id: "xenophobic", name: "Xenophobic", warBias: 0.3, treatyAverse: true },
  { id: "ruthless", name: "Ruthless", warBias: 0.5, opportunistic: true },
  { id: "aggressive", name: "Aggressive", warBias: 0.7 },
  { id: "erratic", name: "Erratic", warBias: 0.4, erratic: true },
  { id: "honorable", name: "Honorable", warBias: 0.1, keepsTreaties: true },
  { id: "pacifist", name: "Pacifist", warBias: 0.02, keepsTreaties: true },
];

// Slider-Gewichte (ship/def/ind/eco/tech, müssen nicht auf 100 summieren –
// werden normalisiert) und Forschungs-Fokus je strategischem Ziel.
export const OBJECTIVES = [
  {
    id: "expansionist",
    name: "Expansionist",
    focus: "Maximales Flottenwachstum, schnelle Kolonisierung",
    sliders: { ship: 35, def: 5, ind: 30, eco: 15, tech: 15 },
    research: { computer: 15, construction: 20, forcefields: 10, planetology: 25, propulsion: 20, weapons: 10 },
  },
  {
    id: "technologist",
    name: "Technologist",
    focus: "Fokus auf Forschungsbudget",
    sliders: { ship: 10, def: 10, ind: 20, eco: 10, tech: 50 },
    research: { computer: 20, construction: 15, forcefields: 15, planetology: 15, propulsion: 15, weapons: 20 },
  },
  {
    id: "militarist",
    name: "Militarist",
    focus: "Maximiert Schiffsbau, Waffen und Antriebe",
    sliders: { ship: 40, def: 15, ind: 20, eco: 5, tech: 20 },
    research: { computer: 15, construction: 10, forcefields: 15, planetology: 5, propulsion: 25, weapons: 30 },
  },
  {
    id: "ecologist",
    name: "Ecologist",
    focus: "Priorisiert Planetologie, Terraforming, Verschmutzungsreduktion",
    sliders: { ship: 10, def: 10, ind: 20, eco: 35, tech: 25 },
    research: { computer: 10, construction: 15, forcefields: 10, planetology: 40, propulsion: 10, weapons: 15 },
  },
  {
    id: "diplomat",
    name: "Diplomat",
    focus: "Strebt Allianzen und Handelsverträge an, fokussiert Defensive",
    sliders: { ship: 15, def: 30, ind: 20, eco: 15, tech: 20 },
    research: { computer: 20, construction: 15, forcefields: 25, planetology: 10, propulsion: 10, weapons: 20 },
    keepsTreaties: true,
  },
];

export function getPersonality(id) {
  return PERSONALITIES.find((p) => p.id === id) ?? PERSONALITIES[0];
}

export function getObjective(id) {
  return OBJECTIVES.find((o) => o.id === id) ?? OBJECTIVES[0];
}
