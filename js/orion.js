// Orion-System & Guardian (ROADMAP v0.10), siehe design-analyse.docx ("Das
// Orion-System, Wächter und Endgame-Bedrohungen"). Orion ist eine
// Ultra-Rich-Artefaktwelt, bewacht vom Guardian of Orion, bis dieser
// besiegt wird. *Vereinfacht:* genau ein Guardian-Kampf pro Runde (keine
// mehrstufige Belagerung mit persistentem Schaden über Runden hinweg –
// jeder Angriff startet bei voller Guardian-HP; endet ein Gefecht nach
// MAX_ROUNDS ohne Entscheidung, gilt es als abgewehrter Angriff ohne
// dauerhaften Schaden).
import { DISCIPLINES } from "./data/disciplines.js";
import { GUARDIAN_STATS, DEATH_RAY_TECH_ID } from "./data/orionGuardian.js";
import { resolveGuardianBattle, GUARDIAN_EMPIRE_ID } from "./combat.js";

// "Vier zufällige Advanced Technologies" aus dem Original werden hier als
// pauschaler Miniaturisierungs-Sprung über alle Disziplinen abstrahiert, da
// dieses Remake keine diskreten Advanced-Technologies-Level 51-99 modelliert
// (siehe js/shipDesign.js miniaturizationFactor, ROADMAP v0.3/v0.10).
const GUARDIAN_VICTORY_MINIATURIZATION_BONUS = 15;

export function designateOrionSystem(rng, systems) {
  const candidates = systems.filter((s) => !s.isHomeworld && s.planets.length > 0);
  const pool = candidates.length > 0 ? candidates : systems.filter((s) => s.planets.length > 0);
  if (pool.length === 0) return null;

  const system = pool[Math.floor(rng() * pool.length)];
  const planet = system.planets[0];
  planet.environment = "artifact";
  planet.richness = "ultra_rich";
  planet.size = "huge";
  planet.colonizedBy = null;
  planet.isOrion = true;
  system.isOrionSystem = true;
  return system.id;
}

export function initOrion(galaxy, rng) {
  const systemId = designateOrionSystem(rng, galaxy.systems);
  galaxy.orion = { systemId, guardianAlive: systemId !== null };
}

export function isOrionGuarded(galaxy, systemId) {
  return galaxy.orion?.guardianAlive === true && galaxy.orion.systemId === systemId;
}

function pickRewardWinnerId(result, empireIds) {
  let best = null;
  let bestCount = -1;
  for (const id of empireIds) {
    const count = (result.survivorsByEmpire.get(id) ?? []).reduce((sum, x) => sum + x.count, 0);
    if (count > bestCount) {
      bestCount = count;
      best = id;
    }
  }
  return best;
}

function applyGuardianVictoryRewards(galaxy, result, empireIds) {
  const winnerId = pickRewardWinnerId(result, empireIds);
  const empire = galaxy.empires.find((e) => e.id === winnerId);
  if (!empire) return null;

  if (!empire.research.completedTechs.includes(DEATH_RAY_TECH_ID)) {
    empire.research.completedTechs.push(DEATH_RAY_TECH_ID);
  }
  for (const d of DISCIPLINES) {
    empire.research.effectiveTechLevel[d.id] =
      (empire.research.effectiveTechLevel[d.id] ?? 0) + GUARDIAN_VICTORY_MINIATURIZATION_BONUS;
  }
  return winnerId;
}

// Löst — sofern der Guardian noch lebt und an seinem System stationäre
// (nicht mehr reisende) Flotten stehen — ein Gefecht gegen ALLE dort
// anwesenden Imperien gemeinsam aus (siehe js/combat.js resolveGuardianBattle).
// Wird nach der regulären Kampfauflösung in js/economy.js simulateTurn
// aufgerufen.
export function resolveOrionGuardianCombat(galaxy) {
  if (!galaxy.orion?.guardianAlive) return null;
  const systemId = galaxy.orion.systemId;
  const fleetsHere = galaxy.fleets.filter((f) => f.systemId === systemId && !f.destinationSystemId);
  if (fleetsHere.length === 0) return null;

  const result = resolveGuardianBattle(fleetsHere, galaxy.empires, GUARDIAN_STATS);
  if (!result) return null;

  const empireIds = result.empireIds.filter((id) => id !== GUARDIAN_EMPIRE_ID);

  galaxy.fleets = galaxy.fleets.filter((f) => !(f.systemId === systemId && !f.destinationSystemId));
  for (const empireId of empireIds) {
    const stacks = result.survivorsByEmpire.get(empireId) ?? [];
    if (stacks.length === 0) continue;
    galaxy.fleets.push({
      id: `fleet-${galaxy.nextFleetId++}`,
      ownerEmpireId: empireId,
      systemId,
      destinationSystemId: null,
      stacks,
    });
  }

  let rewardWinnerId = null;
  if (result.guardianDefeated) {
    galaxy.orion.guardianAlive = false;
    rewardWinnerId = applyGuardianVictoryRewards(galaxy, result, empireIds);
    // Für den Highscore (ROADMAP v0.11): +100 Punkte für die Zerstörung des
    // Guardian, siehe js/victory.js computeScore.
    galaxy.orion.defeatedByEmpireId = rewardWinnerId;
  }

  return { ...result, systemId, empireIds, isGuardianBattle: true, monsterName: GUARDIAN_STATS.name, rewardWinnerId };
}
