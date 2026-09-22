import { getPersonality, getObjective, PERSONALITIES, OBJECTIVES } from "./data/aiPersonality.js";
import { normalizeSliders } from "./data/economy.js";
import { normalizeAllocation } from "./research.js";
import { isColonizable, colonizePlanet, maxPopulation } from "./economy.js";
import { addShipDesign } from "./shipDesign.js";
import { modulesOfKind } from "./shipDesign.js";
import { findFleetsAt, sendFleet, recallFleet } from "./fleets.js";
import { isAtWar, setRelationStatus } from "./diplomacy.js";
import { resolveInvasion, applyInvasionResult, maxInvasionTroops, fleetTroopCapacity } from "./invasion.js";
import { attemptSpyAction } from "./espionage.js";
import { SPY_ACTIONS } from "./data/espionage.js";
import { makeRng, hashSeed } from "./rng.js";
import { PARSEC_PIXELS } from "./data/logistics.js";
import { getRichness } from "./data/richness.js";
import { getEnvironment } from "./data/environments.js";
import {
  PLANET_VALUE_TIME_DECAY,
  DEVELOP_OVERHEAD_TURNS,
  SPECIAL_VALUE_PER_TIER,
  SPECIAL_VALUE_OFFSET,
  RICHNESS_SPECIAL_TIER,
  RARE_ENVIRONMENT_SPECIAL_TIER,
  ORION_SPECIAL_TIER,
} from "./data/aiTargeting.js";

const WAR_CHECK_SCALE = 0.04; // dämpft warBias auf eine plausible Pro-Runde-Wahrscheinlichkeit
const ERRATIC_WAR_CHANCE = 0.03;
const ESPIONAGE_ATTEMPT_CHANCE = 0.15; // Chance pro Runde, sofern genug SP vorhanden sind
// "MoO KI Verhalten.docx": KI ignoriert das Orion-System bis exakt Runde
// 121, außer ein menschlicher Spieler kolonisiert es vorher (in diesem
// Remake gleichbedeutend mit "Guardian bereits besiegt" – dann greift
// ohnehin nichts mehr an).
const ORION_LOCK_TURN = 121;
const ORION_ASSAULT_MIN_SHIPS = 20;
const ORION_ASSAULT_ATTEMPT_CHANCE = 0.1;

// Entscheidet, ob eine KI ein vom Spieler vorgeschlagenes Handelsabkommen
// annimmt (ROADMAP v0.9). Xenophobe Imperien lehnen grundsätzlich ab;
// vertragstreue/diplomatische Persönlichkeiten sind zugänglicher, hohe
// Kriegsneigung senkt die Chance. Diplomatisches Gedächtnis (ROADMAP v0.12,
// "MoO KI Verhalten.docx"): vergangene Kriegserklärungen/gebrochene
// Handelsabkommen (grudge) senken die Chance zusätzlich – die KI
// "verweigert dauerhaft neue Handelsabkommen" nach Vertragsbrüchen.
// *Vereinfacht:* KI schlägt dem Spieler selbst keine Handelsabkommen vor,
// nur der Spieler kann sie initiieren.
export function aiAcceptsTradeOffer(empire, grudge = 0) {
  const personality = getPersonality(empire.personalityId);
  if (personality.treatyAverse) return false;
  let chance = 0.5;
  if (personality.keepsTreaties) chance += 0.3;
  if (empire.objectiveId === "diplomat") chance += 0.2;
  chance -= personality.warBias * 0.3;
  chance -= grudge * 0.015;
  chance = Math.min(0.95, Math.max(0.05, chance));
  return Math.random() < chance;
}

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

function planetSpecialTier(planet) {
  if (planet.isOrion) return ORION_SPECIAL_TIER;
  const env = getEnvironment(planet.environment);
  if (env?.rare) return RARE_ENVIRONMENT_SPECIAL_TIER;
  return RICHNESS_SPECIAL_TIER[planet.richness] ?? RICHNESS_SPECIAL_TIER.abundant;
}

// Planetare Attraktivitätsbewertung ("MoO KI Verhalten.docx", ROADMAP
// v0.12): PlanetValue = PlanetSize / 1.045^TimeToDevelop + Spezialwert,
// reiche/Artefakt-Welten ×2, Ultra-Rich ×3. Treibt sowohl Kolonisierungs-
// als auch Angriffsziel-Wahl – bewusst OHNE Berücksichtigung gegnerischer
// Verteidigungsstärke, siehe Quelle ("keine Analyse der gegnerischen
// Flottenstärke"). travelTurns ist die grobe Reisezeit (Distanz/Tempo) zum
// Zielsystem.
function planetAttractiveness(planet, empire, travelTurns) {
  const size = maxPopulation(planet, empire);
  const developTime = Math.max(0, travelTurns) + DEVELOP_OVERHEAD_TURNS;
  const baseValue = size / Math.pow(PLANET_VALUE_TIME_DECAY, developTime);
  const specialValue = planetSpecialTier(planet) * SPECIAL_VALUE_PER_TIER - SPECIAL_VALUE_OFFSET;
  let total = baseValue + specialValue;

  const richness = getRichness(planet.richness);
  const env = getEnvironment(planet.environment);
  if (env?.id === "artifact" || richness?.id === "rich") total *= 2;
  if (richness?.id === "ultra_rich") total *= 3;
  return total;
}

function travelTurnsBetween(empire, systemA, systemB) {
  const distanceParsec = Math.hypot(systemA.x - systemB.x, systemA.y - systemB.y) / PARSEC_PIXELS;
  return distanceParsec / Math.max(1, empire.travelSpeedParsec ?? 1);
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

// Wählt das Kolonisierungsziel per Attraktivitätswert (siehe
// planetAttractiveness) statt reiner Distanz – organische Ausbreitung zu
// den lohnendsten erreichbaren Welten statt "Blobbing" zum nächstbesten
// Planeten ("MoO KI Verhalten.docx", ROADMAP v0.12). Das bewachte
// Orion-System wird ignoriert (siehe attemptGuardianAssault).
function attemptColonization(galaxy, empire) {
  if (empire.colonyShips < 1) return;
  const ownedSystems = galaxy.systems.filter((s) => s.planets.some((p) => p.colonizedBy === empire.id));
  if (ownedSystems.length === 0) return;

  let best = null;
  let bestValue = -Infinity;
  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.isOrion) continue;
      if (!isColonizable(planet, empire)) continue;
      const nearestOwned = ownedSystems.reduce((closest, s) => {
        const dist = Math.hypot(s.x - system.x, s.y - system.y);
        return dist < closest.dist ? { system: s, dist } : closest;
      }, { system: null, dist: Infinity });
      const travelTurns = travelTurnsBetween(empire, nearestOwned.system, system);
      const value = planetAttractiveness(planet, empire, travelTurns);
      if (value > bestValue) {
        bestValue = value;
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

// Zielt nicht mehr pauschal auf die gegnerische Heimatwelt, sondern auf das
// wertvollste Kriegsgegner-System nach derselben Attraktivitätsformel wie
// die Kolonisierung ("MoO KI Verhalten.docx", ROADMAP v0.12) – ebenfalls
// ohne Prüfung der dortigen Verteidigungsstärke.
function attemptAggression(galaxy, empire) {
  const personality = getPersonality(empire.personalityId);
  if (personality.warBias < 0.4) return;

  const atWarWith = galaxy.empires.filter((e) => e.id !== empire.id && !e.eliminated && isAtWar(galaxy, empire.id, e.id));
  if (atWarWith.length === 0) return;

  const homeSystem = galaxy.systems.find((s) => s.homeworldEmpireId === empire.id);
  if (!homeSystem) return;
  const fleets = findFleetsAt(galaxy, homeSystem.id, empire.id);
  const strongFleet = fleets.find((f) => f.stacks.reduce((sum, s) => sum + s.count, 0) >= 2);
  if (!strongFleet) return;

  const atWarIds = new Set(atWarWith.map((e) => e.id));
  let best = null;
  let bestValue = -Infinity;
  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (!atWarIds.has(planet.colonizedBy)) continue;
      const travelTurns = travelTurnsBetween(empire, homeSystem, system);
      const value = planetAttractiveness(planet, empire, travelTurns);
      if (value > bestValue) {
        bestValue = value;
        best = system;
      }
    }
  }
  if (!best) return;
  sendFleet(galaxy, strongFleet.id, best.id);
}

// Verteidigungspriorisierung ("MoO KI Verhalten.docx", ROADMAP v0.12): "Im
// Kriegsfall konzentriert sich die KI immer zuerst auf den Schutz der
// eigenen Planeten." Steht ein Kriegsgegner an oder auf dem Weg zu einem
// eigenen System, werden alle offensiven (nicht heimwärts gerichteten)
// Flotten sofort zurückgerufen (siehe js/fleets.js recallFleet).
function attemptDefensivePriority(galaxy, empire) {
  const ownedSystemIds = new Set(
    galaxy.systems.filter((s) => s.planets.some((p) => p.colonizedBy === empire.id)).map((s) => s.id)
  );
  if (ownedSystemIds.size === 0) return;

  const underThreat = galaxy.fleets.some(
    (f) =>
      f.ownerEmpireId !== empire.id &&
      isAtWar(galaxy, empire.id, f.ownerEmpireId) &&
      (ownedSystemIds.has(f.systemId) || ownedSystemIds.has(f.destinationSystemId))
  );
  if (!underThreat) return;

  const offensiveFleets = galaxy.fleets.filter(
    (f) => f.ownerEmpireId === empire.id && f.destinationSystemId && !ownedSystemIds.has(f.destinationSystemId)
  );
  for (const fleet of offensiveFleets) {
    recallFleet(galaxy, fleet.id);
  }
}

// Orion-Sperr-Timer ("MoO KI Verhalten.docx", ROADMAP v0.12): KI ignoriert
// den Guardian bis Runde ORION_LOCK_TURN vollständig, danach greifen
// hinreichend kriegerische Imperien mit ausreichend großer Heimatflotte
// gelegentlich an (ohne Erfolgsgarantie – derselbe Automatik-Kampf wie beim
// Spieler, siehe js/orion.js).
function attemptGuardianAssault(galaxy, empire, seed, turn) {
  if (turn < ORION_LOCK_TURN) return;
  if (!galaxy.orion?.guardianAlive) return;
  const personality = getPersonality(empire.personalityId);
  if (personality.warBias < 0.4) return;

  const rng = makeRng(hashSeed(`${seed}:aiorion:${empire.id}:${turn}`));
  if (rng() >= ORION_ASSAULT_ATTEMPT_CHANCE) return;

  const orionSystem = galaxy.systems.find((s) => s.id === galaxy.orion.systemId);
  if (!orionSystem) return;
  const homeSystem = galaxy.systems.find((s) => s.homeworldEmpireId === empire.id);
  if (!homeSystem) return;

  const fleets = findFleetsAt(galaxy, homeSystem.id, empire.id);
  const strongFleet = fleets.find((f) => f.stacks.reduce((sum, s) => sum + s.count, 0) >= ORION_ASSAULT_MIN_SHIPS);
  if (!strongFleet) return;

  sendFleet(galaxy, strongFleet.id, orionSystem.id);
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
// Spioniert gelegentlich einen zufälligen Rivalen aus (Tech-Diebstahl,
// Sabotage oder Rebellion); friedliche Persönlichkeiten (geringer warBias)
// verzichten darauf. Framing wird nicht genutzt – das bleibt vorerst dem
// Spieler und dem Darlok-Sondervorteil in attemptSpyAction vorbehalten.
function attemptEspionage(galaxy, empire, seed, turn) {
  const personality = getPersonality(empire.personalityId);
  if (personality.warBias < 0.3) return;

  const rng = makeRng(hashSeed(`${seed}:aispy:${empire.id}:${turn}`));
  if (rng() >= ESPIONAGE_ATTEMPT_CHANCE) return;

  const targets = galaxy.empires.filter((e) => e.id !== empire.id && !e.eliminated);
  if (targets.length === 0) return;
  const target = targets[Math.floor(rng() * targets.length)];

  const actions = Object.values(SPY_ACTIONS);
  const affordable = actions.filter((a) => (empire.espionagePoints ?? 0) >= a.cost);
  if (affordable.length === 0) return;
  const action = affordable[Math.floor(rng() * affordable.length)];

  attemptSpyAction(galaxy, empire, target, action.id, false);
}

export function runAiTurn(galaxy, empire, seed, turn) {
  applyEconomyPolicy(galaxy, empire);
  attemptColonization(galaxy, empire);
  considerDiplomacy(galaxy, empire, seed, turn);
  attemptAggression(galaxy, empire);
  attemptGuardianAssault(galaxy, empire, seed, turn);
  // Verteidigungspriorisierung hat das letzte Wort: ruft auch Flotten
  // zurück, die attemptAggression/attemptGuardianAssault in dieser selben
  // Runde gerade erst losgeschickt haben, falls eigenes Territorium
  // bedroht ist (siehe attemptDefensivePriority oben).
  attemptDefensivePriority(galaxy, empire);
  attemptInvasion(galaxy, empire);
  attemptEspionage(galaxy, empire, seed, turn);
}
