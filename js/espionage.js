import { getTech } from "./data/techTree.js";
import { isAtWar, setRelationStatus } from "./diplomacy.js";
import {
  SPY_ACTIONS,
  MISSION_BASE_SUCCESS_CHANCE,
  BASE_DETECTION_CHANCE,
  DARLOK_DETECTION_REDUCTION,
  DARLOK_FRAME_SUCCESS_CHANCE,
  DEFAULT_FRAME_SUCCESS_CHANCE,
} from "./data/espionage.js";

function stealTech(attacker, defender, log) {
  const attackerCompleted = new Set(attacker.research.completedTechs);
  const stealable = defender.research.completedTechs.filter((id) => !attackerCompleted.has(id));
  if (stealable.length === 0) {
    log.push("Kein Technologie-Ziel gefunden – der Verteidiger hat nichts Neues.");
    return;
  }
  const tech = getTech(stealable[Math.floor(Math.random() * stealable.length)]);
  attacker.research.completedTechs.push(tech.id);
  attacker.research.techLevel[tech.discipline] = Math.max(attacker.research.techLevel[tech.discipline], tech.level);
  log.push(`Technologie erbeutet: ${tech.name}.`);
}

function sabotage(defender, targetPlanet, log) {
  const lost = Math.ceil(targetPlanet.factories * 0.4);
  targetPlanet.factories = Math.max(0, targetPlanet.factories - lost);
  log.push(`Sabotage: ${lost} Fabrik(en) auf ${targetPlanet.name} zerstört.`);
}

function incitRebellion(defender, targetPlanet, log) {
  const factoryLoss = Math.ceil(targetPlanet.factories * 0.3);
  const popLoss = targetPlanet.population * 0.15;
  targetPlanet.factories = Math.max(0, targetPlanet.factories - factoryLoss);
  targetPlanet.population = Math.max(0.1, targetPlanet.population - popLoss);
  log.push(`Rebellion: ${factoryLoss} Fabrik(en) zerstört, ${popLoss.toFixed(1)} Mio. Bevölkerung durch Unruhen verloren.`);
}

function pickTargetPlanet(galaxy, defenderEmpireId) {
  const planets = galaxy.systems.flatMap((s) => s.planets).filter((p) => p.colonizedBy === defenderEmpireId);
  if (planets.length === 0) return null;
  return planets.reduce((biggest, p) => (p.factories > biggest.factories ? p : biggest), planets[0]);
}

// Führt eine Spionageaktion aus (design-analyse.docx: Tech-Diebstahl,
// industrielle Sabotage, Rebellion). Bei Entdeckung kann die Tat einem
// dritten, zufälligen Imperium angelastet werden ("Framing" – Darloks
// gelingt das deutlich zuverlässiger und sie werden seltener entdeckt).
export function attemptSpyAction(galaxy, attacker, defender, actionId, useFraming) {
  const action = SPY_ACTIONS[actionId];
  const log = [];
  if (!action) return { success: false, detected: false, log: ["Unbekannte Spionageaktion."] };
  if ((attacker.espionagePoints ?? 0) < action.cost) {
    return { success: false, detected: false, log: [`Nicht genug Spionagepunkte (benötigt ${action.cost} SP).`] };
  }
  attacker.espionagePoints -= action.cost;

  const counterIntel = Math.min(0.3, (defender.espionagePoints ?? 0) / 2000);
  const missionSuccess = Math.random() < MISSION_BASE_SUCCESS_CHANCE - counterIntel;
  if (!missionSuccess) {
    log.push(`Mission gescheitert: ${action.name} konnte nicht durchgeführt werden.`);
    return { success: false, detected: false, log };
  }

  if (actionId === "stealTech") {
    stealTech(attacker, defender, log);
  } else {
    const targetPlanet = pickTargetPlanet(galaxy, defender.id);
    if (!targetPlanet) {
      log.push("Kein Zielplanet gefunden.");
      return { success: false, detected: false, log };
    }
    if (actionId === "sabotage") sabotage(defender, targetPlanet, log);
    else if (actionId === "rebellion") incitRebellion(defender, targetPlanet, log);
  }

  const isDarlok = attacker.raceId === "darlok";
  const detectionChance = Math.max(0.05, BASE_DETECTION_CHANCE - (isDarlok ? DARLOK_DETECTION_REDUCTION : 0));
  const detected = Math.random() < detectionChance;
  if (!detected) {
    log.push("Die Aktion blieb unentdeckt.");
    return { success: true, detected: false, log };
  }

  if (useFraming) {
    const others = galaxy.empires.filter((e) => e.id !== attacker.id && e.id !== defender.id && !e.eliminated);
    if (others.length > 0) {
      const framed = others[Math.floor(Math.random() * others.length)];
      const frameSuccessChance = isDarlok ? DARLOK_FRAME_SUCCESS_CHANCE : DEFAULT_FRAME_SUCCESS_CHANCE;
      if (Math.random() < frameSuccessChance) {
        setRelationStatus(galaxy, defender.id, framed.id, "war");
        log.push(`Entdeckt, aber erfolgreich ${framed.name} in die Schuhe geschoben – ${defender.name} erklärt ${framed.name} den Krieg.`);
        return { success: true, detected: true, framed: framed.id, log };
      }
      log.push("Framing-Versuch misslungen – die wahre Herkunft kommt ans Licht.");
    }
  }

  if (!isAtWar(galaxy, attacker.id, defender.id)) {
    setRelationStatus(galaxy, attacker.id, defender.id, "war");
    log.push(`Entdeckt! ${defender.name} erklärt ${attacker.name} den Krieg.`);
  } else {
    log.push("Entdeckt, aber man befand sich bereits im Krieg.");
  }
  return { success: true, detected: true, framed: null, log };
}
