import { getEnvironment } from "./data/environments.js";
import { getRichness } from "./data/richness.js";
import { getPlanetSize } from "./data/planetSizes.js";
import { getDifficulty } from "./data/difficulty.js";
import { initEmpireResearch, processResearchTurn, applyTechEffect } from "./research.js";
import { computeDesignStats } from "./shipDesign.js";
import {
  addShipsToSystem,
  advanceFleets,
  findColonyShipFleetAt,
  consumeColonyShip,
  sendFleet,
  isSystemInRange,
  findColonizeAssignment,
  findNearestIdleColonyShipFleet,
  extractSingleColonyShip,
  purgeGhostDesignStacks,
} from "./fleets.js";
import { resolveSystemCombat } from "./combat.js";
import { DEFAULT_TRAVEL_SPEED, DEFAULT_TRAVEL_RANGE_PARSEC } from "./data/logistics.js";
import { getRaceTraits } from "./data/raceTraits.js";
import { runAiTurn } from "./ai.js";
import { isAtWar, tickTradeAgreements } from "./diplomacy.js";
import { checkCouncilActivation, checkCouncilVoteDue } from "./council.js";
import { checkGameEnd } from "./victory.js";
import { resolveOrionGuardianCombat, isOrionGuarded } from "./orion.js";
import { maybeTriggerGalacticEvent } from "./events.js";
import { updateExploredSystems, runAutoExplore, updateEmpireDiscovery } from "./exploration.js";
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
  COLONY_SHIP_DESIGN_ID,
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
    // Interaktives Kampf-Grid (ROADMAP v0.16): standardmäßig aus, damit die
    // vertraute Auto-Auflösung erhalten bleibt, bis der Spieler es bewusst
    // einschaltet. Nur beim Spielerimperium ausgewertet (siehe
    // js/economy.js resolveAllCombats) – KI-Imperien kämpfen immer statistisch.
    interactiveCombat: false,
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
  // Selbstheilung (ROADMAP v0.28): entfernt Geisterschiffe aus bereits
  // bestehenden Spielständen, bevor irgendetwas anderes diese Runde läuft,
  // damit auch das Gefecht DIESER Runde schon korrekt aufgelöst wird (siehe
  // js/fleets.js purgeGhostDesignStacks).
  purgeGhostDesignStacks(galaxy);

  const empireById = new Map(galaxy.empires.map((e) => [e.id, e]));
  const empireDeltas = new Map(galaxy.empires.map((e) => [e.id, { techBC: 0, defBC: 0, totalBC: 0 }]));
  const turnForAi = galaxy.turn ?? 1;
  // Für die Rundenereignis-Zusammenfassung (ROADMAP v0.24, js/turnEvents.js)
  // – nur des Spielers eigene, echte Kriegsschiff-Designs (keine
  // Kolonieschiffe, siehe unten) werden als "Neues Schiff gebaut" gemeldet.
  const shipsBuilt = [];

  for (const empire of galaxy.empires) {
    if (!empire.isPlayer) runAiTurn(galaxy, empire, galaxy.seed, turnForAi);
    // Auto-Erkundung (ROADMAP v0.15): läuft für alle Imperien, ist aber
    // praktisch nur beim Spieler relevant, da nur er Flotten mit
    // fleet.autoExplore markieren kann.
    runAutoExplore(galaxy, empire);
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
          if (built > 0) {
            addShipsToSystem(galaxy, planet.colonizedBy, system.id, design.id, built);
            if (empire?.isPlayer) {
              const fleet = galaxy.fleets.find(
                (f) => f.ownerEmpireId === planet.colonizedBy && f.systemId === system.id && !f.destinationSystemId
              );
              shipsBuilt.push({ systemId: system.id, designId: design.id, designName: design.name, count: built, fleetId: fleet?.id ?? null });
            }
          }
        } else {
          // Ohne explizites Kriegsschiff-Ziel baut der Planet Kolonieschiffe
          // (ROADMAP v0.14): echte Flotteneinheiten am eigenen System statt
          // eines abstrakten, imperiumsweiten Zählers – exakt derselbe
          // Ansparungs-Mechanismus wie beim Kriegsschiffbau oben, nur mit
          // fixen Kosten statt eines Designs.
          const fund = prod.bc.ship + (planet.shipCarry ?? 0);
          const built = Math.floor(fund / COLONY_SHIP_COST_BC);
          planet.shipCarry = fund - built * COLONY_SHIP_COST_BC;
          if (built > 0) addShipsToSystem(galaxy, planet.colonizedBy, system.id, COLONY_SHIP_DESIGN_ID, built);
        }
      }
    }
  }

  // Handelsabkommen zählen eine Runde weiter und speisen ihren aktuellen
  // BC-Ertrag (ggf. negativ während der Anlaufphase) anteilig in Forschung
  // und Verteidigung beider Vertragspartner ein (siehe js/diplomacy.js,
  // ROADMAP v0.9). Seit v0.14 kein Kolonieschiff-Anteil mehr, da
  // Kolonieschiffe planetengebunden gebaut werden (siehe oben) und dieser
  // empireweite Bonus keinem einzelnen Planeten zuzuordnen ist – der
  // ehemalige Schiffsanteil fließt stattdessen in die Verteidigung.
  for (const { empireIdA, empireIdB, bonusBC } of tickTradeAgreements(galaxy)) {
    for (const empireId of [empireIdA, empireIdB]) {
      const delta = empireDeltas.get(empireId);
      if (!delta) continue;
      delta.techBC += bonusBC * 0.4;
      delta.defBC += bonusBC * 0.6;
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

    const breakthroughs = processResearchTurn(empire, delta.techBC, galaxy.seed, turn);
    if (breakthroughs.length > 0) breakthroughsByEmpire.set(empire.id, breakthroughs);
  }

  const arrivals = advanceFleets(galaxy);
  // Nebel des Krieges (ROADMAP v0.15): frisch angekommene Systeme sofort
  // als erforscht markieren, bevor Kampfberichte/Events etc. darauf Bezug
  // nehmen.
  updateExploredSystems(galaxy);
  // Imperiumskontakt (ROADMAP v0.24): nach der Erforschungsaktualisierung,
  // damit ein gerade erst erforschtes System noch in derselben Runde zu
  // einer Entdeckung führen kann.
  const newDiscoveries = updateEmpireDiscovery(galaxy);
  // Kolonisieren-auf-Zuruf (ROADMAP v0.22): ein per orderColonization
  // losgeschicktes Kolonieschiff kolonisiert bei Ankunft automatisch seinen
  // zugewiesenen Planeten, ohne dass der Spieler erneut klicken muss.
  for (const fleet of arrivals) {
    const target = fleet.colonizeTarget;
    if (!target || fleet.systemId !== target.systemId) continue;
    fleet.colonizeTarget = null;
    colonizePlanet(galaxy, target.systemId, target.planetId, fleet.ownerEmpireId);
  }
  const { reports: battleReports, pendingBattles } = resolveAllCombats(galaxy);
  // Interaktives Kampf-Grid (ROADMAP v0.16): Gefechte, an denen der Spieler
  // beteiligt ist, werden bei aktivierter Einstellung hier NICHT aufgelöst,
  // sondern eingefroren an galaxy.pendingBattles gemeldet – js/main.js öffnet
  // dafür das Kampf-Grid und lässt die Runde erst weiterlaufen, sobald alle
  // gemeldeten Gefechte aufgelöst wurden (manuell oder per Auto-Auflösung).
  galaxy.pendingBattles = pendingBattles;

  // Guardian of Orion (ROADMAP v0.10): unabhängig vom Diplomatiestatus, da
  // der Guardian an keiner Diplomatie teilnimmt. Bugfix (ROADMAP v0.27,
  // Nutzer-Feedback): lief bisher IMMER automatisch, auch bei aktivierter
  // Interaktive-Kämpfe-Einstellung. Ist der Spieler mit einer Flotte am
  // Guardian-System und interaktive Kämpfe sind an, wird das Gefecht wie
  // jedes andere Zwei-Parteien-Gefecht zurückgestellt (js/main.js öffnet
  // dafür js/hexcombat.js createBattle, das den Guardian als besonderen
  // Gegner unterstützt) statt sofort statistisch aufgelöst zu werden.
  const player = galaxy.empires.find((e) => e.isPlayer);
  const guardianSystemId = galaxy.orion?.guardianAlive ? galaxy.orion.systemId : null;
  const guardianPlayerPresent =
    guardianSystemId != null &&
    galaxy.fleets.some(
      (f) => f.systemId === guardianSystemId && !f.destinationSystemId && f.ownerEmpireId === player?.id
    );

  if (player?.interactiveCombat && guardianPlayerPresent) {
    galaxy.pendingBattles = [...galaxy.pendingBattles, { systemId: guardianSystemId, empireIds: [player.id], isGuardian: true }];
  } else {
    const guardianReport = resolveOrionGuardianCombat(galaxy);
    if (guardianReport) battleReports.push(guardianReport);
  }

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
    shipsBuilt,
    newDiscoveries,
  };
}

// Baut die an einem Kampf beteiligten Flotten aus den Überlebenden neu auf
// und trägt die Kill-Zuordnung für den Highscore ein (ROADMAP v0.11) – von
// resolveAllCombats für sofort aufgelöste Gefechte genutzt, und von
// js/main.js für ein zuvor an galaxy.pendingBattles zurückgestelltes,
// interaktiv (Kampf-Grid, ROADMAP v0.16) oder nachträglich automatisch
// aufgelöstes Gefecht.
export function applyBattleResult(galaxy, systemId, result) {
  // Kolonieschiff-Stacks (kein reguläres Design, siehe COLONY_SHIP_DESIGN_ID)
  // nehmen nie am Kampf teil (js/combat.js buildUnits überspringt sie) und
  // müssen daher unabhängig vom Kampfausgang erhalten bleiben – auch wenn
  // sie in derselben Flotte standen wie kämpfende Kriegsschiffe. Ohne diese
  // Sonderbehandlung würde die blanke Flotten-Neuaufbau-Logik unten sie mit
  // löschen, obwohl sie am Gefecht gar nicht beteiligt waren.
  const empireIdsInBattle = new Set(result.empireIds);
  const survivingNonCombatFleets = [];
  for (const fleet of galaxy.fleets) {
    if (fleet.systemId !== systemId || fleet.destinationSystemId || !empireIdsInBattle.has(fleet.ownerEmpireId)) continue;
    const empire = galaxy.empires.find((e) => e.id === fleet.ownerEmpireId);
    const nonCombatStacks = fleet.stacks.filter((s) => !empire?.shipDesigns.some((d) => d.id === s.designId));
    if (nonCombatStacks.length > 0) survivingNonCombatFleets.push({ ...fleet, stacks: nonCombatStacks });
  }

  galaxy.fleets = galaxy.fleets.filter((f) => !(f.systemId === systemId && !f.destinationSystemId));
  galaxy.fleets.push(...survivingNonCombatFleets);

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

  if (result.winnerEmpireId !== null) {
    galaxy.lastDamagedBy = galaxy.lastDamagedBy ?? {};
    for (const id of result.empireIds) {
      if (id !== result.winnerEmpireId) galaxy.lastDamagedBy[id] = result.winnerEmpireId;
    }
  }

  return { systemId, ...result };
}

// Löst ein zuvor zurückgestelltes Gefecht (galaxy.pendingBattles) nachträglich
// automatisch auf – die "Automatisch auflösen"-Option im Kampf-Grid
// (ROADMAP v0.16). Die beteiligten Flotten sind bis dahin unverändert am
// System eingefroren, siehe resolveAllCombats.
export function resolvePendingBattleAuto(galaxy, systemId) {
  // Guardian of Orion (ROADMAP v0.27): kein Flotten-Eintrag in galaxy.fleets
  // an diesem System, daher hätte resolveSystemCombat unten hier nur EINE
  // Partei (den Spieler) gesehen und wäre folgenlos leer ausgegangen, wenn
  // eine zurückgestellte Guardian-Begegnung über "Automatisch auflösen" im
  // Kampf-Grid entschieden wird.
  if (isOrionGuarded(galaxy, systemId)) {
    return resolveOrionGuardianCombat(galaxy);
  }
  const fleetsHere = galaxy.fleets.filter((f) => f.systemId === systemId && !f.destinationSystemId);
  const result = resolveSystemCombat(fleetsHere, galaxy.empires);
  if (!result) return null;
  return applyBattleResult(galaxy, systemId, result);
}

// Löst an jedem System, an dem stationäre Flotten mehrerer Imperien
// aufeinandertreffen, ein automatisches Gefecht aus (siehe js/combat.js) und
// baut die beteiligten Flotten anschließend aus den Überlebenden neu auf.
// Interaktives Kampf-Grid (ROADMAP v0.16): ist es beim Spieler aktiviert und
// er selbst an einem Zwei-Parteien-Gefecht beteiligt, wird dessen Auflösung
// zurückgestellt (pendingBattles) statt sofort per Zufallsformel entschieden
// – die beteiligten Flotten bleiben bis dahin unverändert am System stehen.
function resolveAllCombats(galaxy) {
  const reports = [];
  const pendingBattles = [];
  const player = galaxy.empires.find((e) => e.isPlayer);
  const systemIds = new Set(
    galaxy.fleets.filter((f) => !f.destinationSystemId).map((f) => f.systemId)
  );

  for (const systemId of systemIds) {
    const fleetsHere = galaxy.fleets.filter((f) => f.systemId === systemId && !f.destinationSystemId);
    const empireIds = [...new Set(fleetsHere.map((f) => f.ownerEmpireId))];
    if (empireIds.length < 2) continue;

    // Erkundungsflotten greifen nicht an (ROADMAP v0.26, Nutzer-Feedback:
    // "Schiffe im Erkundungsmodus attackieren keine feindlichen Schiffe").
    // Sind an diesem System AUSSCHLIESSLICH Erkunder-Flotten (autoExplore)
    // verschiedener, verfeindeter Imperien anwesend, löst das keinen Kampf
    // aus – sie koexistieren friedlich. Sobald mindestens ein Imperium hier
    // auch nur eine reguläre (nicht erkundende) Flotte stehen hat, gilt der
    // normale Kampf wie gehabt, inklusive etwaiger mit anwesender
    // Erkunder-Flotten, die dabei durchaus zerstört werden können ("können
    // aber attackiert werden").
    const activeEmpireIds = new Set(fleetsHere.filter((f) => !f.autoExplore).map((f) => f.ownerEmpireId));
    if (activeEmpireIds.size === 0) continue;

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

    if (player?.interactiveCombat && empireIds.length === 2 && empireIds.includes(player.id)) {
      pendingBattles.push({ systemId, empireIds });
      continue;
    }

    const result = resolveSystemCombat(fleetsHere, galaxy.empires);
    if (!result) continue;

    reports.push(applyBattleResult(galaxy, systemId, result));
  }

  return { reports, pendingBattles };
}

export function colonizePlanet(galaxy, systemId, planetId, empireId) {
  const empire = galaxy.empires.find((e) => e.id === empireId);
  if (!empire) return { ok: false, reason: "Imperium nicht gefunden." };
  const system = galaxy.systems.find((s) => s.id === systemId);
  const planet = system?.planets.find((p) => p.id === planetId);
  if (!planet) return { ok: false, reason: "Planet nicht gefunden." };
  if (!isColonizable(planet, empire)) {
    return { ok: false, reason: "Planet ist mit aktueller Technologie nicht kolonisierbar." };
  }
  if (isOrionGuarded(galaxy, systemId)) {
    return { ok: false, reason: "Der Guardian of Orion bewacht dieses System noch." };
  }
  // Kolonisierung erfordert ein physisch anwesendes Kolonieschiff (ROADMAP
  // v0.14) statt eines abstrakten Zählers – die Treibstoffreichweite wurde
  // bereits beim Losschicken der Flotte geprüft (js/fleets.js sendFleet),
  // eine erneute Reichweitenkontrolle hier entfällt daher.
  const colonyFleet = findColonyShipFleetAt(galaxy, empireId, systemId);
  if (!colonyFleet) {
    return { ok: false, reason: "Kein Kolonieschiff an diesem System stationiert." };
  }

  consumeColonyShip(galaxy, colonyFleet);
  planet.colonizedBy = empireId;
  initColony(planet, { isHomeworld: false });
  return { ok: true };
}

// Kolonisieren-auf-Zuruf (ROADMAP v0.22, Nutzer-Feedback): steht am
// Zielsystem noch kein eigenes Kolonieschiff, wird hier automatisch das
// nächstgelegene, noch unzugeteilte losgeschickt (fleet.colonizeTarget) –
// bei Ankunft kolonisiert simulateTurn automatisch (siehe oben), der
// Spieler muss nicht noch einmal klicken. Steht bereits eines vor Ort,
// verhält sich dies identisch zum bisherigen sofortigen colonizePlanet.
export function orderColonization(galaxy, systemId, planetId, empireId) {
  const empire = galaxy.empires.find((e) => e.id === empireId);
  if (!empire) return { ok: false, reason: "Imperium nicht gefunden." };
  const system = galaxy.systems.find((s) => s.id === systemId);
  const planet = system?.planets.find((p) => p.id === planetId);
  if (!planet) return { ok: false, reason: "Planet nicht gefunden." };
  if (!isColonizable(planet, empire)) {
    return { ok: false, reason: "Planet ist mit aktueller Technologie nicht kolonisierbar." };
  }
  if (isOrionGuarded(galaxy, systemId)) {
    return { ok: false, reason: "Der Guardian of Orion bewacht dieses System noch." };
  }
  if (findColonizeAssignment(galaxy, systemId, planetId)) {
    return { ok: false, reason: "Bereits ein Kolonieschiff auf dem Weg zu diesem Planeten." };
  }
  if (findColonyShipFleetAt(galaxy, empireId, systemId)) {
    return colonizePlanet(galaxy, systemId, planetId, empireId);
  }
  if (!isSystemInRange(galaxy, empire, system)) {
    return {
      ok: false,
      reason: `Außerhalb der Treibstoffreichweite (${empire.travelRangeParsec ?? DEFAULT_TRAVEL_RANGE_PARSEC} Parsec ab eigenen Kolonien).`,
    };
  }

  const sourceFleet = findNearestIdleColonyShipFleet(galaxy, empireId, systemId);
  if (!sourceFleet) {
    return { ok: false, reason: "Kein verfügbares Kolonieschiff." };
  }

  const dispatchFleet = extractSingleColonyShip(galaxy, sourceFleet);
  const result = sendFleet(galaxy, dispatchFleet.id, systemId);
  if (!result.ok) return result;

  dispatchFleet.colonizeTarget = { systemId, planetId };
  return { ok: true };
}

export function initColony(planet, { isHomeworld = false } = {}) {
  planet.population = isHomeworld ? HOMEWORLD_START_POPULATION : START_COLONY_POPULATION;
  planet.factories = isHomeworld ? HOMEWORLD_START_FACTORIES : 0;
  planet.sliders = { ...DEFAULT_SLIDERS };
  planet.indCarry = 0;
}
