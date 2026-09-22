// Rassenspezifische Regelbrüche, siehe design-analyse.docx ("Asymmetrisches
// Fraktionsdesign und Verhaltensmatrizen"). Wirkt zusätzlich zu den
// Forschungskosten-Faktoren aus js/data/raceResearch.js. Angriffs-/
// Ausweichboni sind additiv zu den technologiebasierten Werten aus v0.5.
export const RACE_TRAITS = {
  human: { productionBonusPct: 20 },
  alkari: { maneuverBonus: 3 },
  bulrathi: { groundCombatBonus: 20 },
  darlok: {}, // Spionage-/Framing-Vorteile sind direkt in js/espionage.js verdrahtet (raceId === "darlok")
  klackon: { popProductionMultiplier: 2 },
  meklar: { roboticControlsBonus: 2 },
  mrrshan: { attackBonus: 4 },
  psilon: { researchBonusPct: 50 }, // + 75% Tech-Verfügbarkeit, siehe js/research.js
  sakkra: { growthRateMultiplier: 2 },
  silicoid: { pollutionImmune: true, instantColonization: true, growthRateMultiplier: 0.5 },
};

export function getRaceTraits(raceId) {
  return RACE_TRAITS[raceId] ?? {};
}
