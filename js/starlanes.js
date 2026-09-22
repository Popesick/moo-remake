// Sternenstraßen-Netzwerk (ROADMAP v0.13, auf Nutzerwunsch): Flotten reisen
// nicht mehr frei im leeren Raum von A nach B, sondern folgen einem festen
// Graphen aus Sternenstraßen zwischen benachbarten Systemen ("Das ist aus
// dem Reboot, würde ich aber trotzdem gerne übernehmen"). Das Netz wird
// einmalig bei der Galaxie-Generierung erzeugt (js/galaxyGen.js) und bleibt
// für die gesamte Partie fix.

function edgeKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// Erzeugt ein zusammenhängendes Sternenstraßen-Netz: ein Minimum Spanning
// Tree (Prim, garantiert Erreichbarkeit jedes Systems) plus zusätzliche
// Kanten zu den beiden jeweils nächstgelegenen Nachbarn jedes Systems
// (mehr Routenoptionen, Zyklen statt reiner Baumstruktur). Distanz = simple
// euklidische Pixeldistanz, wie an anderer Stelle im Projekt (js/fleets.js).
export function buildStarlanes(systems) {
  const n = systems.length;
  if (n <= 1) return [];

  const dist = (i, j) => Math.hypot(systems[i].x - systems[j].x, systems[i].y - systems[j].y);

  const inTree = new Set([0]);
  const edgeSet = new Set();
  const lanes = [];

  while (inTree.size < n) {
    let best = null;
    for (const i of inTree) {
      for (let j = 0; j < n; j++) {
        if (inTree.has(j)) continue;
        const d = dist(i, j);
        if (!best || d < best.d) best = { i, j, d };
      }
    }
    if (!best) break;
    inTree.add(best.j);
    const key = edgeKey(systems[best.i].id, systems[best.j].id);
    edgeSet.add(key);
    lanes.push({ a: systems[best.i].id, b: systems[best.j].id });
  }

  for (let i = 0; i < n; i++) {
    const neighbors = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      neighbors.push({ j, d: dist(i, j) });
    }
    neighbors.sort((a, b) => a.d - b.d);
    let added = 0;
    for (const { j } of neighbors) {
      if (added >= 2) break;
      const key = edgeKey(systems[i].id, systems[j].id);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        lanes.push({ a: systems[i].id, b: systems[j].id });
      }
      added += 1;
    }
  }

  return lanes;
}

// Adjazenzliste wird bei Bedarf frisch aus galaxy.starlanes aufgebaut (kein
// persistenter Cache, da Maps nicht JSON-serialisierbar sind und das Netz
// mit ~40-85 Systemen trivial billig neu zu berechnen ist).
function buildAdjacency(galaxy) {
  const systemsById = new Map(galaxy.systems.map((s) => [s.id, s]));
  const adjacency = new Map();
  for (const system of galaxy.systems) adjacency.set(system.id, []);
  for (const lane of galaxy.starlanes ?? []) {
    const a = systemsById.get(lane.a);
    const b = systemsById.get(lane.b);
    if (!a || !b) continue;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    adjacency.get(lane.a)?.push({ to: lane.b, dist: d });
    adjacency.get(lane.b)?.push({ to: lane.a, dist: d });
  }
  return adjacency;
}

// Kürzester Weg entlang der Sternenstraßen (Dijkstra). Liefert die
// geordnete Liste der System-IDs inklusive Start und Ziel, oder null, wenn
// kein Pfad existiert (sollte bei einem zusammenhängenden Netz nicht
// vorkommen, ist aber defensiv abgesichert).
export function findPath(galaxy, fromId, toId) {
  if (fromId === toId) return [fromId];
  const adjacency = buildAdjacency(galaxy);
  if (!adjacency.has(fromId) || !adjacency.has(toId)) return null;

  const dist = new Map([[fromId, 0]]);
  const prev = new Map();
  const visited = new Set();
  const queue = [[0, fromId]];

  while (queue.length > 0) {
    queue.sort((a, b) => a[0] - b[0]);
    const [d, u] = queue.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === toId) break;

    for (const { to, dist: w } of adjacency.get(u) ?? []) {
      if (visited.has(to)) continue;
      const nd = d + w;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, u);
        queue.push([nd, to]);
      }
    }
  }

  if (!dist.has(toId)) return null;
  const path = [toId];
  let cur = toId;
  while (cur !== fromId) {
    cur = prev.get(cur);
    if (cur === undefined) return null;
    path.unshift(cur);
  }
  return path;
}

// Gesamtlänge des kürzesten Sternenstraßen-Pfads in Pixeln, oder null, wenn
// unerreichbar.
export function laneDistance(galaxy, fromId, toId) {
  const path = findPath(galaxy, fromId, toId);
  if (!path) return null;
  const systemsById = new Map(galaxy.systems.map((s) => [s.id, s]));
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = systemsById.get(path[i]);
    const b = systemsById.get(path[i + 1]);
    total += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return total;
}

// Kürzeste Sternenstraßen-Distanz von JEDEM System zur nächstgelegenen
// Quelle aus sourceIds, in einem einzigen Dijkstra-Lauf (Multi-Source) statt
// einer Einzelabfrage pro Quelle – für UI-Zwecke wie die
// Reichweiten-Hervorhebung in js/render.js, wo pro Frame potenziell viele
// eigene Kolonien gegen alle Systeme geprüft werden müssten.
export function multiSourceLaneDistances(galaxy, sourceIds) {
  const adjacency = buildAdjacency(galaxy);
  const dist = new Map();
  const visited = new Set();
  const queue = [];
  for (const id of sourceIds) {
    if (dist.has(id)) continue;
    dist.set(id, 0);
    queue.push([0, id]);
  }

  while (queue.length > 0) {
    queue.sort((a, b) => a[0] - b[0]);
    const [d, u] = queue.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    for (const { to, dist: w } of adjacency.get(u) ?? []) {
      if (visited.has(to)) continue;
      const nd = d + w;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        queue.push([nd, to]);
      }
    }
  }
  return dist;
}
