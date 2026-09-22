// Einfache Diplomatie (ROADMAP v0.6): Krieg/Frieden pro Imperiumspaar, keine
// Verträge/Handelsabkommen/Rat (folgen erst mit v0.9). Kampf zwischen
// Flotten unterschiedlicher Imperien (js/combat.js) findet nur im
// Kriegszustand statt.
function relationKey(empireIdA, empireIdB) {
  const [a, b] = [empireIdA, empireIdB].sort((x, y) => x - y);
  return `${a}-${b}`;
}

export function initRelations(galaxy) {
  galaxy.relations = {};
  for (let i = 0; i < galaxy.empires.length; i++) {
    for (let j = i + 1; j < galaxy.empires.length; j++) {
      galaxy.relations[relationKey(galaxy.empires[i].id, galaxy.empires[j].id)] = { status: "peace" };
    }
  }
}

export function getRelation(galaxy, empireIdA, empireIdB) {
  return galaxy.relations?.[relationKey(empireIdA, empireIdB)] ?? { status: "peace" };
}

export function isAtWar(galaxy, empireIdA, empireIdB) {
  return getRelation(galaxy, empireIdA, empireIdB).status === "war";
}

export function setRelationStatus(galaxy, empireIdA, empireIdB, status) {
  if (!galaxy.relations) galaxy.relations = {};
  galaxy.relations[relationKey(empireIdA, empireIdB)] = { status };
}
