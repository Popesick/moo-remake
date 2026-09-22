// Wirtschafts-Konstanten für den Prototyp. BASE_BC_PER_POP, BASE_BC_PER_FACTORY
// und FACTORY_COST_BC sind aus docs/techtree-analyse.docx belegt ("Jeder
// Arbeiter erwirtschaftet initial 0,5 BC, während jede aktive Fabrik exakt
// 1 BC produziert"; Fabrik-Basiskosten 10 BC vor Industrial-Tech-Rabatten).
// Die übrigen Werte (Wachstumsrate, Kolonieschiff-Kosten, Start-Bevölkerung)
// sind eigene, spielbare Platzhalter und über diese Datei zentral tunbar.
export const BASE_BC_PER_POP = 0.5;
export const BASE_BC_PER_FACTORY = 1;
export const ROBOTIC_CONTROLS_BASE = 2; // Fabriken pro Bevölkerungseinheit vor Tech (Robotics Controls 2, Level 1)
export const FACTORY_COST_BC = 10;
export const WASTE_PER_FACTORY = 0.25;
export const DEFAULT_ECO_CLEANUP_UNITS_PER_BC = 1; // 1 BC beseitigt 1 Einheit Verschmutzung vor Eco-Restoration-Techs
export const MAX_GROWTH_RATE = 0.18; // Wachstumsrate am Scheitelpunkt (50% Kapazität) pro Runde
export const COLONY_SHIP_COST_BC = 60;
export const START_COLONY_POPULATION = 1;
export const HOMEWORLD_START_POPULATION = 30;
export const HOMEWORLD_START_FACTORIES = 8;

export const DEFAULT_SLIDERS = { ship: 20, def: 10, ind: 30, eco: 20, tech: 20 };

export function normalizeSliders(sliders) {
  const sum = sliders.ship + sliders.def + sliders.ind + sliders.eco + sliders.tech;
  if (sum === 0) return { ...DEFAULT_SLIDERS };
  const scale = 100 / sum;
  const out = {
    ship: sliders.ship * scale,
    def: sliders.def * scale,
    ind: sliders.ind * scale,
    eco: sliders.eco * scale,
    tech: sliders.tech * scale,
  };
  return out;
}
