import { getEnvironment } from "./data/environments.js";
import { getRichness } from "./data/richness.js";
import { getPlanetSize } from "./data/planetSizes.js";
import {
  BASE_BC_PER_POP,
  BASE_BC_PER_FACTORY,
  ROBOTIC_CONTROLS_BASE,
  FACTORY_COST_BC,
  WASTE_PER_FACTORY,
  ECO_CLEANUP_BC_PER_WASTE,
  MAX_GROWTH_RATE,
  COLONY_SHIP_COST_BC,
  START_COLONY_POPULATION,
  HOMEWORLD_START_POPULATION,
  HOMEWORLD_START_FACTORIES,
  DEFAULT_SLIDERS,
} from "./data/economy.js";

export function maxPopulation(planet) {
  const size = getPlanetSize(planet.size);
  const env = getEnvironment(planet.environment);
  return Math.max(1, Math.round((size.basePopCapacity * env.habitability) / 100));
}

export function isColonizable(planet, empire) {
  if (planet.colonizedBy !== null && planet.colonizedBy !== undefined) return false;
  const env = getEnvironment(planet.environment);
  const techLevel = empire?.planetologyTechLevel ?? 0;
  return env.techReq <= techLevel;
}

export function initEmpireEconomy(empire) {
  return {
    ...empire,
    colonyShips: 1,
    shipProgress: 0,
    defenseBudget: 0,
    researchPoints: 0,
    planetologyTechLevel: 0, // wird ab v0.3 durch den Techbaum erhöht
  };
}

export function initColony(planet, { isHomeworld = false } = {}) {
  planet.population = isHomeworld ? HOMEWORLD_START_POPULATION : START_COLONY_POPULATION;
  planet.factories = isHomeworld ? HOMEWORLD_START_FACTORIES : 0;
  planet.sliders = { ...DEFAULT_SLIDERS };
  planet.indCarry = 0;
}

export function computePlanetProduction(planet) {
  const richness = getRichness(planet.richness);
  const maxPop = maxPopulation(planet);
  const activeFactories = Math.min(planet.factories, Math.floor(planet.population * ROBOTIC_CONTROLS_BASE));

  const baseBC = planet.population * BASE_BC_PER_POP;
  const factoryBC = activeFactories * BASE_BC_PER_FACTORY * richness.multiplier;
  const totalBC = baseBC + factoryBC;

  const s = planet.sliders;
  const bc = {
    ship: (totalBC * s.ship) / 100,
    def: (totalBC * s.def) / 100,
    ind: (totalBC * s.ind) / 100,
    eco: (totalBC * s.eco) / 100,
    tech: (totalBC * s.tech) / 100,
  };

  const wasteGenerated = activeFactories * WASTE_PER_FACTORY;
  const wasteCleanable = bc.eco / ECO_CLEANUP_BC_PER_WASTE;
  const wasteRemaining = Math.max(0, wasteGenerated - wasteCleanable);
  const pollutionPenalty = wasteGenerated > 0 ? Math.min(0.5, wasteRemaining / wasteGenerated) : 0;

  return { totalBC, bc, activeFactories, maxPop, wasteGenerated, wasteRemaining, pollutionPenalty };
}

// Simuliert eine Runde für die gesamte Galaxie: Produktion, Fabrikbau,
// Verschmutzung, Bevölkerungswachstum, Kolonieschiff-Ansparung, Forschung.
export function simulateTurn(galaxy) {
  const empireDeltas = new Map(galaxy.empires.map((e) => [e.id, { researchPoints: 0, shipBC: 0, defBC: 0 }]));

  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.colonizedBy === null || planet.colonizedBy === undefined) continue;

      const prod = computePlanetProduction(planet);

      // Industrie: neue Fabriken bauen, Rest in nächste Runde übertragen
      const indFund = prod.bc.ind + (planet.indCarry ?? 0);
      const newFactories = Math.floor(indFund / FACTORY_COST_BC);
      planet.indCarry = indFund - newFactories * FACTORY_COST_BC;
      const factoryCap = Math.ceil(prod.maxPop * ROBOTIC_CONTROLS_BASE * 1.5);
      planet.factories = Math.min(factoryCap, planet.factories + newFactories);

      // Bevölkerungswachstum: Glockenkurve mit Scheitel bei 50% Kapazität,
      // gedämpft durch nicht beseitigte Verschmutzung.
      const x = Math.min(1, planet.population / prod.maxPop);
      const growthRate = MAX_GROWTH_RATE * 4 * x * (1 - x) * (1 - prod.pollutionPenalty);
      planet.population = Math.min(prod.maxPop, Math.max(0.1, planet.population + planet.population * growthRate));

      planet.lastProduction = prod;

      const delta = empireDeltas.get(planet.colonizedBy);
      if (delta) {
        delta.researchPoints += prod.bc.tech;
        delta.shipBC += prod.bc.ship;
        delta.defBC += prod.bc.def;
      }
    }
  }

  for (const empire of galaxy.empires) {
    const delta = empireDeltas.get(empire.id);
    if (!delta) continue;
    empire.researchPoints += delta.researchPoints;
    empire.defenseBudget += delta.defBC;

    empire.shipProgress += delta.shipBC;
    const newShips = Math.floor(empire.shipProgress / COLONY_SHIP_COST_BC);
    if (newShips > 0) {
      empire.colonyShips += newShips;
      empire.shipProgress -= newShips * COLONY_SHIP_COST_BC;
    }
  }

  galaxy.turn = (galaxy.turn ?? 1) + 1;
}

export function colonizePlanet(galaxy, systemId, planetId, empireId) {
  const empire = galaxy.empires.find((e) => e.id === empireId);
  if (!empire || empire.colonyShips < 1) {
    return { ok: false, reason: "Kein Kolonieschiff verfügbar." };
  }
  const system = galaxy.systems.find((s) => s.id === systemId);
  const planet = system?.planets.find((p) => p.id === planetId);
  if (!planet) return { ok: false, reason: "Planet nicht gefunden." };
  if (!isColonizable(planet, empire)) {
    return { ok: false, reason: "Planet ist mit aktueller Technologie nicht kolonisierbar." };
  }

  empire.colonyShips -= 1;
  planet.colonizedBy = empireId;
  initColony(planet, { isHomeworld: false });
  return { ok: true };
}
