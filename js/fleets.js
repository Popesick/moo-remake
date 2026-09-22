import { PARSEC_PIXELS, DEFAULT_TRAVEL_SPEED, DEFAULT_TRAVEL_RANGE_PARSEC } from "./data/logistics.js";
import { findPath, laneDistance } from "./starlanes.js";

function nextFleetId(galaxy) {
  galaxy.nextFleetId = (galaxy.nextFleetId ?? 1) + 1;
  return `fleet-${galaxy.nextFleetId - 1}`;
}

export function findFleetsAt(galaxy, systemId, empireId) {
  return galaxy.fleets.filter((f) => f.systemId === systemId && f.ownerEmpireId === empireId && !f.destinationSystemId);
}

// Neue Schiffe entstehen als eigener Stack in einer (neuen oder bestehenden,
// stationären) Flotte am Bauplaneten-System.
export function addShipsToSystem(galaxy, empireId, systemId, designId, count) {
  if (count <= 0) return;
  let fleet = galaxy.fleets.find(
    (f) => f.systemId === systemId && f.ownerEmpireId === empireId && !f.destinationSystemId
  );
  if (!fleet) {
    fleet = { id: nextFleetId(galaxy), ownerEmpireId: empireId, systemId, destinationSystemId: null, stacks: [] };
    galaxy.fleets.push(fleet);
  }
  const stack = fleet.stacks.find((s) => s.designId === designId);
  if (stack) stack.count += count;
  else fleet.stacks.push({ designId, count });
}

function fleetShipCount(fleet) {
  return fleet.stacks.reduce((sum, s) => sum + s.count, 0);
}

// Treibstoffreichweite (ROADMAP v0.10, seit v0.13 entlang der
// Sternenstraßen statt Luftlinie): ein Ziel ist erreichbar, wenn der
// kürzeste Sternenstraßen-Pfad ab irgendeiner eigenen Kolonie innerhalb von
// empire.travelRangeParsec liegt. Reisen zwischen zwei eigenen Systemen ist
// davon unabhängig immer uneingeschränkt möglich.
export function isSystemInRange(galaxy, empire, targetSystem) {
  if (!empire) return true;
  const destOwnedByEmpire = targetSystem.planets.some((p) => p.colonizedBy === empire.id);
  if (destOwnedByEmpire) return true;
  const ownedSystems = galaxy.systems.filter((s) => s.planets.some((p) => p.colonizedBy === empire.id));
  if (ownedSystems.length === 0) return true;
  const range = empire.travelRangeParsec ?? DEFAULT_TRAVEL_RANGE_PARSEC;
  return ownedSystems.some((s) => {
    const pathDist = laneDistance(galaxy, s.id, targetSystem.id);
    return pathDist !== null && pathDist / PARSEC_PIXELS <= range;
  });
}

// Setzt eine einzelne Etappe einer mehrstufigen Sternenstraßen-Reise auf.
function beginLeg(fleet, empire, fromSystem, toSystem) {
  const distance = Math.hypot(toSystem.x - fromSystem.x, toSystem.y - fromSystem.y);
  const speed = Math.max(1, empire?.travelSpeedParsec ?? DEFAULT_TRAVEL_SPEED) * PARSEC_PIXELS;
  fleet.originSystemId = fromSystem.id;
  fleet.destinationSystemId = toSystem.id;
  fleet.travelRemaining = distance;
  fleet.travelSpeed = speed;
  fleet.travelTotal = distance;
}

// Schickt eine Flotte entlang des kürzesten Sternenstraßen-Pfads zum Ziel
// (ROADMAP v0.13: Flotten reisen nicht mehr frei im Raum, sondern folgen
// dem bei der Galaxie-Generierung erzeugten Sternenstraßen-Netz,
// js/starlanes.js). Die Reise läuft automatisch über mehrere Etappen
// (Zwischenankünfte lösen keine Benachrichtigung/Stopp aus), bis das
// eigentliche Ziel erreicht ist.
export function sendFleet(galaxy, fleetId, destinationSystemId) {
  const fleet = galaxy.fleets.find((f) => f.id === fleetId);
  if (!fleet) return { ok: false, reason: "Flotte nicht gefunden." };
  if (fleet.destinationSystemId) return { ok: false, reason: "Flotte bereits unterwegs." };
  const origin = galaxy.systems.find((s) => s.id === fleet.systemId);
  const destination = galaxy.systems.find((s) => s.id === destinationSystemId);
  if (!origin || !destination) return { ok: false, reason: "System nicht gefunden." };
  if (origin.id === destination.id) return { ok: false, reason: "Flotte befindet sich bereits dort." };

  const empire = galaxy.empires.find((e) => e.id === fleet.ownerEmpireId);
  if (!isSystemInRange(galaxy, empire, destination)) {
    const range = empire?.travelRangeParsec ?? DEFAULT_TRAVEL_RANGE_PARSEC;
    return { ok: false, reason: `Ziel außerhalb der Treibstoffreichweite (${range} Parsec ab eigenen Kolonien).` };
  }

  const path = findPath(galaxy, origin.id, destination.id);
  if (!path || path.length < 2) {
    return { ok: false, reason: "Keine Sternenstraßen-Route zum Ziel gefunden." };
  }

  const systemsById = new Map(galaxy.systems.map((s) => [s.id, s]));
  beginLeg(fleet, empire, origin, systemsById.get(path[1]));
  fleet.finalDestinationSystemId = destination.id;
  fleet.remainingPath = path.slice(2);
  return { ok: true };
}

// Ruft eine bereits unterwegs befindliche Flotte zurück (ROADMAP v0.12,
// KI-Verteidigungspriorisierung aus "MoO KI Verhalten.docx": "Im Kriegsfall
// konzentriert sich die KI immer zuerst auf den Schutz der eigenen
// Planeten"). *Vereinfacht:* die Flotte springt sofort an das
// Ursprungssystem der AKTUELLEN Etappe zurück (nicht an den allerersten
// Startpunkt der gesamten Reise) statt die Restdistanz korrekt in eine neue
// Route umzurechnen.
export function recallFleet(galaxy, fleetId) {
  const fleet = galaxy.fleets.find((f) => f.id === fleetId);
  if (!fleet || !fleet.destinationSystemId) return { ok: false, reason: "Flotte ist nicht unterwegs." };
  fleet.systemId = fleet.originSystemId ?? fleet.systemId;
  fleet.destinationSystemId = null;
  fleet.originSystemId = null;
  fleet.finalDestinationSystemId = null;
  fleet.remainingPath = null;
  fleet.travelRemaining = 0;
  fleet.travelSpeed = undefined;
  fleet.travelTotal = undefined;
  return { ok: true };
}

// Splittet einen Stack (gleiches Design) in eine neue, stationäre Flotte am
// selben System ab, um Teilstreitkräfte separat verlegen zu können (siehe
// design-analyse.docx "Stack-Splitting").
export function splitStack(galaxy, fleetId, designId, splitCount) {
  const fleet = galaxy.fleets.find((f) => f.id === fleetId);
  if (!fleet) return { ok: false, reason: "Flotte nicht gefunden." };
  const stack = fleet.stacks.find((s) => s.designId === designId);
  if (!stack || splitCount <= 0 || splitCount >= stack.count) {
    return { ok: false, reason: "Ungültige Aufteilung." };
  }
  stack.count -= splitCount;
  const newFleet = {
    id: nextFleetId(galaxy),
    ownerEmpireId: fleet.ownerEmpireId,
    systemId: fleet.systemId,
    destinationSystemId: null,
    stacks: [{ designId, count: splitCount }],
  };
  galaxy.fleets.push(newFleet);
  return { ok: true, fleet: newFleet };
}

// Bewegt alle unterwegs befindlichen Flotten um ihre Rundengeschwindigkeit
// entlang ihres Sternenstraßen-Pfads (ROADMAP v0.13); eine schnelle Flotte
// mit kurzen Etappen kann so mehrere Zwischensysteme in einer Runde
// passieren (übrig gebliebenes Bewegungsbudget wird in die nächste Etappe
// übertragen). Zwischenankünfte lösen keine Ankunfts-Benachrichtigung aus,
// nur das endgültige Ziel; löscht leere Flotten.
export function advanceFleets(galaxy) {
  const arrivals = [];
  const systemsById = new Map(galaxy.systems.map((s) => [s.id, s]));

  for (const fleet of galaxy.fleets) {
    if (!fleet.destinationSystemId) continue;
    const empire = galaxy.empires.find((e) => e.id === fleet.ownerEmpireId);
    fleet.travelRemaining -= fleet.travelSpeed;

    while (fleet.travelRemaining <= 0 && fleet.destinationSystemId) {
      const overshoot = -fleet.travelRemaining;
      fleet.systemId = fleet.destinationSystemId;

      if (fleet.remainingPath && fleet.remainingPath.length > 0) {
        const [nextHopId, ...rest] = fleet.remainingPath;
        beginLeg(fleet, empire, systemsById.get(fleet.systemId), systemsById.get(nextHopId));
        fleet.remainingPath = rest;
        fleet.travelRemaining -= overshoot;
      } else {
        fleet.destinationSystemId = null;
        fleet.originSystemId = null;
        fleet.finalDestinationSystemId = null;
        fleet.remainingPath = null;
        fleet.travelRemaining = 0;
        fleet.travelSpeed = undefined;
        fleet.travelTotal = undefined;
        arrivals.push(fleet);
      }
    }
  }

  galaxy.fleets = galaxy.fleets.filter((f) => fleetShipCount(f) > 0);
  return arrivals;
}

export function fleetTotalShips(fleet) {
  return fleetShipCount(fleet);
}
