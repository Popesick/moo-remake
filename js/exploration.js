// Nebel des Krieges & Auto-Erkundung (ROADMAP v0.15, auf Nutzerwunsch):
// Der Spieler sieht nur Systeme, die er selbst erforscht (besucht) hat,
// plus die direkten Sternenstraßen-Nachbarn davon ("sieht nur, welche
// Lanes vom aktuellen System wegführen, solange die Systeme dahinter nicht
// erforscht wurden") – Nachbarsysteme sind nur als Position sichtbar, ohne
// Detailinformationen. Einmal erforschte Systeme bleiben dauerhaft bekannt
// (kein erneutes Vernebeln). *Vereinfacht:* gilt nur für den Spieler – die
// KI bleibt allwissend (siehe "MoO KI Verhalten.docx", ROADMAP v0.12).
import { multiSourceLaneDistances } from "./starlanes.js";
import { sendFleet } from "./fleets.js";
import { DEFAULT_TRAVEL_RANGE_PARSEC, PARSEC_PIXELS } from "./data/logistics.js";

const AUTO_EXPLORE_HULL_ID = "small";

export function initEmpireExploration(empire, homeSystemId) {
  empire.exploredSystemIds = homeSystemId ? [homeSystemId] : [];
}

function markExplored(empire, systemId) {
  if (!empire.exploredSystemIds) empire.exploredSystemIds = [];
  if (!empire.exploredSystemIds.includes(systemId)) empire.exploredSystemIds.push(systemId);
}

// Aktualisiert die erforschten Systeme jedes Imperiums: alle eigenen
// Kolonien und die aktuellen Standorte aller eigenen Flotten gelten als
// erforscht. Wird jede Runde nach der Flottenbewegung aufgerufen, damit ein
// gerade angekommenes System sofort sichtbar wird.
export function updateExploredSystems(galaxy) {
  for (const empire of galaxy.empires) {
    for (const system of galaxy.systems) {
      if (system.planets.some((p) => p.colonizedBy === empire.id)) markExplored(empire, system.id);
    }
    for (const fleet of galaxy.fleets) {
      if (fleet.ownerEmpireId === empire.id) markExplored(empire, fleet.systemId);
    }
  }
}

function buildNeighborMap(galaxy) {
  const neighbors = new Map();
  for (const system of galaxy.systems) neighbors.set(system.id, new Set());
  for (const lane of galaxy.starlanes ?? []) {
    neighbors.get(lane.a)?.add(lane.b);
    neighbors.get(lane.b)?.add(lane.a);
  }
  return neighbors;
}

// Liefert die erforschten Systeme (volle Details) und die sichtbaren
// Systeme (erforscht plus direkte Sternenstraßen-Nachbarn, nur Position)
// eines Imperiums.
export function getExploredAndVisible(galaxy, empireId) {
  const empire = galaxy.empires.find((e) => e.id === empireId);
  const explored = new Set(empire?.exploredSystemIds ?? []);
  const neighbors = buildNeighborMap(galaxy);
  const visible = new Set(explored);
  for (const systemId of explored) {
    for (const neighborId of neighbors.get(systemId) ?? []) {
      visible.add(neighborId);
    }
  }
  return { explored, visible };
}

export function isSystemExplored(galaxy, empireId, systemId) {
  const empire = galaxy.empires.find((e) => e.id === empireId);
  return empire?.exploredSystemIds?.includes(systemId) ?? false;
}

// Nur Flotten, deren Schiffe ausschließlich auf einem Small-Rumpf-Design
// basieren, dürfen automatisch erkunden (Nutzer-Feedback: "für kleine
// Schiffe") – Kolonieschiffe (kein Design, siehe COLONY_SHIP_DESIGN_ID) und
// größere Kampfschiffe sind ausgeschlossen.
export function isFleetEligibleForAutoExplore(fleet, empire) {
  if (fleet.stacks.length === 0) return false;
  return fleet.stacks.every((s) => {
    const design = empire.shipDesigns.find((d) => d.id === s.designId);
    return design?.hullId === AUTO_EXPLORE_HULL_ID;
  });
}

// Schickt jede eigene, stationäre Flotte im Auto-Erkundungs-Modus zum
// nächstgelegenen, noch unerforschten und erreichbaren System – "immer das
// nächste nicht erkundete System" (Nutzer-Feedback). Läuft für alle
// Imperien, ist aber praktisch nur für den Spieler relevant, da die KI den
// Modus nie setzt.
export function runAutoExplore(galaxy, empire) {
  const fleets = galaxy.fleets.filter(
    (f) => f.ownerEmpireId === empire.id && !f.destinationSystemId && f.autoExplore
  );
  if (fleets.length === 0) return;

  const explored = new Set(empire.exploredSystemIds ?? []);
  const rangePixels = (empire.travelRangeParsec ?? DEFAULT_TRAVEL_RANGE_PARSEC) * PARSEC_PIXELS;
  const claimed = new Set();

  for (const fleet of fleets) {
    const distances = multiSourceLaneDistances(galaxy, [fleet.systemId]);
    let best = null;
    let bestDist = Infinity;
    for (const system of galaxy.systems) {
      if (explored.has(system.id) || claimed.has(system.id)) continue;
      const d = distances.get(system.id);
      if (d === undefined || d > rangePixels) continue;
      if (d < bestDist) {
        bestDist = d;
        best = system;
      }
    }
    if (best) {
      const result = sendFleet(galaxy, fleet.id, best.id);
      if (result.ok) claimed.add(best.id);
    }
  }
}
