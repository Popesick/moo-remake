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
// auf das "vorderste" Schiff des Ziel-Stacks.
//
// Alle im Techtree als "(ab v0.5)" markierten Spezialfähigkeiten (ROADMAP
// v0.19) sind jetzt umgesetzt, siehe Abschnitt "Spezialfähigkeiten" unten:
// Waffen, Schilde, Geschwindigkeit, Angriffs-/ECM-Boni, Feuerreichweite
// (inkl. High-Energy-Focus-Bonus) und Beam-Distanzabfall (ROADMAP v0.18)
// wirken bereits über die gemeinsame Kampfmathematik; die restlichen
// Fähigkeiten werden hier als Boni/Effekte auf die Kampf-Grid-Einheiten
// angewendet.
import { computeDesignStats } from "./shipDesign.js";
import {
  hitChance,
  missileHitChance,
  rollDamage,
  defenseRating,
  attackRatingFor,
  weaponRangeHexes,
  rangeBonusForEmpire,
  rangeDamageMultiplier,
  MAX_ROUNDS,
  MONSTER_EMPIRE_ID,
} from "./combat.js";
import { isOrionGuarded } from "./orion.js";
import { GUARDIAN_STATS } from "./data/orionGuardian.js";
import { SPACE_MONSTER_STATS } from "./data/galacticEvents.js";

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

// ---------------------------------------------------------------------
// Spezialfähigkeiten (ROADMAP v0.19): alle im Techbaum als "(ab v0.5)"
// markierten Kampf-Technologien, die zuvor `effect: { type: "flavor" }`
// waren (reines Textversprechen ohne Wirkung). Battle-Computer-/ECM-Stufen
// sowie alle Deflector-Schild-Klassen wirkten bereits vorher (über
// `applyTechEffect`/das Schiffsdesign-Modulsystem) und sind hier nicht
// erneut aufgeführt. Für jede Fähigkeit gilt: keine Analyse-Quelle
// beziffert ihre genaue Kampf-Grid-Wirkung – Werte/Formeln sind plausible,
// hier zentral tunbare Platzhalter, die den Techtree-Beschreibungstext so
// direkt wie im Rahmen des bestehenden Kampf-Grids möglich umsetzen.
const ABILITY_TECH = {
  battleScanner: "comp_battle_scanner",
  oracle: "comp_oracle",
  techNullifier: "comp_tech_nullifier",
  damageControl: "constr_damage_control",
  repulsor: "ff_repulsor",
  cloaking: "ff_cloaking",
  zyro: "ff_zyro",
  stasis: "ff_stasis",
  blackHole: "ff_black_hole",
  lightning: "ff_lightning",
  inertialStabilizer: "prop_inertial_stabilizer",
  energyPulsar: "prop_energy_pulsar",
  warpDissipator: "prop_warp_dissipator",
  subspaceTeleporter: "prop_subspace_teleporter",
  ionicPulsar: "prop_ionic_pulsar",
  subspaceInterdictor: "prop_subspace_interdictor",
  inertialNullifier: "prop_inertial_nullifier",
  displacement: "prop_displacement",
};

const TECH_NULLIFIER_MIN = 2;
const TECH_NULLIFIER_MAX = 6;
const DAMAGE_CONTROL_REGEN_FRACTION = 0.3;
const CLOAKING_EVASION_BONUS = 20;
const INERTIAL_STABILIZER_EVASION_BONUS = 2;
const INERTIAL_NULLIFIER_EVASION_BONUS = 4;
const INERTIAL_NULLIFIER_MOVE_BONUS = 2;
const WARP_DISSIPATOR_EVASION_PENALTY = 2;
const TELEPORTER_MOVE_RANGE = GRID_COLS + GRID_ROWS; // "frei" = jedes Feld in einem Zug erreichbar
const DISPLACEMENT_DODGE_CHANCE = 0.33;
const BLACK_HOLE_MIN_FRACTION = 0.25;
const BLACK_HOLE_MAX_FRACTION = 1.0;

function hasTech(empire, techId) {
  return empire?.research?.completedTechs?.includes(techId) ?? false;
}

// Fasst alle Spezialfähigkeits-Boni für ein Imperium in diesem Gefecht
// zusammen (einmal pro Imperium berechnet, siehe createBattle) –
// ownsSystem steuert Sub Space Interdictor (wirkt nur über eigenen
// Kolonien).
function computeAbilities(empire, ownsSystem) {
  const evasionBonus =
    (hasTech(empire, ABILITY_TECH.inertialNullifier)
      ? INERTIAL_NULLIFIER_EVASION_BONUS
      : hasTech(empire, ABILITY_TECH.inertialStabilizer)
        ? INERTIAL_STABILIZER_EVASION_BONUS
        : 0) + (hasTech(empire, ABILITY_TECH.cloaking) ? CLOAKING_EVASION_BONUS : 0);

  const missileDefenseChance = hasTech(empire, ABILITY_TECH.lightning)
    ? 1
    : hasTech(empire, ABILITY_TECH.zyro)
      ? 0.75
      : 0;

  const splashDamage = hasTech(empire, ABILITY_TECH.ionicPulsar)
    ? 10
    : hasTech(empire, ABILITY_TECH.energyPulsar)
      ? 5
      : 0;

  // Stasisfeld und Schwarzes-Loch-Generator sind beides "einmal pro Kampf
  // auslösbare Sondergeräte" statt regulärer Waffen (siehe
  // maybeTriggerSpecialDevice) – ist Black Hole erforscht, ersetzt es
  // Stasis Field als stärkeres, späteres Gerät.
  const specialDevice = hasTech(empire, ABILITY_TECH.blackHole)
    ? "blackHole"
    : hasTech(empire, ABILITY_TECH.stasis)
      ? "stasis"
      : null;

  return {
    attackBonusFlat: hasTech(empire, ABILITY_TECH.battleScanner) ? 1 : 0,
    hasOracle: hasTech(empire, ABILITY_TECH.oracle),
    hasNullifier: hasTech(empire, ABILITY_TECH.techNullifier),
    regenFraction: hasTech(empire, ABILITY_TECH.damageControl) ? DAMAGE_CONTROL_REGEN_FRACTION : 0,
    hasRepulsor: hasTech(empire, ABILITY_TECH.repulsor),
    evasionBonus,
    missileDefenseChance,
    splashDamage,
    specialDevice,
    moveRangeBonus: hasTech(empire, ABILITY_TECH.inertialNullifier) ? INERTIAL_NULLIFIER_MOVE_BONUS : 0,
    hasWarpDissipator: hasTech(empire, ABILITY_TECH.warpDissipator),
    // Roh-Wert, ob Sub Space Teleporter erforscht ist – die eigentliche
    // "Negiert gegnerischen Sub Space Teleporter über eigenen Kolonien"-Regel
    // braucht die Fähigkeiten BEIDER Seiten und wird erst in createBattle
    // angewendet (siehe dort, nachdem für beide Imperien berechnet wurde).
    hasTeleporter: hasTech(empire, ABILITY_TECH.subspaceTeleporter),
    dodgeChance: hasTech(empire, ABILITY_TECH.displacement) ? DISPLACEMENT_DODGE_CHANCE : 0,
    hasInterdictorAtHome: hasTech(empire, ABILITY_TECH.subspaceInterdictor) && ownsSystem,
  };
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
  if (!unit || unit.hasMoved || unit.count <= 0 || unit.frozenRounds > 0) return [];
  return [...tilesReachable(battle, unit, unit.moveRange).keys()].map(keyToPos);
}

export function attackableTargets(battle, unit) {
  if (!unit || unit.hasActed || unit.count <= 0 || unit.frozenRounds > 0) return [];
  const maxRange = Math.max(0, ...unit.weapons.map((w) => weaponRangeHexes(w.tech, unit.rangeBonus)));
  return battle.units.filter(
    (u) => u.count > 0 && u.empireId !== unit.empireId && hexDistance(unit, u) <= maxRange
  );
}

// Nicht-imperiale Gegner im Kampf-Grid (ROADMAP v0.27 für den Guardian of
// Orion, ROADMAP v0.30 für Weltraum-Monster aus galaktischen
// Zufallsereignissen – js/events.js resolveSpaceMonster): das interaktive
// Kampf-Grid griff bei solchen Gefechten zuvor gar nicht, obwohl die
// Einstellung aktiv war – createBattle verlangte zwingend zwei ECHTE
// Imperien. Diese Gegner sind kein Flotten-Eintrag in galaxy.fleets und
// haben keine Spezialfähigkeiten/Schiffsdesign, daher ein eigener,
// minimaler Einheiten-Baustein statt der Design-Lookup-Logik unten.
function buildMonsterUnit(stats, designId) {
  const moveRange = tacticalMoveRange({ speed: stats.speed, hullEvasionBonus: 0 });
  return {
    id: `${designId}-0`,
    empireId: MONSTER_EMPIRE_ID,
    designId,
    designName: stats.name,
    count: 1,
    shipHp: [stats.hp],
    maxHp: stats.hp,
    shield: stats.shield,
    speed: stats.speed,
    hullEvasionBonus: 0,
    attackRating: stats.attackRating,
    ecmDefense: 0,
    weapons: stats.weapons,
    rangeBonus: 0,
    moveRange,
    col: GRID_COLS - 1,
    row: Math.floor(GRID_ROWS / 2),
    hasMoved: false,
    hasActed: false,
    hasOracle: false,
    hasNullifier: false,
    hasRepulsor: false,
    regenFraction: 0,
    missileDefenseChance: 0,
    splashDamage: 0,
    dodgeChance: 0,
    specialDevice: null,
    usedSpecial: false,
    frozenRounds: 0,
  };
}

// Baut den Kampf für ein System auf: genau ein Hexfeld-Stack pro
// (Imperium, Design) – Kolonieschiffe (kein reguläres Design) nehmen wie
// bei der Auto-Auflösung nicht teil. Liefert null, wenn das Gefecht nicht
// interaktiv spielbar ist (mehr als zwei Parteien, oder der Spieler ist gar
// nicht beteiligt) – der Aufrufer soll dann auf die Auto-Auflösung
// zurückfallen. Ausnahme: der Spieler allein gegen den Guardian of Orion
// oder ein Weltraum-Monster (siehe buildMonsterUnit oben) gilt ebenfalls
// als spielbares Zwei-Parteien-Gefecht, auch wenn galaxy.fleets dafür nur
// den Spieler führt.
export function createBattle(galaxy, systemId, playerEmpireId) {
  const fleetsHere = galaxy.fleets.filter((f) => f.systemId === systemId && !f.destinationSystemId);
  const realEmpireIds = [...new Set(fleetsHere.map((f) => f.ownerEmpireId))];

  const isGuardianBattle =
    isOrionGuarded(galaxy, systemId) && realEmpireIds.length === 1 && realEmpireIds[0] === playerEmpireId;
  const isSpaceMonsterBattle =
    !isGuardianBattle &&
    galaxy.pendingSpaceMonster?.systemId === systemId &&
    realEmpireIds.length === 1 &&
    realEmpireIds[0] === playerEmpireId;
  const isMonsterBattle = isGuardianBattle || isSpaceMonsterBattle;
  if (!isMonsterBattle && (realEmpireIds.length !== 2 || !realEmpireIds.includes(playerEmpireId))) return null;

  const enemyEmpireId = isMonsterBattle ? MONSTER_EMPIRE_ID : realEmpireIds.find((id) => id !== playerEmpireId);
  const empireIds = isMonsterBattle ? [playerEmpireId, MONSTER_EMPIRE_ID] : realEmpireIds;

  const system = galaxy.systems.find((s) => s.id === systemId);
  const abilitiesByEmpire = new Map();
  for (const empireId of realEmpireIds) {
    const empire = galaxy.empires.find((e) => e.id === empireId);
    const ownsSystem = system?.planets.some((p) => p.colonizedBy === empireId) ?? false;
    abilitiesByEmpire.set(empireId, computeAbilities(empire, ownsSystem));
  }
  // Sub Space Interdictor (ROADMAP v0.19): negiert den gegnerischen Sub
  // Space Teleporter, aber nur solange das Gefecht über einer eigenen
  // Kolonie des Interdiktor-Besitzers stattfindet – braucht die
  // Fähigkeiten beider Seiten, daher erst hier nach obiger Schleife
  // aufgelöst. Der Guardian hat keine dieser Fähigkeiten (`other`/`mine`
  // bleiben dann undefined bzw. unverändert).
  for (const empireId of realEmpireIds) {
    const otherId = empireIds.find((id) => id !== empireId);
    const mine = abilitiesByEmpire.get(empireId);
    const other = abilitiesByEmpire.get(otherId);
    mine.teleports = mine.hasTeleporter && !(other?.hasInterdictorAtHome ?? false);
    if (other?.hasWarpDissipator) mine.evasionBonus -= WARP_DISSIPATOR_EVASION_PENALTY;
  }

  const units = [];
  const startCounts = {};
  let uid = 0;

  for (const empireId of realEmpireIds) {
    const empire = galaxy.empires.find((e) => e.id === empireId);
    const attackRating = attackRatingFor(empire) + abilitiesByEmpire.get(empireId).attackBonusFlat;
    // Feuerreichweitenbonus durch High Energy Focus (ROADMAP v0.18) einmal
    // pro Imperium ermittelt und an jede seiner Einheiten weitergereicht,
    // statt bei jeder Reichweitenprüfung erneut das Imperium nachzuschlagen.
    const rangeBonus = rangeBonusForEmpire(empire);
    const abilities = abilitiesByEmpire.get(empireId);
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
      const moveRange = abilities.teleports
        ? TELEPORTER_MOVE_RANGE
        : tacticalMoveRange(stats) + abilities.moveRangeBonus;
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
        hullEvasionBonus: stats.hullEvasionBonus + (empire.maneuverBonus ?? 0) + abilities.evasionBonus,
        attackRating,
        ecmDefense: empire.ecmDefense ?? 0,
        weapons: stats.weaponLines,
        rangeBonus,
        moveRange,
        col: homeCol,
        row: Math.min(GRID_ROWS - 1, startRow + idx),
        hasMoved: false,
        hasActed: false,
        // Spezialfähigkeiten (ROADMAP v0.19), siehe computeAbilities oben.
        hasOracle: abilities.hasOracle,
        hasNullifier: abilities.hasNullifier,
        hasRepulsor: abilities.hasRepulsor,
        regenFraction: abilities.regenFraction,
        missileDefenseChance: abilities.missileDefenseChance,
        splashDamage: abilities.splashDamage,
        dodgeChance: abilities.dodgeChance,
        specialDevice: abilities.specialDevice,
        usedSpecial: false,
        frozenRounds: 0,
      });
    });
  }

  if (isGuardianBattle) {
    units.push(buildMonsterUnit(GUARDIAN_STATS, "guardian"));
    startCounts[MONSTER_EMPIRE_ID] = 1;
  } else if (isSpaceMonsterBattle) {
    units.push(buildMonsterUnit(SPACE_MONSTER_STATS, "spacemonster"));
    startCounts[MONSTER_EMPIRE_ID] = 1;
  }

  if (!units.some((u) => u.empireId === playerEmpireId) || !units.some((u) => u.empireId === enemyEmpireId)) {
    return null;
  }

  return {
    systemId,
    empireIds,
    playerEmpireId,
    enemyEmpireId,
    isGuardianBattle,
    isSpaceMonsterBattle,
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
// Beam-Distanzabfall (ROADMAP v0.18): Direktfeuerwaffen verlieren an
// Wirkung, je weiter das Ziel entfernt ist (rangeDamageMultiplier),
// gelenkte Raketen/Torpedos treffen distanzunabhängig mit voller Stärke.
function killShipsInStack(battle, attacker, target, techName, n) {
  const kills = Math.min(n, target.count);
  target.shipHp.splice(0, kills);
  target.count -= kills;
  if (kills > 0) {
    battle.log.push(
      `Runde ${battle.round}: ${attacker.designName} (Imperium ${attacker.empireId}) zerstört ${kills}x ${target.designName} (Imperium ${target.empireId}) mit ${techName}.`
    );
  }
}

// Flächenschaden (ROADMAP v0.19, Energy/Ionic Pulsar): trifft nach einem
// erfolgreichen Treffer zusätzlich alle gegnerischen Einheiten in
// unmittelbarer Nachbarschaft des Ziels mit fixem Schaden (ignoriert
// Schilde – die Techtree-Beschreibung nennt reinen "Flächenschaden" ohne
// Schildbezug).
function applySplashDamage(battle, attacker, primaryTarget, amount) {
  const neighborKeys = new Set(neighborsOf(primaryTarget.col, primaryTarget.row).map((p) => key(p.col, p.row)));
  for (const u of battle.units) {
    if (u.count <= 0 || u.id === primaryTarget.id || u.empireId === attacker.empireId) continue;
    if (!neighborKeys.has(key(u.col, u.row))) continue;
    u.shipHp[0] -= amount;
    if (u.shipHp[0] <= 0) killShipsInStack(battle, attacker, u, "Flächenschaden", 1);
  }
}

// Repulsor Beam (ROADMAP v0.19): stößt das getroffene Ziel ein Feld weiter
// vom Angreifer weg, sofern ein freies Nachbarfeld in dieser Richtung
// existiert – rein positionelle Wirkung, kein zusätzlicher Schaden.
function applyRepulsorPush(battle, attacker, target) {
  const occupied = new Set(battle.units.filter((u) => u.count > 0 && u.id !== target.id).map((u) => key(u.col, u.row)));
  let best = null;
  let bestDist = hexDistance(attacker, target);
  for (const n of neighborsOf(target.col, target.row)) {
    if (!inBounds(n.col, n.row) || occupied.has(key(n.col, n.row))) continue;
    const d = hexDistance(attacker, n);
    if (d > bestDist) {
      bestDist = d;
      best = n;
    }
  }
  if (best) {
    target.col = best.col;
    target.row = best.row;
  }
}

// Löst einen Angriff auf (alle Waffen des Angreifers, deren Reichweite die
// aktuelle Distanz abdeckt) – dieselbe Treffer-/Schadenslogik pro Schuss wie
// js/combat.js runBattleRounds, nur auf Stack- statt Einzelschiff-Ebene:
// Schaden trifft immer das vorderste noch lebende Schiff des Ziel-Stacks.
// Beam-Distanzabfall (ROADMAP v0.18): Direktfeuerwaffen verlieren an
// Wirkung, je weiter das Ziel entfernt ist (rangeDamageMultiplier),
// gelenkte Raketen/Torpedos treffen distanzunabhängig mit voller Stärke.
// Spezialfähigkeiten (ROADMAP v0.19): Zyro/Lightning-Schild
// (missileDefenseChance) kann eine Rakete vor dem Einschlag zerstören,
// Displacement Device (dodgeChance) lässt jeden Treffer unabhängig von der
// Trefferchance verfehlen, Oracle Interface lässt Direktfeuerwaffen des
// Angreifers Schilde ignorieren, Technology Nullifier senkt bei Treffer den
// Angriffswert des Ziels dauerhaft, Repulsor/Flächenschaden wirken nach
// einem erfolgreichen Treffer.
function resolveAttack(battle, attacker, target, dist) {
  let anyHit = false;
  for (const line of attacker.weapons) {
    const tech = line.tech;
    const range = weaponRangeHexes(tech, attacker.rangeBonus);
    if (range < dist) continue;
    if (tech.module.everyOtherTurn && battle.round % 2 === 0) continue;

    const totalShots = (tech.module.shots ?? 1) * line.count * attacker.count;
    for (let s = 0; s < totalShots; s++) {
      if (target.count <= 0) break;

      if (tech.module.isMissile && target.missileDefenseChance > 0 && Math.random() < target.missileDefenseChance) {
        continue; // Zyro/Lightning Shield: Rakete vor Einschlag zerstört.
      }
      if (target.dodgeChance > 0 && Math.random() < target.dodgeChance) {
        continue; // Displacement Device: Angriff verfehlt automatisch.
      }

      const hit = tech.module.isMissile
        ? Math.random() < missileHitChance(target)
        : Math.random() < hitChance(attacker.attackRating, defenseRating(target));
      if (!hit) continue;

      let dmg = Math.round(rollDamage(tech, target.maxHp) * rangeDamageMultiplier(tech, dist, range));
      const bypassShields = tech.module.ignoresShields || (attacker.hasOracle && !tech.module.isMissile);
      if (!bypassShields) {
        let shield = target.shield;
        if (tech.module.shieldHalving) shield = Math.floor(shield / 2);
        dmg = Math.max(0, dmg - shield);
      }

      if (attacker.hasNullifier) {
        target.attackRating = Math.max(1, target.attackRating - (TECH_NULLIFIER_MIN + Math.floor(Math.random() * (TECH_NULLIFIER_MAX - TECH_NULLIFIER_MIN + 1))));
      }

      if (dmg <= 0) continue;
      anyHit = true;

      target.shipHp[0] -= dmg;
      if (target.shipHp[0] <= 0) {
        target.shipHp.shift();
        target.count -= 1;
        battle.log.push(
          `Runde ${battle.round}: ${attacker.designName} (Imperium ${attacker.empireId}) zerstört ${target.designName} (Imperium ${target.empireId}) mit ${tech.name}.`
        );
      }
      if (target.count > 0 && attacker.hasRepulsor) applyRepulsorPush(battle, attacker, target);
      if (target.count <= 0) break;
    }
    if (target.count <= 0) break;
  }
  // Flächenschaden (Energy/Ionic Pulsar) ist ein eigenständiges Gerät, das
  // einmal pro Angriffsaktion auslöst – nicht pro Einzelschuss, sonst wären
  // Mehrfachschuss-Waffen (Gatling Laser, Scatter Pack, ...) absurd stark.
  if (anyHit && attacker.splashDamage > 0) applySplashDamage(battle, attacker, target, attacker.splashDamage);
}

// Stasis Field / Black Hole Generator (ROADMAP v0.19): je Einheit einmal
// pro Gefecht auslösbares Sondergerät statt regulärem Waffenfeuer – wird
// automatisch beim ersten Angriff dieser Einheit statt der üblichen
// Waffenauflösung ausgelöst (*Vereinfacht*: keine eigene UI-Auswahl, ob es
// diesmal eingesetzt werden soll). Black Hole ersetzt Stasis Field, falls
// beide erforscht sind (siehe computeAbilities). Gibt true zurück, wenn der
// Angriff dadurch bereits vollständig abgehandelt wurde.
function maybeTriggerSpecialDevice(battle, attacker, target) {
  if (!attacker.specialDevice || attacker.usedSpecial) return false;
  attacker.usedSpecial = true;

  if (attacker.specialDevice === "stasis") {
    target.frozenRounds = Math.max(target.frozenRounds, 1);
    battle.log.push(
      `Runde ${battle.round}: ${attacker.designName} (Imperium ${attacker.empireId}) hält ${target.designName} (Imperium ${target.empireId}) mit einem Stasisfeld fest.`
    );
    return true;
  }

  // Black Hole Generator: zerstört 25-100% der Schiffe des Ziels und aller
  // gegnerischen Einheiten in Nachbarfeldern (Wirkungsbereich).
  const fraction = BLACK_HOLE_MIN_FRACTION + Math.random() * (BLACK_HOLE_MAX_FRACTION - BLACK_HOLE_MIN_FRACTION);
  const affected = [target, ...battle.units.filter((u) => {
    if (u.count <= 0 || u.id === target.id || u.empireId === attacker.empireId) return false;
    return hexDistance(target, u) <= 1;
  })];
  for (const u of affected) {
    killShipsInStack(battle, attacker, u, "Schwarzes-Loch-Generator", Math.ceil(u.count * fraction));
  }
  return true;
}

export function moveUnitTo(battle, unitId, col, row) {
  const unit = battle.units.find((u) => u.id === unitId);
  if (!unit || unit.hasMoved || unit.count <= 0) return { ok: false, reason: "Zug bereits verbraucht." };
  if (unit.frozenRounds > 0) return { ok: false, reason: "Von einem Stasisfeld festgehalten." };
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
  if (attacker.frozenRounds > 0) return { ok: false, reason: "Von einem Stasisfeld festgehalten." };
  if (attacker.empireId === target.empireId) return { ok: false, reason: "Kein gültiges Ziel." };
  const dist = hexDistance(attacker, target);
  if (!attacker.weapons.some((w) => weaponRangeHexes(w.tech, attacker.rangeBonus) >= dist)) {
    return { ok: false, reason: "Ziel außerhalb der Waffenreichweite." };
  }
  if (!maybeTriggerSpecialDevice(battle, attacker, target)) {
    resolveAttack(battle, attacker, target, dist);
  }
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

// Zielwahl der KI (ROADMAP v0.20): bevorzugt statt des reinen
// "nächstes Ziel"-Verhaltens aus v0.16 größere, näher am Sterben stehende
// und gefährlichere gegnerische Stacks – ohne den vollen Attraktivitäts-
// Apparat aus js/ai.js (der für die strategische Karte gilt, nicht das
// taktische Kampf-Grid). *Vereinfacht*: rein additive Gewichtung, keine
// Berücksichtigung der eigenen Restreichweite/-bewegung über diese Runde
// hinaus.
function scoreAiTarget(unit, target) {
  const dist = hexDistance(unit, target);
  const hpFrac = target.maxHp > 0 ? (target.shipHp[0] ?? 0) / target.maxHp : 1;
  const threat = (target.attackRating ?? 0) * target.count;
  return target.count * 3 - dist * 1.5 - hpFrac * 2 + threat * 0.05;
}

function pickAiTarget(unit, enemies) {
  let best = null;
  let bestScore = -Infinity;
  for (const e of enemies) {
    const score = scoreAiTarget(unit, e);
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return best;
}

// Entscheidet, ob die KI ihr einmal-pro-Gefecht-Sondergerät (Stasis Field/
// Black Hole Generator) JETZT auf `target` einsetzen soll, statt es
// automatisch beim erstbesten Angriffsziel zu verbrauchen (v0.16-Verhalten)
// – Black Hole nur, wenn genug gegnerische Schiffe im Wirkungsbereich
// stehen, um den Einsatz zu lohnen; Stasis Field nur gegen die aktuell
// gefährlichste gegnerische Einheit (höchstes Angriffswert×Stückzahl) und
// nur, solange sie nicht ohnehin gleich fallen würde.
function aiShouldUseSpecialDevice(battle, unit, target) {
  if (!unit.specialDevice || unit.usedSpecial) return false;

  if (unit.specialDevice === "blackHole") {
    const neighborShips = battle.units
      .filter((u) => u.count > 0 && u.id !== target.id && u.empireId !== unit.empireId && hexDistance(target, u) <= 1)
      .reduce((sum, u) => sum + u.count, 0);
    return target.count + neighborShips >= 2;
  }

  // Stasis Field
  const hpFrac = target.maxHp > 0 ? (target.shipHp[0] ?? 0) / target.maxHp : 1;
  if (hpFrac <= 0.3) return false; // stirbt vermutlich ohnehin gleich – Gerät aufsparen
  const enemies = battle.units.filter((u) => u.count > 0 && u.empireId === target.empireId);
  const mostThreatening = enemies.reduce(
    (best, u) => ((u.attackRating ?? 0) * u.count > (best ? (best.attackRating ?? 0) * best.count : -1) ? u : best),
    null
  );
  return mostThreatening?.id === target.id;
}

// KI-Phase (ROADMAP v0.16, Zielwahl/Sondergeräte verfeinert in v0.20):
// jede Einheit wählt ihr Ziel per scoreAiTarget, bewegt sich bei Bedarf
// heran und feuert (bzw. setzt ihr Sondergerät ein), sobald es in
// Reichweite ist.
function runAiPhase(battle) {
  const aiUnits = battle.units.filter((u) => u.empireId === battle.enemyEmpireId && u.count > 0);
  for (const unit of aiUnits) {
    if (battle.finished || unit.count <= 0 || unit.frozenRounds > 0) continue;
    const enemies = battle.units.filter((u) => u.empireId === battle.playerEmpireId && u.count > 0);
    if (enemies.length === 0) break;

    const target = pickAiTarget(unit, enemies);
    let dist = hexDistance(unit, target);

    const maxRange = Math.max(0, ...unit.weapons.map((w) => weaponRangeHexes(w.tech, unit.rangeBonus)));
    if (dist > maxRange) {
      moveTowards(battle, unit, target);
      dist = hexDistance(unit, target);
    }
    if (dist <= maxRange) {
      if (aiShouldUseSpecialDevice(battle, unit, target) && maybeTriggerSpecialDevice(battle, unit, target)) {
        // Sondergerät ausgelöst, kein reguläres Waffenfeuer diese Runde.
      } else {
        resolveAttack(battle, unit, target, dist);
      }
    }
  }
}

// Beendet die Spielerphase: KI zieht/feuert, danach beginnt (sofern das
// Gefecht nicht bereits entschieden ist) die nächste Runde mit
// zurückgesetzten Zug-/Angriffsmarkierungen. Advanced Damage Control
// (ROADMAP v0.19) heilt hier alle Schiffe mit dieser Technologie, und
// eingefrorene Stasisfeld-Ziele zählen eine Runde herunter.
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
    if (u.frozenRounds > 0) u.frozenRounds -= 1;
    if (u.regenFraction > 0 && u.count > 0) {
      for (let i = 0; i < u.shipHp.length; i++) {
        u.shipHp[i] = Math.min(u.maxHp, u.shipHp[i] + Math.round(u.maxHp * u.regenFraction));
      }
    }
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
