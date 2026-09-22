// Galaktische Zufallsereignisse (ROADMAP v0.10) – siehe
// js/data/galacticEvents.js für Werte/Quellenangabe. Wird einmal pro Runde
// aus js/economy.js simulateTurn aufgerufen.
import { makeRng, hashSeed } from "./rng.js";
import { resolveMonsterBattle, MONSTER_EMPIRE_ID } from "./combat.js";
import {
  EVENT_CHANCE_PER_TURN,
  EVENT_MIN_TURN,
  COMET_POPULATION_LOSS_PCT,
  COMET_FACTORY_LOSS_PCT,
  SUPERNOVA_POPULATION_LOSS_PCT,
  SUPERNOVA_FACTORY_LOSS_PCT,
  SPACE_MONSTER_STATS,
  SPACE_MONSTER_BOMBARD_POPULATION_LOSS_PCT,
  EVENT_WEIGHTS,
} from "./data/galacticEvents.js";

function colonizedPlanetEntries(galaxy) {
  return galaxy.systems
    .flatMap((system) => system.planets.map((planet) => ({ system, planet })))
    .filter((e) => e.planet.colonizedBy !== null && e.planet.colonizedBy !== undefined);
}

function resolveComet(galaxy, rng) {
  const targets = colonizedPlanetEntries(galaxy);
  if (targets.length === 0) return null;
  const { system, planet } = targets[Math.floor(rng() * targets.length)];

  const popLoss = planet.population * COMET_POPULATION_LOSS_PCT;
  const factoryLoss = Math.ceil(planet.factories * COMET_FACTORY_LOSS_PCT);
  planet.population = Math.max(0.1, planet.population - popLoss);
  planet.factories = Math.max(0, planet.factories - factoryLoss);

  return {
    type: "comet",
    systemId: system.id,
    log: `Ein Komet schlägt in ${system.name} ${planet.name} ein: ${popLoss.toFixed(1)} Mio. Opfer, ${factoryLoss} Fabrik(en) zerstört.`,
  };
}

function resolveSupernova(galaxy, rng) {
  const targets = colonizedPlanetEntries(galaxy);
  if (targets.length === 0) return null;
  const { system } = targets[Math.floor(rng() * targets.length)];

  let totalPopLoss = 0;
  let totalFactoryLoss = 0;
  for (const planet of system.planets) {
    if (planet.colonizedBy === null || planet.colonizedBy === undefined) continue;
    const popLoss = planet.population * SUPERNOVA_POPULATION_LOSS_PCT;
    const factoryLoss = Math.ceil(planet.factories * SUPERNOVA_FACTORY_LOSS_PCT);
    planet.population = Math.max(0.1, planet.population - popLoss);
    planet.factories = Math.max(0, planet.factories - factoryLoss);
    totalPopLoss += popLoss;
    totalFactoryLoss += factoryLoss;
  }

  return {
    type: "supernova",
    systemId: system.id,
    log: `Supernova in ${system.name}! ${totalPopLoss.toFixed(1)} Mio. Opfer und ${totalFactoryLoss} Fabrik(en) im gesamten System zerstört.`,
  };
}

// Erscheint an einem zufälligen kolonisierten System: greift eine dort
// stationierte Flotte im Kampf an (siehe js/combat.js resolveMonsterBattle,
// geteilt mit dem Guardian of Orion), oder bombardiert bei fehlender
// Verteidigung den Planeten direkt.
function resolveSpaceMonster(galaxy, rng) {
  const targets = colonizedPlanetEntries(galaxy);
  if (targets.length === 0) return null;
  const { system, planet } = targets[Math.floor(rng() * targets.length)];
  const defendingFleets = galaxy.fleets.filter((f) => f.systemId === system.id && !f.destinationSystemId);

  if (defendingFleets.length > 0) {
    const result = resolveMonsterBattle(defendingFleets, galaxy.empires, SPACE_MONSTER_STATS);
    if (!result) return null;

    galaxy.fleets = galaxy.fleets.filter((f) => !(f.systemId === system.id && !f.destinationSystemId));
    const empireIds = result.empireIds.filter((id) => id !== MONSTER_EMPIRE_ID);
    for (const empireId of empireIds) {
      const stacks = result.survivorsByEmpire.get(empireId) ?? [];
      if (stacks.length === 0) continue;
      galaxy.fleets.push({
        id: `fleet-${galaxy.nextFleetId++}`,
        ownerEmpireId: empireId,
        systemId: system.id,
        destinationSystemId: null,
        stacks,
      });
    }

    return { ...result, systemId: system.id, empireIds, isGuardianBattle: true, monsterName: SPACE_MONSTER_STATS.name, type: "spaceMonster" };
  }

  const popLoss = planet.population * SPACE_MONSTER_BOMBARD_POPULATION_LOSS_PCT;
  planet.population = Math.max(0.1, planet.population - popLoss);
  return {
    type: "spaceMonster",
    systemId: system.id,
    log: `${SPACE_MONSTER_STATS.name} greift ${system.name} ${planet.name} an – keine Verteidigungsflotte vorhanden, ${popLoss.toFixed(1)} Mio. Opfer.`,
  };
}

const EVENT_RESOLVERS = { comet: resolveComet, supernova: resolveSupernova, spaceMonster: resolveSpaceMonster };

function pickEventType(rng) {
  const total = Object.values(EVENT_WEIGHTS).reduce((sum, w) => sum + w, 0);
  let roll = rng() * total;
  for (const [type, weight] of Object.entries(EVENT_WEIGHTS)) {
    if (roll < weight) return type;
    roll -= weight;
  }
  return null;
}

// Wird einmal pro Runde aufgerufen; liefert entweder null (kein Ereignis)
// oder ein Ereignis-Objekt mit `log` (einfache Meldung) oder – im Fall
// eines Weltraum-Monster-Gefechts – denselben Feldern wie ein regulärer
// Kampfbericht (siehe js/combat.js), damit main.js/ui.js beides identisch
// über die Battle-Report-Anzeige darstellen können.
export function maybeTriggerGalacticEvent(galaxy) {
  const turn = galaxy.turn ?? 1;
  if (turn < EVENT_MIN_TURN) return null;

  const rng = makeRng(hashSeed(`${galaxy.seed}:event:${turn}`));
  if (rng() >= EVENT_CHANCE_PER_TURN) return null;

  const type = pickEventType(rng);
  const resolver = EVENT_RESOLVERS[type];
  if (!resolver) return null;
  return resolver(galaxy, rng);
}
