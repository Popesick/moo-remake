import { getPersonality, getObjective, PERSONALITIES, OBJECTIVES } from "./data/aiPersonality.js";
import { normalizeSliders } from "./data/economy.js";
import { normalizeAllocation } from "./research.js";
import { isColonizable, colonizePlanet } from "./economy.js";
import { addShipDesign } from "./shipDesign.js";
import { modulesOfKind } from "./shipDesign.js";
import { findFleetsAt, sendFleet } from "./fleets.js";
import { isAtWar, setRelationStatus } from "./diplomacy.js";
import { resolveInvasion, applyInvasionResult, maxInvasionTroops, fleetTroopCapacity } from "./invasion.js";
import { makeRng, hashSeed } from "./rng.js";

const WAR_CHECK_SCALE = 0.04; // dämpft warBias auf eine plausible Pro-Runde-Wahrscheinlichkeit
const ERRATIC_WAR_CHANCE = 0.03;

export function assignAiBehavior(rng, empire) {
  empire.personalityId = PERSONALITIES[Math.floor(rng() * PERSONALITIES.length)].id;
  empire.objectiveId = OBJECTIVES[Math.floor(rng() * OBJECTIVES.length)].id;
}

// Erstellt zu Partiebeginn ein einfaches Start-Design aus den Level-1-
// Komponenten, die jedem Imperium garantiert zur Verfügung stehen (siehe
// js/research.js, "obligatorische Schlüsseltechnologien").
export function createStarterDesign(empire) {
  const armor = modulesOfKind("armor", empire)[0];
  const shield = modulesOfKind("shield", empire)[0];
  const drive = modulesOfKind("drive", empire)[0];
  const weapon = modulesOfKind("weapon", empire)[0];
  if (!weapon) return;
  addShipDesign(empire, {
    name: `${empire.name}-Wache`,
    hullId: "small",
    armorId: armor?.id ?? null,
    shieldId: shield?.id ?? null,
    driveId: drive?.id ?? null,
    weapons: [{ techId: weapon.id, count: 3 }],
  });
}

function applyEconomyPolicy(galaxy, empire) {
  const objective = getObjective(empire.objectiveId);
  const sliderWeights = normalizeSliders(objective.sliders);
  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.colonizedBy !== empire.id) continue;
      planet.sliders = { ...sliderWeights };
      if (empire.shipDesigns.length > 0) {
        const militant = objective.id === "militarist" || getPersonality(empire.personalityId).warBias >= 0.5;
        planet.productionTarget = militant ? empire.shipDesigns[0].id : null;
      }
    }
  }
  empire.research.allocation = normalizeAllocation(objective.research);
}

function attemptColonization(galaxy, empire) {
  if (empire.colonyShips < 1) return;
  const ownedSystems = galaxy.systems.filter((s) => s.planets.some((p) => p.colonizedBy === empire.id));
  if (ownedSystems.length === 0) return;

  let best = null;
  let bestDist = Infinity;
  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (!isColonizable(planet, empire)) continue;
      const dist = Math.min(...ownedSystems.map((s) => Math.hypot(s.x - system.x, s.y - system.y)));
      if (dist < bestDist) {
        bestDist = dist;
        best = { systemId: system.id, planetId: planet.id };
      }
    }
  }
  if (best) colonizePlanet(galaxy, best.systemId, best.planetId, empire.id);
}

function considerDiplomacy(galaxy, empire, seed, turn) {
  const personality = getPersonality(empire.personalityId);
  if (personality.keepsTreaties) return;
  const rng = makeRng(hashSeed(`${seed}:aidiplo:${empire.id}:${turn}`));

  for (const other of galaxy.empires) {
    if (other.id === empire.id) continue;
    if (isAtWar(galaxy, empire.id, other.id)) continue;
    const chance = personality.erratic ? ERRATIC_WAR_CHANCE : personality.warBias * WAR_CHECK_SCALE;
    if (rng() < chance) {
      setRelationStatus(galaxy, empire.id, other.id, "war");
    }
  }
}

function attemptAggression(galaxy, empire) {
  const personality = getPersonality(empire.personalityId);
  if (personality.warBias < 0.4) return;

  const atWarWith = galaxy.empires.filter((e) => e.id !== empire.id && isAtWar(galaxy, empire.id, e.id));
  if (atWarWith.length === 0) return;

  const homeSystem = galaxy.systems.find((s) => s.homeworldEmpireId === empire.id);
  if (!homeSystem) return;
  const fleets = findFleetsAt(galaxy, homeSystem.id, empire.id);
  const strongFleet = fleets.find((f) => f.stacks.reduce((sum, s) => sum + s.count, 0) >= 2);
  if (!strongFleet) return;

  const targetHome = galaxy.systems.find((s) => s.homeworldEmpireId === atWarWith[0].id);
  if (!targetHome) return;
  sendFleet(galaxy, strongFleet.id, targetHome.id, empire.travelSpeedParsec);
}

// Invadiert automatisch jeden Planeten eines Kriegsgegners, an dessen
// System eine eigene, unkontestierte Flotte steht (siehe ROADMAP v0.7).
function attemptInvasion(galaxy, empire) {
  const stationary = galaxy.fleets.filter((f) => f.ownerEmpireId === empire.id && !f.destinationSystemId);
  if (stationary.length === 0) return;

  for (const fleet of stationary) {
    const system = galaxy.systems.find((s) => s.id === fleet.systemId);
    if (!system) continue;
    const enemyFleetsHere = galaxy.fleets.some(
      (f) => f.systemId === system.id && f.ownerEmpireId !== empire.id && !f.destinationSystemId && isAtWar(galaxy, empire.id, f.ownerEmpireId)
    );
    if (enemyFleetsHere) continue;

    const target = system.planets.find(
      (p) => p.colonizedBy !== null && p.colonizedBy !== undefined && p.colonizedBy !== empire.id && isAtWar(galaxy, empire.id, p.colonizedBy)
    );
    if (!target) continue;

    const defender = galaxy.empires.find((e) => e.id === target.colonizedBy);
    const ownedPlanets = galaxy.systems
      .flatMap((s) => s.planets)
      .filter((p) => p.colonizedBy === empire.id)
      .sort((a, b) => b.population - a.population);
    const source = ownedPlanets[0];
    if (!source) continue;

    const troops = Math.min(fleetTroopCapacity(fleet), maxInvasionTroops(empire, source));
    if (troops < 1) continue;

    source.population -= troops;
    const result = resolveInvasion(empire, defender, target, troops);
    applyInvasionResult(galaxy, empire.id, target, result);
  }
}

// Führt die KI-Runde für ein einzelnes, nicht spielergesteuertes Imperium
// aus: Wirtschaftspolitik gemäß Ziel, Kolonisierung, Diplomatie-Neigung,
// (bei kriegerischer Persönlichkeit) Flottenangriffe und Invasionen.
export function runAiTurn(galaxy, empire, seed, turn) {
  applyEconomyPolicy(galaxy, empire);
  attemptColonization(galaxy, empire);
  considerDiplomacy(galaxy, empire, seed, turn);
  attemptAggression(galaxy, empire);
  attemptInvasion(galaxy, empire);
}
