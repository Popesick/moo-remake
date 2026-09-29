// Rundenereignis-Zusammenfassung (ROADMAP v0.24, Nutzer-Feedback): zu
// Beginn jeder Runde (bzw. sobald offene Kampf-Grid-Gefechte/Ratssitzungen
// abgeschlossen sind, siehe js/main.js finishTurnDisplay) werden alle
// relevanten Vorkommnisse des Spielers als Liste in der Kopfleisten-
// Seitenleiste angezeigt: neu entdeckte Imperien, fertiggestellte
// Kriegsschiffe, feindliche Flotten in eigenen Systemen sowie verlorene
// Planeten/Systeme. Die letzten beiden Kategorien werden per
// Vorher/Nachher-Vergleich des Spieler-Besitzstands ermittelt (snapshot
// VOR simulateTurn, computeTurnEvents NACH Abschluss der gesamten Runde
// inkl. etwaiger interaktiver Kampf-Grid-Gefechte) statt an jeder einzelnen
// Stelle, an der sich ein Planet den Besitzer ändern kann (Invasion,
// Bioangriff, KI-Eroberung …), einen eigenen Meldungs-Aufruf einzubauen.
import { isAtWar } from "./diplomacy.js";

function ownedPlanetKey(systemId, planetId) {
  return `${systemId}:${planetId}`;
}

export function snapshotPlayerState(galaxy, player) {
  const ownedPlanets = new Map();
  const ownedSystems = new Set();
  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.colonizedBy !== player.id) continue;
      ownedPlanets.set(ownedPlanetKey(system.id, planet.id), { systemId: system.id, systemName: system.name, planetName: planet.name });
      ownedSystems.add(system.id);
    }
  }
  return { ownedPlanets, ownedSystems };
}

let eventCounter = 0;
function makeEvent(type, icon, text, extra = {}) {
  eventCounter += 1;
  return { id: `evt-${eventCounter}`, type, icon, text, ...extra };
}

// `before` kommt von snapshotPlayerState (vor simulateTurn), `extra` bündelt
// die während der Rundenverarbeitung gesammelten Rohdaten (arrivals,
// shipsBuilt, newDiscoveries aus js/economy.js simulateTurn).
export function computeTurnEvents(galaxy, player, before, { arrivals = [], shipsBuilt = [], newDiscoveries = [] } = {}) {
  const events = [];

  for (const entry of newDiscoveries) {
    if (entry.empireId !== player.id) continue;
    const other = galaxy.empires.find((e) => e.id === entry.discoveredEmpireId);
    if (!other) continue;
    events.push(
      makeEvent("empire-discovered", "empire-discovered", `Neues Imperium entdeckt: ${other.name}`, { empireId: other.id })
    );
  }

  for (const built of shipsBuilt) {
    const system = galaxy.systems.find((s) => s.id === built.systemId);
    events.push(
      makeEvent(
        "ship-built",
        "ship-built",
        `${built.count}× ${built.designName} fertiggestellt (${system?.name ?? "?"})`,
        { systemId: built.systemId, fleetId: built.fleetId }
      )
    );
  }

  const seenEnemySystems = new Set();
  for (const fleet of arrivals) {
    if (fleet.ownerEmpireId === player.id) continue;
    if (!before.ownedSystems.has(fleet.systemId)) continue;
    if (!isAtWar(galaxy, player.id, fleet.ownerEmpireId)) continue;
    if (seenEnemySystems.has(fleet.systemId)) continue;
    seenEnemySystems.add(fleet.systemId);
    const system = galaxy.systems.find((s) => s.id === fleet.systemId);
    events.push(
      makeEvent("enemy-sighted", "enemy-sighted", `Feind gesichtet in ${system?.name ?? "einem System"}`, { systemId: fleet.systemId })
    );
  }

  const stillOwnedPlanets = new Set();
  const stillOwnedSystems = new Set();
  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.colonizedBy !== player.id) continue;
      stillOwnedPlanets.add(ownedPlanetKey(system.id, planet.id));
      stillOwnedSystems.add(system.id);
    }
  }

  for (const [key, info] of before.ownedPlanets) {
    if (stillOwnedPlanets.has(key)) continue;
    events.push(
      makeEvent("planet-lost", "planet-lost", `Planet besetzt: ${info.systemName} ${info.planetName}`, { systemId: info.systemId })
    );
  }

  for (const systemId of before.ownedSystems) {
    if (stillOwnedSystems.has(systemId)) continue;
    const system = galaxy.systems.find((s) => s.id === systemId);
    events.push(
      makeEvent("system-lost", "system-lost", `System verloren: ${system?.name ?? "?"}`, { systemId })
    );
  }

  return events;
}
