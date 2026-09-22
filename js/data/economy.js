// Wirtschafts-Konstanten für den Prototyp. Die Original-Formeln im
// Analyse-Dokument enthielten an mehreren Stellen nicht extrahierbare
// Zahlenwerte (verloren gegangene Formel-Grafiken/OMML). Die Werte hier
// sind plausible, spielbare Platzhalter im Sinne des beschriebenen Systems
// (5 Slider, Fabrik-Skalierung über Robotic Controls, Verschmutzung,
// Glockenkurven-Wachstum mit Scheitel bei 50% Kapazität) und über diese
// Datei zentral tunbar.
export const BASE_BC_PER_POP = 0.25;
export const BASE_BC_PER_FACTORY = 1;
export const ROBOTIC_CONTROLS_BASE = 2; // Fabriken pro Bevölkerungseinheit, siehe v0.3 (skaliert bis 7)
export const FACTORY_COST_BC = 20;
export const WASTE_PER_FACTORY = 0.25;
export const ECO_CLEANUP_BC_PER_WASTE = 0.5;
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
