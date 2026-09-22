// Rassenspezifische Forschungskosten-Faktoren je Disziplin, siehe
// docs/techtree-analyse.docx ("Kalkulation der Forschungskosten und
// rassenspezifische Modifikatoren"): Poor/Average/Good/Excellent multiplizieren
// die Basiskosten einer Technologie.
export const RACE_FACTOR_VALUES = {
  poor: 1.25,
  average: 1.0,
  good: 0.8,
  excellent: 0.6,
};

const ALL_AVERAGE = {
  computer: "average",
  construction: "average",
  forcefields: "average",
  planetology: "average",
  propulsion: "average",
  weapons: "average",
};

// Quellenlage: Meklar/Computer, Klackons/Konstruktion, Menschen/Kraftfelder,
// Sakkra/Planetologie, Alkari/Antrieb, Mrrshan/Waffen und die generelle
// Silicoiden-Schwäche außerhalb der Computer sind im Analyse-Dokument
// ausdrücklich belegt. Bulrathi und Darlok sind dort nicht spezifiziert –
// ihre Werte hier sind plausible Platzhalter (Bulrathi als technikferne
// Krieger, Darlok als Spione ohne Schild-Fokus) und bei Bedarf in v0.6
// zusammen mit der vollen KI-Verhaltensmatrix zu verfeinern.
export const RACE_RESEARCH_FACTORS = {
  human: { ...ALL_AVERAGE, forcefields: "excellent" },
  alkari: { ...ALL_AVERAGE, propulsion: "excellent" },
  bulrathi: { ...ALL_AVERAGE, computer: "poor", forcefields: "poor" }, // unbestätigt
  darlok: { ...ALL_AVERAGE, forcefields: "poor" }, // unbestätigt
  klackon: { ...ALL_AVERAGE, construction: "excellent" },
  meklar: { ...ALL_AVERAGE, computer: "excellent" },
  mrrshan: { ...ALL_AVERAGE, weapons: "excellent" },
  psilon: {
    computer: "excellent",
    construction: "excellent",
    forcefields: "excellent",
    planetology: "excellent",
    propulsion: "excellent",
    weapons: "excellent",
  }, // "Proud Scholar": breiter Forschungsbonus statt einzelner Spezialisierung
  sakkra: { ...ALL_AVERAGE, planetology: "excellent" },
  silicoid: {
    computer: "good",
    construction: "poor",
    forcefields: "poor",
    planetology: "poor",
    propulsion: "poor",
    weapons: "poor",
  },
};

export function getResearchCostFactor(raceId, disciplineId) {
  const tier = RACE_RESEARCH_FACTORS[raceId]?.[disciplineId] ?? "average";
  return RACE_FACTOR_VALUES[tier];
}
