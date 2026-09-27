// Interaktives Kampf-Grid (ROADMAP v0.16, auf Nutzerwunsch): optionale
// Alternative zur statistischen Auto-Auflösung in js/combat.js. Der Spieler
// bewegt seine Flotten-Stacks selbst über ein Hexfeld und greift damit
// gezielt an, wie in einem klassischen Rundenstrategiespiel. Wiederverwendet
// dieselbe Treffer-/Schadensmathematik pro Schuss wie die Auto-Auflösung
// (js/combat.js hitChance/missileHitChance/rollDamage/defenseRating), damit
// beide Modi konsistent bleiben.
//
// *Vereinfacht*: nur Zwei-Parteien-Gefechte sind interaktiv spielbar (siehe
// createBattle); ein Zusammentreffen von drei oder mehr Imperien am selben
// System läuft weiterhin automatisch. Ein Hexfeld trägt genau einen
// Flotten-Stack (alle Schiffe eines Designs eines Imperiums an diesem
// System), nicht ein einzelnes Schiff – Treffer verteilen sich daher immer
// auf das "vorderste" Schiff des Ziel-Stacks. Die zahlreichen
// Spezialfähigkeiten aus dem Techbaum, die im Techtree als "(ab v0.5)"
// markiert sind (Flächenschaden, Tarnung, Verdrängung, Stasisfeld,
// Teleport-Vorrang usw.), sind bewusst noch nicht umgesetzt – nur Waffen,
// Schilde, Geschwindigkeit und Angriffs-/ECM-Boni wirken bereits über die
// gemeinsame Kampfmathematik.
import { computeDesignStats } from "./shipDesign.js";
import {
  hitChance,
  missileHitChance,
  rollDamage,
  defenseRating,
  attackRatingFor,
  weaponRangeHexes,
  MAX_ROUNDS,
} from "./combat.js";

export const GRID_COLS = 11;
export const GRID_ROWS = 7;

// Kampffeld-Bewegungsreichweite in Hexfeldern: in keiner Analyse-Quelle
// beziffert (nur die Reisegeschwindigkeit zwischen Systemen ist es).
// Plausibler, hier zentral tunbarer Platzhalter: halbierte
// Antriebsgeschwindigkeit plus Rumpf-Ausweichbonus (kleine Schiffe sind
// wendiger als große), auf 2-8 Hexfelder begrenzt.
const TACTICAL_MOVE_BASE = 2;
function tacticalMoveRange(stats) {
  return Math.max(2, Math.min(8, TACTICAL_MOVE_BASE + Math.floor(stats.speed / 2) + stats.hullEvasionBonus));
}

function key(col, row) {
  return `${col},${row}`;
}

function keyToPos(k) {
  const [col, row] = k.split(",").map(Number);
  return { col, row };
}

// Odd-q-Offset-Koordinaten (flat-top Hexfelder) <-> Würfelkoordinaten, siehe
// redblobgames.com/grids/hexagons – Standardformeln für Distanz/Nachbarn auf
// einem rechteckigen Hexfeld-Ausschnitt.
function offsetToCube(col, row) {
  const x = col;
  const z = row - (col - (col & 1)) / 2;
  const y = -x - z;
  return { x, y, z };
}

export function hexDistance(a, b) {
  const ca = offsetToCube(a.col, a.row);
  const cb = offsetToCube(b.col, b.row);
  return Math.max(Math.abs(ca.x - cb.x), Math.abs(ca.y - cb.y), Math.abs(ca.z - cb.z));
}

const NEIGHBOR_DIRS_EVEN = [
  [1, 0], [1, -1], [0, -1],
  [-1, -1], [-1, 0], [0, 1],
];
const NEIGHBOR_DIRS_ODD = [
  [1, 1], [1, 0], [0, -1],
  [-1, 0], [-1, 1], [0, 1],
];

function neighborsOf(col, row) {
  const dirs = col % 2 === 0 ? NEIGHBOR_DIRS_EVEN : NEIGHBOR_DIRS_ODD;
  return dirs.map(([dc, dr]) => ({ col: col + dc, row: row + dr }));
}

function inBounds(col, row) {
  return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}

// Breitensuche über die erreichbaren, unbesetzten Hexfelder innerhalb der
// Bewegungsreichweite (keine Wegkosten je Feld, kein Gelände).
function tilesReachable(battle, unit, range) {
  const occupied = new Set(
    battle.units.filter((u) => u.count > 0 && u.id !== unit.id).map((u) => key(u.col, u.row))
  );
  const visited = new Map();
  visited.set(key(unit.col, unit.row), 0);
  let frontier = [{ col: unit.col, row: unit.row }];
  for (let step = 1; step <= range; step++) {
    const next = [];
    for (const cell of frontier) {
      for (const n of neighborsOf(cell.col, cell.row)) {
        if (!inBounds(n.col, n.row)) continue;
        const k = key(n.col, n.row);
        if (visited.has(k) || occupied.has(k)) continue;
        visited.set(k, step);
        next.push(n);
      }
    }
    frontier = next;
  }
  visited.delete(key(unit.col, unit.row));
  return visited;
}

export function reachableTiles(battle, unit) {
  if (!unit || unit.hasMoved || unit.count <= 0) return [];
  return [...tilesReachable(battle, unit, unit.moveRange).keys()].map(keyToPos);
}

export function attackableTargets(battle, unit) {
  if (!unit || unit.hasActed || unit.count <= 0) return [];
  const maxRange = Math.max(0, ...unit.weapons.map((w) => weaponRangeHexes(w.tech)));
  return battle.units.filter(
    (u) => u.count > 0 && u.empireId !== unit.empireId && hexDistance(unit, u) <= maxRange
  );
}

// Baut den Kampf für ein System auf: genau ein Hexfeld-Stack pro
// (Imperium, Design) – Kolonieschiffe (kein reguläres Design) nehmen wie
// bei der Auto-Auflösung nicht teil. Liefert null, wenn das Gefecht nicht
// interaktiv spielbar ist (mehr als zwei Parteien, oder der Spieler ist gar
// nicht beteiligt) – der Aufrufer soll dann auf die Auto-Auflösung
// zurückfallen.
export function createBattle(galaxy, systemId, playerEmpireId) {
  const fleetsHere = galaxy.fleets.filter((f) => f.systemId === systemId && !f.destinationSystemId);
  const empireIds = [...new Set(fleetsHere.map((f) => f.ownerEmpireId))];
  if (empireIds.length !== 2 || !empireIds.includes(playerEmpireId)) return null;
  const enemyEmpireId = empireIds.find((id) => id !== playerEmpireId);

  const units = [];
  const startCounts = {};
  let uid = 0;

  for (const empireId of empireIds) {
    const empire = galaxy.empires.find((e) => e.id === empireId);
    const attackRating = attackRatingFor(empire);
    const byDesign = new Map();
    for (const fleet of fleetsHere.filter((f) => f.ownerEmpireId === empireId)) {
      for (const stack of fleet.stacks) {
        const design = empire.shipDesigns.find((d) => d.id === stack.designId);
        if (!design) continue;
        byDesign.set(stack.designId, (byDesign.get(stack.designId) ?? 0) + stack.count);
      }
    }

    const entries = [...byDesign.entries()];
    startCounts[empireId] = entries.reduce((sum, [, count]) => sum + count, 0);
    const homeCol = empireId === playerEmpireId ? 0 : GRID_COLS - 1;
    const startRow = Math.max(0, Math.floor((GRID_ROWS - entries.length) / 2));

    entries.forEach(([designId, count], idx) => {
      const design = empire.shipDesigns.find((d) => d.id === designId);
      const stats = computeDesignStats(design, empire);
      units.push({
        id: `u${uid++}`,
        empireId,
        designId,
        designName: design.name,
        count,
        shipHp: new Array(count).fill(stats.hp),
        maxHp: stats.hp,
        shield: stats.shieldAbsorption,
        speed: stats.speed,
        hullEvasionBonus: stats.hullEvasionBonus + (empire.maneuverBonus ?? 0),
        attackRating,
        ecmDefense: empire.ecmDefense ?? 0,
        weapons: stats.weaponLines,
        moveRange: tacticalMoveRange(stats),
        col: homeCol,
        row: Math.min(GRID_ROWS - 1, startRow + idx),
        hasMoved: false,
        hasActed: false,
      });
    });
  }

  if (!units.some((u) => u.empireId === playerEmpireId) || !units.some((u) => u.empireId === enemyEmpireId)) {
    return null;
  }

  return {
    systemId,
    empireIds,
    playerEmpireId,
    enemyEmpireId,
    units,
    round: 1,
    log: [],
    finished: false,
    winnerEmpireId: null,
    startCounts,
  };
}

function checkBattleEnd(battle) {
  if (battle.finished) return;
  const alive = new Set(battle.units.filter((u) => u.count > 0).map((u) => u.empireId));
  if (alive.size < 2) {
    battle.finished = true;
    battle.winnerEmpireId = alive.size === 1 ? [...alive][0] : null;
  }
}

// Löst einen Angriff auf (alle Waffen des Angreifers, deren Reichweite die
// aktuelle Distanz abdeckt) – dieselbe Treffer-/Schadenslogik pro Schuss wie
// js/combat.js runBattleRounds, nur auf Stack- statt Einzelschiff-Ebene:
// Schaden trifft immer das vorderste noch lebende Schiff des Ziel-Stacks.
function resolveAttack(battle, attacker, target, dist) {
  for (const line of attacker.weapons) {
    const tech = line.tech;
    if (weaponRangeHexes(tech) < dist) continue;
    if (tech.module.everyOtherTurn && battle.round % 2 === 0) continue;

    const totalShots = (tech.module.shots ?? 1) * line.count * attacker.count;
    for (let s = 0; s < totalShots; s++) {
      if (target.count <= 0) break;
      const hit = tech.module.isMissile
        ? Math.random() < missileHitChance(target)
        : Math.random() < hitChance(attacker.attackRating, defenseRating(target));
      if (!hit) continue;

      let dmg = rollDamage(tech, target.maxHp);
      if (!tech.module.ignoresShields) {
        let shield = target.shield;
        if (tech.module.shieldHalving) shield = Math.floor(shield / 2);
        dmg = Math.max(0, dmg - shield);
      }
      if (dmg <= 0) continue;

      target.shipHp[0] -= dmg;
      if (target.shipHp[0] <= 0) {
        target.shipHp.shift();
        target.count -= 1;
        battle.log.push(
          `Runde ${battle.round}: ${attacker.designName} (Imperium ${attacker.empireId}) zerstört ${target.designName} (Imperium ${target.empireId}) mit ${tech.name}.`
        );
        if (target.count <= 0) break;
      }
    }
    if (target.count <= 0) break;
  }
}

export function moveUnitTo(battle, unitId, col, row) {
  const unit = battle.units.find((u) => u.id === unitId);
  if (!unit || unit.hasMoved || unit.count <= 0) return { ok: false, reason: "Zug bereits verbraucht." };
  if (!reachableTiles(battle, unit).some((p) => p.col === col && p.row === row)) {
    return { ok: false, reason: "Außerhalb der Bewegungsreichweite." };
  }
  unit.col = col;
  unit.row = row;
  unit.hasMoved = true;
  return { ok: true };
}

export function attackWithUnit(battle, attackerId, targetId) {
  const attacker = battle.units.find((u) => u.id === attackerId);
  const target = battle.units.find((u) => u.id === targetId);
  if (!attacker || !target || attacker.hasActed || attacker.count <= 0 || target.count <= 0) {
    return { ok: false, reason: "Angriff nicht möglich." };
  }
  if (attacker.empireId === target.empireId) return { ok: false, reason: "Kein gültiges Ziel." };
  const dist = hexDistance(attacker, target);
  if (!attacker.weapons.some((w) => weaponRangeHexes(w.tech) >= dist)) {
    return { ok: false, reason: "Ziel außerhalb der Waffenreichweite." };
  }
  resolveAttack(battle, attacker, target, dist);
  attacker.hasActed = true;
  checkBattleEnd(battle);
  return { ok: true };
}

// Bewegt eine KI-Einheit so nah wie in ihrer Reichweite möglich an ihr Ziel
// heran (einfache Greedy-Heuristik: unter allen erreichbaren Feldern das mit
// der geringsten Restdistanz zum Ziel).
function moveTowards(battle, unit, target) {
  const reachable = reachableTiles(battle, unit);
  if (reachable.length === 0) return;
  let best = null;
  let bestDist = hexDistance(unit, target);
  for (const pos of reachable) {
    const d = hexDistance(pos, target);
    if (d < bestDist) {
      bestDist = d;
      best = pos;
    }
  }
  if (best) {
    unit.col = best.col;
    unit.row = best.row;
  }
}

// KI-Phase (ROADMAP v0.16): einfache Heuristik statt der vollen
// Zielbewertung aus js/ai.js (die für die strategische Karte gilt, nicht
// das taktische Kampf-Grid) – jede Einheit sucht sich das nächste Ziel,
// bewegt sich bei Bedarf heran und feuert, sobald es in Reichweite ist.
function runAiPhase(battle) {
  const aiUnits = battle.units.filter((u) => u.empireId === battle.enemyEmpireId && u.count > 0);
  for (const unit of aiUnits) {
    if (battle.finished || unit.count <= 0) continue;
    const enemies = battle.units.filter((u) => u.empireId === battle.playerEmpireId && u.count > 0);
    if (enemies.length === 0) break;

    let target = null;
    let bestDist = Infinity;
    for (const e of enemies) {
      const d = hexDistance(unit, e);
      if (d < bestDist) {
        bestDist = d;
        target = e;
      }
    }

    const maxRange = Math.max(0, ...unit.weapons.map((w) => weaponRangeHexes(w.tech)));
    if (bestDist > maxRange) {
      moveTowards(battle, unit, target);
      bestDist = hexDistance(unit, target);
    }
    if (bestDist <= maxRange) {
      resolveAttack(battle, unit, target, bestDist);
    }
  }
}

// Beendet die Spielerphase: KI zieht/feuert, danach beginnt (sofern das
// Gefecht nicht bereits entschieden ist) die nächste Runde mit
// zurückgesetzten Zug-/Angriffsmarkierungen.
export function endPlayerPhase(battle) {
  if (battle.finished) return;
  runAiPhase(battle);
  checkBattleEnd(battle);
  if (battle.finished) return;

  battle.round += 1;
  if (battle.round > MAX_ROUNDS) {
    battle.finished = true;
    battle.winnerEmpireId = null;
    return;
  }
  for (const u of battle.units) {
    u.hasMoved = false;
    u.hasActed = false;
  }
}

// Rückzug: die verbliebenen eigenen Schiffe fliehen mit ihrem aktuellen
// Zustand (kein Totalverlust) und stehen danach wieder als reguläre Flotte
// am System zur Verfügung; der Gegner gilt als Sieger dieses Gefechts.
export function retreat(battle, empireId) {
  if (battle.finished) return;
  battle.finished = true;
  battle.winnerEmpireId = battle.empireIds.find((id) => id !== empireId) ?? null;
  battle.log.push(`Imperium ${empireId} zieht die verbliebene Flotte aus dem Gefecht zurück.`);
}

// Wandelt den Kampfausgang in dieselbe Ergebnisform um, die auch
// js/combat.js runBattleRounds liefert, damit die Anwendung des Ergebnisses
// (Flotten neu aufbauen, Kill-Zuordnung, Kampfbericht) für beide Modi
// identisch bleibt.
export function finalizeBattleResult(battle) {
  const survivorsByEmpire = new Map();
  const shipsLostByEmpire = {};
  for (const id of battle.empireIds) {
    const survivorUnits = battle.units.filter((u) => u.empireId === id && u.count > 0);
    survivorsByEmpire.set(id, survivorUnits.map((u) => ({ designId: u.designId, count: u.count })));
    const remaining = survivorUnits.reduce((sum, u) => sum + u.count, 0);
    shipsLostByEmpire[id] = Math.max(0, (battle.startCounts[id] ?? 0) - remaining);
  }
  return {
    empireIds: battle.empireIds,
    winnerEmpireId: battle.winnerEmpireId,
    rounds: battle.round,
    log: battle.log,
    survivorsByEmpire,
    shipsLostByEmpire,
  };
}
