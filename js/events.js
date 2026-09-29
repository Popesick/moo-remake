// Galaktische Zufallsereignisse (ROADMAP v0.10) – siehe
// js/data/galacticEvents.js für Werte/Quellenangabe. Wird einmal pro Runde
// aus js/economy.js simulateTurn aufgerufen.
import { makeRng, hashSeed } from "./rng.js";
import { resolveMonsterBattle, MONSTER_EMPIRE_ID } from "./combat.js";
import { extractNonCombatStacks } from "./fleets.js";
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

// Gemeinsame Nachbearbeitung eines abgeschlossenen Weltraum-Monster-
// Gefechts, egal ob automatisch aufgelöst (resolveSpaceMonster) oder über
// das interaktive Kampf-Grid entschieden (ROADMAP v0.30, siehe
// applyInteractiveSpaceMonsterResult unten). Baut die beteiligten Flotten
// aus den Überlebenden neu auf – anders als beim Guardian gibt es hier
// keine Sieg-Belohnung und keinen dauerhaften Bewacher-Status, das
// Ereignis ist mit dieser einen Runde abgeschlossen.
function finalizeSpaceMonsterCombat(galaxy, systemId, result) {
  const empireIds = result.empireIds.filter((id) => id !== MONSTER_EMPIRE_ID);

  // Kolonieschiffe, die zufällig mit einer kämpfenden Flotte am angegriffenen
  // System standen, dürfen den Kampfausgang nicht mit erleiden (Bugfix
  // ROADMAP v0.30, dieselbe Problematik wie js/economy.js applyBattleResult,
  // siehe js/fleets.js extractNonCombatStacks).
  const survivingNonCombatFleets = extractNonCombatStacks(galaxy, systemId, new Set(empireIds));
  galaxy.fleets = galaxy.fleets.filter((f) => !(f.systemId === systemId && !f.destinationSystemId));
  galaxy.fleets.push(...survivingNonCombatFleets);
  for (const empireId of empireIds) {
    const stacks = result.survivorsByEmpire.get(empireId) ?? [];
    if (stacks.length === 0) continue;
    galaxy.fleets.push({
      id: `fleet-${galaxy.nextFleetId++}`,
      ownerEmpireId: empireId,
      systemId,
      destinationSystemId: null,
      stacks,
    });
  }
  return { ...result, systemId, empireIds, isGuardianBattle: true, monsterName: SPACE_MONSTER_STATS.name, type: "spaceMonster" };
}

// Wird von js/main.js nach einem interaktiv im Kampf-Grid entschiedenen
// Weltraum-Monster-Gefecht aufgerufen (siehe js/hexcombat.js createBattle
// galaxy.pendingSpaceMonster) – wendet dieselbe Nachbearbeitung wie die
// Auto-Auflösung oben an, nur gespeist aus finalizeBattleResult(battle)
// statt resolveMonsterBattle.
export function applyInteractiveSpaceMonsterResult(galaxy, systemId, battleResult) {
  galaxy.pendingSpaceMonster = null;
  return finalizeSpaceMonsterCombat(galaxy, systemId, battleResult);
}

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
//
// Interaktives Kampf-Grid (ROADMAP v0.30, "Polish-Kandidat" aus v0.29):
// verteidigt der Spieler ALLEIN (kein weiteres Imperium gleichzeitig
// anwesend – das Kampf-Grid unterstützt nur Zwei-Parteien-Gefechte) und
// hat interaktive Kämpfe aktiviert, wird das Gefecht NICHT hier sofort
// aufgelöst, sondern als "deferred" zurückgemeldet – js/economy.js
// simulateTurn stellt es dann wie ein reguläres Zwei-Imperien-Gefecht über
// galaxy.pendingBattles zurück (siehe galaxy.pendingSpaceMonster, das
// js/hexcombat.js createBattle als Marker für "hier wartet ein
// Weltraum-Monster" abfragt).
function resolveSpaceMonster(galaxy, rng) {
  const targets = colonizedPlanetEntries(galaxy);
  if (targets.length === 0) return null;
  const { system, planet } = targets[Math.floor(rng() * targets.length)];
  const defendingFleets = galaxy.fleets.filter((f) => f.systemId === system.id && !f.destinationSystemId);

  if (defendingFleets.length > 0) {
    const defenderEmpireIds = [...new Set(defendingFleets.map((f) => f.ownerEmpireId))];
    const player = galaxy.empires.find((e) => e.isPlayer);
    if (player?.interactiveCombat && defenderEmpireIds.length === 1 && defenderEmpireIds[0] === player.id) {
      return { type: "spaceMonster", deferred: true, systemId: system.id };
    }

    const result = resolveMonsterBattle(defendingFleets, galaxy.empires, SPACE_MONSTER_STATS);
    if (!result) return null;
    return finalizeSpaceMonsterCombat(galaxy, system.id, result);
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
