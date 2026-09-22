import { computeDesignStats } from "./shipDesign.js";

const MAX_ROUNDS = 30;
// Sigmoid-Trefferformel aus design-analyse.docx: bei Attack=Defense 50%,
// bei Differenz ±30 ca. 21%/79%. k so gewählt, dass diese Eckwerte passen.
const HIT_CURVE_K = 0.044;
// Basis-Angriffswert vor Battle-Computer-Boni ist in keiner Analyse
// beziffert; 10 ist ein neutraler Platzhalter (Battle Computer Mark I-XI
// addieren +1 bis +11 gemäß techtree-analyse.docx).
const BASE_ATTACK_RATING = 10;
const MISSILE_BASE_HIT_CHANCE = 0.95;
const MISSILE_ECM_REDUCTION_PER_POINT = 0.05; // ECM Jammer Mark N: -N*5%, siehe techtree-analyse.docx

// Verteidigungswert = Kampfgeschwindigkeit × 5 (Antriebstech) + fester
// Rumpf-Ausweichbonus (Small +2, Medium +1), siehe docs/shipklassen-analyse.docx.
function defenseRating(unit) {
  return unit.speed * 5 + unit.hullEvasionBonus;
}

function missileHitChance(target) {
  return Math.max(0.1, MISSILE_BASE_HIT_CHANCE - target.ecmDefense * MISSILE_ECM_REDUCTION_PER_POINT);
}

function hitChance(attack, defense) {
  const diff = attack - defense;
  return 1 / (1 + Math.exp(-HIT_CURVE_K * diff));
}

function rollDamage(weaponTech, targetMaxHp) {
  const m = weaponTech.module;
  if (m.percentTargetHP) return Math.round(targetMaxHp * m.percentTargetHP);
  if (m.dmgMin === m.dmgMax) return m.dmgMin;
  return m.dmgMin + Math.floor(Math.random() * (m.dmgMax - m.dmgMin + 1));
}

function buildUnits(fleets, empireId, empire) {
  const shipDesigns = empire?.shipDesigns ?? [];
  const attackRating = BASE_ATTACK_RATING + (empire?.attackBonus ?? 0);
  const ecmDefense = empire?.ecmDefense ?? 0;
  const units = [];
  let uid = 0;
  for (const fleet of fleets) {
    for (const stack of fleet.stacks) {
      const design = shipDesigns.find((d) => d.id === stack.designId);
      if (!design) continue;
      const stats = computeDesignStats(design);
      for (let i = 0; i < stack.count; i++) {
        units.push({
          id: `${empireId}-${uid++}`,
          empireId,
          designId: stack.designId,
          designName: design.name,
          hp: stats.hp,
          maxHp: stats.hp,
          shield: stats.shieldAbsorption,
          speed: stats.speed,
          hullEvasionBonus: stats.hullEvasionBonus + (empire?.maneuverBonus ?? 0), // Alkari: +3 Manövrierfähigkeit
          attackRating,
          ecmDefense,
          weapons: stats.weaponLines,
        });
      }
    }
  }
  return units;
}

// Löst ein automatisches Gefecht zwischen allen an einem System stationierten
// Flotten unterschiedlicher Imperien auf (siehe design-analyse.docx,
// mathematische Auflösung des taktischen Raumkampfes). Kein interaktives
// Grid – Positionierung/Reichweite sind für den Prototyp vereinfacht auf
// einen abstrakten Nahbereich ohne Beam-Distanzabfall.
export function resolveSystemCombat(fleetsAtSystem, empires) {
  const empireIds = [...new Set(fleetsAtSystem.map((f) => f.ownerEmpireId))];
  if (empireIds.length < 2) return null;

  let units = [];
  for (const empireId of empireIds) {
    const empire = empires.find((e) => e.id === empireId);
    const fleets = fleetsAtSystem.filter((f) => f.ownerEmpireId === empireId);
    units = units.concat(buildUnits(fleets, empireId, empire));
  }

  const log = [];
  let round = 1;
  while (round <= MAX_ROUNDS) {
    const remainingEmpires = new Set(units.filter((u) => u.hp > 0).map((u) => u.empireId));
    if (remainingEmpires.size < 2) break;

    const order = units.filter((u) => u.hp > 0).sort((a, b) => b.speed - a.speed);
    for (const attacker of order) {
      if (attacker.hp <= 0) continue;
      for (const line of attacker.weapons) {
        const tech = line.tech;
        if (tech.module.everyOtherTurn && round % 2 === 0) continue;
        const shots = (tech.module.shots ?? 1) * line.count;
        for (let s = 0; s < shots; s++) {
          const enemies = units.filter((u) => u.hp > 0 && u.empireId !== attacker.empireId);
          if (enemies.length === 0) break;
          const target = enemies[Math.floor(Math.random() * enemies.length)];

          let hit;
          if (tech.module.isMissile) {
            hit = Math.random() < missileHitChance(target);
          } else {
            hit = Math.random() < hitChance(attacker.attackRating, defenseRating(target));
          }
          if (!hit) continue;

          let dmg = rollDamage(tech, target.maxHp);
          if (tech.module.ignoresShields) {
            // Schild wird ignoriert.
          } else {
            let shield = target.shield;
            if (tech.module.shieldHalving) shield = Math.floor(shield / 2);
            dmg = Math.max(0, dmg - shield);
          }
          if (dmg <= 0) continue;

          target.hp -= dmg;
          if (target.hp <= 0 && log.length < 200) {
            log.push(`Runde ${round}: ${attacker.designName} (Imperium ${attacker.empireId}) zerstört ${target.designName} (Imperium ${target.empireId}) mit ${tech.name}.`);
          }
        }
      }
    }
    round += 1;
  }

  const survivorEmpires = new Set(units.filter((u) => u.hp > 0).map((u) => u.empireId));
  const winnerEmpireId = survivorEmpires.size === 1 ? [...survivorEmpires][0] : null;

  const survivorsByEmpire = new Map();
  for (const empireId of empireIds) {
    const alive = units.filter((u) => u.empireId === empireId && u.hp > 0);
    const stacks = new Map();
    for (const u of alive) stacks.set(u.designId, (stacks.get(u.designId) ?? 0) + 1);
    survivorsByEmpire.set(empireId, [...stacks.entries()].map(([designId, count]) => ({ designId, count })));
  }

  return {
    empireIds,
    winnerEmpireId,
    rounds: round - 1,
    log,
    survivorsByEmpire,
    shipsLostByEmpire: Object.fromEntries(
      empireIds.map((id) => [
        id,
        units.filter((u) => u.empireId === id).length - (survivorsByEmpire.get(id)?.reduce((s, x) => s + x.count, 0) ?? 0),
      ])
    ),
  };
}
