import { getEnvironment } from "./data/environments.js";
import { getRichness } from "./data/richness.js";
import { getPlanetSize } from "./data/planetSizes.js";
import { getDifficulty } from "./data/difficulty.js";
import { initEmpireResearch, processResearchTurn, applyTechEffect } from "./research.js";
import { computeDesignStats } from "./shipDesign.js";
import { addShipsToSystem, advanceFleets, isSystemInRange } from "./fleets.js";
import { resolveSystemCombat } from "./combat.js";
import { DEFAULT_TRAVEL_SPEED, DEFAULT_TRAVEL_RANGE_PARSEC } from "./data/logistics.js";
import { getRaceTraits } from "./data/raceTraits.js";
import { runAiTurn } from "./ai.js";
import { isAtWar, tickTradeAgreements } from "./diplomacy.js";
import { checkCouncilActivation, checkCouncilVoteDue } from "./council.js";
import { checkGameEnd } from "./victory.js";
import { resolveOrionGuardianCombat, isOrionGuarded } from "./orion.js";
import { maybeTriggerGalacticEvent } from "./events.js";
import { ESPIONAGE_GENERATION_RATE, DEFAULT_ESPIONAGE_ALLOCATION_PCT } from "./data/espionage.js";
import {
  BASE_BC_PER_POP,
  BASE_BC_PER_FACTORY,
  ROBOTIC_CONTROLS_BASE,
  FACTORY_COST_BC,
  WASTE_PER_FACTORY,
  DEFAULT_ECO_CLEANUP_UNITS_PER_BC,
  MAX_GROWTH_RATE,
  COLONY_SHIP_COST_BC,
  START_COLONY_POPULATION,
  HOMEWORLD_START_POPULATION,
  HOMEWORLD_START_FACTORIES,
  DEFAULT_SLIDERS,
} from "./data/economy.js";

export function maxPopulation(planet, empire) {
  const size = getPlanetSize(planet.size);
  const env = getEnvironment(planet.environment);
  const base = (size.basePopCapacity * env.habitability) / 100;
  const withMultiplier = base * (empire?.popCapacityMultiplier ?? 1);
  const withBonus = withMultiplier + (empire?.popCapacityFlatBonus ?? 0);
  return Math.max(1, Math.round(withBonus));
}

export function isColonizable(planet, empire) {
  if (planet.colonizedBy !== null && planet.colonizedBy !== undefined) return false;
  if (empire?.instantColonization) return true; // Silicoiden: sofortige Besiedlung aller Welten
  const env = getEnvironment(planet.environment);
  const techLevel = empire?.planetologyTechLevel ?? 0;
  return env.techReq <= techLevel;
}

export function initEmpireEconomy(empire, seed, difficultyId = "normal") {
  const difficulty = getDifficulty(difficultyId);
  const traits = getRaceTraits(empire.raceId);
  const base = {
    ...empire,
    colonyShips: 1,
    shipProgress: 0,
    defenseBudget: 0,
    planetologyTechLevel: 0,
    roboticControlsLevel: ROBOTIC_CONTROLS_BASE + (traits.roboticControlsBonus ?? 0),
    factoryCostBC: FACTORY_COST_BC,
    wasteGenerationMultiplier: traits.pollutionImmune ? 0 : 1,
    ecoCleanupUnitsPerBC: DEFAULT_ECO_CLEANUP_UNITS_PER_BC,
    popCapacityMultiplier: 1,
    popCapacityFlatBonus: 0,
    researchCostFactor: difficulty.researchCostFactor,
    lastResearchIncome: 0,
    travelSpeedParsec: DEFAULT_TRAVEL_SPEED,
    travelRangeParsec: DEFAULT_TRAVEL_RANGE_PARSEC,
    shipDesigns: [],
    attackBonus: traits.attackBonus ?? 0,
    ecmDefense: 0,
    groundArmorBonus: 0,
    groundShieldBonus: 0,
    bioWeaponKillMillions: 0,
    bioAntidoteReduceMillions: 0,
    groundCombatMultiplier: 1 + (traits.groundCombatBonus ?? 0) / 100, // Bulrathi: +20% Bodenkampfeffektivität
    espionagePoints: 0,
    espionageAllocationPct: DEFAULT_ESPIONAGE_ALLOCATION_PCT,
    maneuverBonus: traits.maneuverBonus ?? 0,
    productionMultiplier: 1 + (traits.productionBonusPct ?? 0) / 100,
    popProductionMultiplier: traits.popProductionMultiplier ?? 1,
    researchMultiplier: 1 + (traits.researchBonusPct ?? 0) / 100,
    growthRateMultiplier: traits.growthRateMultiplier ?? 1,
    instantColonization: traits.instantColonization ?? false,
    pollutionImmune: traits.pollutionImmune ?? false,
  };
  const { research, initialBreakthroughs } = initEmpireResearch(seed, empire.id, empire.raceId);
  base.research = research;
  // Level-1-Technologien gelten laut Analyse-Dokument als zu Spielbeginn
  // bereits erforscht (initiales Forschungslevel ≈ 1) und wirken sofort.
  for (const tech of initialBreakthroughs) applyTechEffect(base, tech);
  return base;
}

export function computePlanetProduction(planet, empire) {
  const richness = getRichness(planet.richness);
  const maxPop = maxPopulation(planet, empire);
  const roboticControls = empire?.roboticControlsLevel ?? ROBOTIC_CONTROLS_BASE;
  const activeFactories = Math.min(planet.factories, Math.floor(planet.population * roboticControls));

  const popProductionMultiplier = empire?.popProductionMultiplier ?? 1; // Klackons: verdoppelte Basisproduktion
  const productionMultiplier = empire?.productionMultiplier ?? 1; // Menschen: +20% Handelsbonus
  const researchMultiplier = empire?.researchMultiplier ?? 1; // Psilons: +50% Forschung

  const baseBC = planet.population * BASE_BC_PER_POP * popProductionMultiplier;
  const factoryBC = activeFactories * BASE_BC_PER_FACTORY * richness.multiplier;
  const totalBC = (baseBC + factoryBC) * productionMultiplier;

  const s = planet.sliders;
  const bc = {
    ship: (totalBC * s.ship) / 100,
    def: (totalBC * s.def) / 100,
    ind: (totalBC * s.ind) / 100,
    eco: (totalBC * s.eco) / 100,
    tech: ((totalBC * s.tech) / 100) * researchMultiplier,
  };

  const factoryCostBC = empire?.factoryCostBC ?? FACTORY_COST_BC;
  const wasteGenerationMultiplier = empire?.wasteGenerationMultiplier ?? 1;
  const ecoCleanupUnitsPerBC = empire?.ecoCleanupUnitsPerBC ?? DEFAULT_ECO_CLEANUP_UNITS_PER_BC;

  const wasteGenerated = activeFactories * WASTE_PER_FACTORY * wasteGenerationMultiplier;
  const wasteCleanable = bc.eco * ecoCleanupUnitsPerBC;
  const wasteRemaining = Math.max(0, wasteGenerated - wasteCleanable);
  const pollutionPenalty = wasteGenerated > 0 ? Math.min(0.5, wasteRemaining / wasteGenerated) : 0;

  return {
    totalBC,
    bc,
    activeFactories,
    maxPop,
    wasteGenerated,
    wasteRemaining,
    pollutionPenalty,
    factoryCostBC,
    roboticControls,
  };
}

// Simuliert eine Runde für die gesamte Galaxie: Produktion, Fabrikbau,
// Verschmutzung, Bevölkerungswachstum, Kolonieschiff-Ansparung, Forschung.
export function simulateTurn(galaxy) {
  const empireById = new Map(galaxy.empires.map((e) => [e.id, e]));
  const empireDeltas = new Map(galaxy.empires.map((e) => [e.id, { techBC: 0, shipBC: 0, defBC: 0, totalBC: 0 }]));
  const turnForAi = galaxy.turn ?? 1;

  for (const empire of galaxy.empires) {
    if (!empire.isPlayer) runAiTurn(galaxy, empire, galaxy.seed, turnForAi);
  }

  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.colonizedBy === null || planet.colonizedBy === undefined) continue;
      const empire = empireById.get(planet.colonizedBy);

      const prod = computePlanetProduction(planet, empire);

      // Industrie: neue Fabriken bauen, Rest in nächste Runde übertragen
      const indFund = prod.bc.ind + (planet.indCarry ?? 0);
      const newFactories = Math.floor(indFund / prod.factoryCostBC);
      planet.indCarry = indFund - newFactories * prod.factoryCostBC;
      const factoryCap = Math.ceil(prod.maxPop * prod.roboticControls * 1.5);
      planet.factories = Math.min(factoryCap, planet.factories + newFactories);

      // Bevölkerungswachstum: Glockenkurve mit Scheitel bei 50% Kapazität,
      // gedämpft durch nicht beseitigte Verschmutzung.
      const x = Math.min(1, planet.population / prod.maxPop);
      const growthRateMultiplier = empire?.growthRateMultiplier ?? 1; // Sakkra ×2, Silicoiden ×0,5
      const growthRate = MAX_GROWTH_RATE * 4 * x * (1 - x) * (1 - prod.pollutionPenalty) * growthRateMultiplier;
      planet.population = Math.min(prod.maxPop, Math.max(0.1, planet.population + planet.population * growthRate));

      planet.lastProduction = prod;

      const delta = empireDeltas.get(planet.colonizedBy);
      if (delta) {
        delta.techBC += prod.bc.tech;
        delta.defBC += prod.bc.def;
        delta.totalBC += prod.totalBC;

        const design = planet.productionTarget
          ? empire?.shipDesigns.find((d) => d.id === planet.productionTarget)
          : null;
        if (design) {
          // Planet baut ein Kriegsschiff-Design statt Kolonieschiffe (siehe
          // ROADMAP v0.4): Ship-Slider-BC fließt in dieses Design, fertige
          // Schiffe erscheinen als Stack in einer Flotte im Heimatsystem.
          const stats = computeDesignStats(design, empire);
          const fund = prod.bc.ship + (planet.shipCarry ?? 0);
          const built = stats.costBC > 0 ? Math.floor(fund / stats.costBC) : 0;
          planet.shipCarry = fund - built * stats.costBC;
          if (built > 0) addShipsToSystem(galaxy, planet.colonizedBy, system.id, design.id, built);
        } else {
          delta.shipBC += prod.bc.ship;
        }
      }
    }
  }

  // Handelsabkommen zählen eine Runde weiter und speisen ihren aktuellen
  // BC-Ertrag (ggf. negativ während der Anlaufphase) anteilig in Forschung,
  // Verteidigung und Kolonieschiff-Fortschritt beider Vertragspartner ein
  // (siehe js/diplomacy.js, ROADMAP v0.9).
  for (const { empireIdA, empireIdB, bonusBC } of tickTradeAgreements(galaxy)) {
    for (const empireId of [empireIdA, empireIdB]) {
      const delta = empireDeltas.get(empireId);
      if (!delta) continue;
      delta.techBC += bonusBC * 0.4;
      delta.defBC += bonusBC * 0.3;
      delta.shipBC += bonusBC * 0.3;
      delta.totalBC += bonusBC;
    }
  }

  const turn = galaxy.turn ?? 1;
  const breakthroughsByEmpire = new Map();

  for (const empire of galaxy.empires) {
    const delta = empireDeltas.get(empire.id);
    if (!delta) continue;
    empire.defenseBudget += delta.defBC;
    empire.lastResearchIncome = delta.techBC;
    empire.espionagePoints = (empire.espionagePoints ?? 0) +
      delta.totalBC * (empire.espionageAllocationPct / 100) * ESPIONAGE_GENERATION_RATE;

    empire.shipProgress += delta.shipBC;
    const newShips = Math.floor(empire.shipProgress / COLONY_SHIP_COST_BC);
    if (newShips > 0) {
      empire.colonyShips += newShips;
      empire.shipProgress -= newShips * COLONY_SHIP_COST_BC;
    }

    const breakthroughs = processResearchTurn(empire, delta.techBC, galaxy.seed, turn);
    if (breakthroughs.length > 0) breakthroughsByEmpire.set(empire.id, breakthroughs);
  }

  const arrivals = advanceFleets(galaxy);
  const battleReports = resolveAllCombats(galaxy);

  // Guardian of Orion (ROADMAP v0.10): unabhängig vom Diplomatiestatus, da
  // der Guardian an keiner Diplomatie teilnimmt.
  const guardianReport = resolveOrionGuardianCombat(galaxy);
  if (guardianReport) battleReports.push(guardianReport);

  // Galaktische Zufallsereignisse (ROADMAP v0.10): Kampf-förmige Ereignisse
  // (Weltraum-Monster mit Verteidigern) laufen über dieselbe
  // Battle-Report-Anzeige, reine Schadensereignisse (Komet/Supernova) als
  // separate Meldung.
  const galacticEvent = maybeTriggerGalacticEvent(galaxy);
  if (galacticEvent?.isGuardianBattle) {
    battleReports.push(galacticEvent);
  }

  galaxy.turn = turn + 1;
  const gameEnd = checkGameEnd(galaxy);

  // Galaktischer Rat (ROADMAP v0.9): nur prüfen, wenn die Partie nicht
  // bereits regulär endet. Eine fällige Sitzung erfordert eine echte
  // Spielerentscheidung (js/main.js) und wird daher hier nur gemeldet, nicht
  // automatisch aufgelöst.
  let councilVote = null;
  if (!gameEnd) {
    checkCouncilActivation(galaxy);
    councilVote = checkCouncilVoteDue(galaxy);
  }

  return {
    breakthroughsByEmpire,
    arrivals,
    battleReports,
    gameEnd,
    councilVote,
    galacticEvent: galacticEvent && !galacticEvent.isGuardianBattle ? galacticEvent : null,
  };
}

// Löst an jedem System, an dem stationäre Flotten mehrerer Imperien
// aufeinandertreffen, ein automatisches Gefecht aus (siehe js/combat.js) und
// baut die beteiligten Flotten anschließend aus den Überlebenden neu auf.
function resolveAllCombats(galaxy) {
  const reports = [];
  const systemIds = new Set(
    galaxy.fleets.filter((f) => !f.destinationSystemId).map((f) => f.systemId)
  );

  for (const systemId of systemIds) {
    const fleetsHere = galaxy.fleets.filter((f) => f.systemId === systemId && !f.destinationSystemId);
    const empireIds = [...new Set(fleetsHere.map((f) => f.ownerEmpireId))];
    if (empireIds.length < 2) continue;

    // Vereinfachung: Kampf löst nur aus, wenn sich ALLE hier anwesenden
    // Imperien paarweise im Krieg befinden (kein Nichtangriffspakt-Dreieck).
    let allAtWar = true;
    for (let i = 0; i < empireIds.length && allAtWar; i++) {
      for (let j = i + 1; j < empireIds.length; j++) {
        if (!isAtWar(galaxy, empireIds[i], empireIds[j])) {
          allAtWar = false;
          break;
        }
      }
    }
    if (!allAtWar) continue;

    const result = resolveSystemCombat(fleetsHere, galaxy.empires);
    if (!result) continue;

    galaxy.fleets = galaxy.fleets.filter((f) => !(f.systemId === systemId && !f.destinationSystemId));

    for (const [empireId, stacks] of result.survivorsByEmpire) {
      if (stacks.length === 0) continue;
      galaxy.fleets.push({
        id: `fleet-${galaxy.nextFleetId++}`,
        ownerEmpireId: empireId,
        systemId,
        destinationSystemId: null,
        stacks,
      });
    }

    reports.push({ systemId, ...result });
  }

  return reports;
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
  if (isOrionGuarded(galaxy, systemId)) {
    return { ok: false, reason: "Der Guardian of Orion bewacht dieses System noch." };
  }
  // Kolonieschiffe unterliegen derselben Treibstoffreichweite wie
  // Kampfflotten (ROADMAP v0.10), siehe js/fleets.js isSystemInRange.
  if (!isSystemInRange(galaxy, empire, system)) {
    const range = empire.travelRangeParsec ?? DEFAULT_TRAVEL_RANGE_PARSEC;
    return { ok: false, reason: `Ziel außerhalb der Treibstoffreichweite (${range} Parsec ab eigenen Kolonien).` };
  }

  empire.colonyShips -= 1;
  planet.colonizedBy = empireId;
  initColony(planet, { isHomeworld: false });
  return { ok: true };
}

export function initColony(planet, { isHomeworld = false } = {}) {
  planet.population = isHomeworld ? HOMEWORLD_START_POPULATION : START_COLONY_POPULATION;
  planet.factories = isHomeworld ? HOMEWORLD_START_FACTORIES : 0;
  planet.sliders = { ...DEFAULT_SLIDERS };
  planet.indCarry = 0;
}
