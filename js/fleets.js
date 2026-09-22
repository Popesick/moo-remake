import { PARSEC_PIXELS } from "./data/logistics.js";

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

export function sendFleet(galaxy, fleetId, destinationSystemId, travelSpeedParsec) {
  const fleet = galaxy.fleets.find((f) => f.id === fleetId);
  if (!fleet) return { ok: false, reason: "Flotte nicht gefunden." };
  if (fleet.destinationSystemId) return { ok: false, reason: "Flotte bereits unterwegs." };
  const origin = galaxy.systems.find((s) => s.id === fleet.systemId);
  const destination = galaxy.systems.find((s) => s.id === destinationSystemId);
  if (!origin || !destination) return { ok: false, reason: "System nicht gefunden." };
  if (origin.id === destination.id) return { ok: false, reason: "Flotte befindet sich bereits dort." };

  const distance = Math.hypot(destination.x - origin.x, destination.y - origin.y);
  const speed = Math.max(1, travelSpeedParsec) * PARSEC_PIXELS;
  fleet.destinationSystemId = destinationSystemId;
  fleet.originSystemId = fleet.systemId;
  fleet.travelRemaining = distance;
  fleet.travelSpeed = speed;
  fleet.travelTotal = distance;
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

// Bewegt alle unterwegs befindlichen Flotten um ihre Rundengeschwindigkeit;
// löscht leere Flotten und markiert Ankünfte.
export function advanceFleets(galaxy) {
  const arrivals = [];
  for (const fleet of galaxy.fleets) {
    if (!fleet.destinationSystemId) continue;
    fleet.travelRemaining -= fleet.travelSpeed;
    if (fleet.travelRemaining <= 0) {
      fleet.systemId = fleet.destinationSystemId;
      fleet.destinationSystemId = null;
      fleet.originSystemId = null;
      fleet.travelRemaining = 0;
      fleet.travelSpeed = undefined;
      fleet.travelTotal = undefined;
      arrivals.push(fleet);
    }
  }
  galaxy.fleets = galaxy.fleets.filter((f) => fleetShipCount(f) > 0);
  return arrivals;
}

export function fleetTotalShips(fleet) {
  return fleetShipCount(fleet);
}
