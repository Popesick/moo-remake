import { DISCIPLINES } from "./data/disciplines.js";

// Sieg durch Elimination oder Punktzahl-Vergleich am Rundenlimit, siehe
// ROADMAP ("Prototyp erreicht") und design-analyse.docx ("Berechnung des
// finalen Highscores"). Basiswert pro Spieler nach Galaxiegröße (100 Small
// ... 160 Huge, siehe Dokument).
export const TURN_LIMIT = 150;
export const ELIMINATION_KILL_BONUS = 50;
export const GUARDIAN_KILL_BONUS = 100;

const BASE_POINTS_PER_PLAYER = { small: 100, medium: 120, large: 140, huge: 160 };

// Kill-Zuordnung (ROADMAP v0.11): +50 Punkte pro eliminierter Konkurrenz-
// Fraktion, deren Elimination diesem Imperium zuzuordnen ist (siehe
// galaxy.eliminationCredits, gefüllt in checkGameEnd über
// galaxy.lastDamagedBy aus js/economy.js resolveAllCombats bzw.
// js/invasion.js applyInvasionResult/applyBioAttack), sowie +100 Punkte für
// die Zerstörung des Guardian of Orion (siehe js/orion.js). *Vereinfacht:*
// eine Elimination wird stets dem letzten Angreifer zugeschrieben, der die
// Verluste dieses Imperiums (Flottengefecht, Invasion oder Bioangriff)
// verursacht hat – keine anteilige Zuordnung bei mehreren Beteiligten.
export function computeScore(galaxy, empire) {
  const base = (BASE_POINTS_PER_PLAYER[galaxy.sizeId] ?? 120) * galaxy.empireCount;
  const colonists = galaxy.systems
    .flatMap((s) => s.planets)
    .filter((p) => p.colonizedBy === empire.id)
    .reduce((sum, p) => sum + p.population, 0);
  const techLevels = DISCIPLINES.reduce((sum, d) => sum + (empire.research.techLevel[d.id] ?? 0), 0);
  const killCount = killCountFor(galaxy, empire.id);
  const guardianBonus = galaxy.orion?.defeatedByEmpireId === empire.id ? GUARDIAN_KILL_BONUS : 0;
  return Math.round(base - galaxy.turn + colonists + techLevels * 3 + killCount * ELIMINATION_KILL_BONUS + guardianBonus);
}

export function killCountFor(galaxy, empireId) {
  return Object.values(galaxy.eliminationCredits ?? {}).filter((killerId) => killerId === empireId).length;
}

function isEliminated(galaxy, empireId) {
  const hasPlanet = galaxy.systems.some((s) => s.planets.some((p) => p.colonizedBy === empireId));
  const hasFleet = galaxy.fleets.some((f) => f.ownerEmpireId === empireId);
  return !hasPlanet && !hasFleet;
}

// Aktualisiert galaxy.empires[].eliminated und liefert einen Spielende-
// Status, sobald nur noch ein Imperium übrig ist oder das Rundenlimit
// erreicht wurde. Wird einmalig über galaxy.gameEndAnnounced quittiert.
export function checkGameEnd(galaxy) {
  for (const empire of galaxy.empires) {
    if (!empire.eliminated && isEliminated(galaxy, empire.id)) {
      empire.eliminated = true;
      const killerId = galaxy.lastDamagedBy?.[empire.id];
      if (killerId !== undefined && killerId !== null && killerId !== empire.id) {
        galaxy.eliminationCredits = galaxy.eliminationCredits ?? {};
        galaxy.eliminationCredits[empire.id] = killerId;
      }
    }
  }

  const survivors = galaxy.empires.filter((e) => !e.eliminated);
  if (galaxy.gameEndAnnounced) return null;

  let reason = null;
  if (survivors.length <= 1) {
    reason = "elimination";
  } else if (galaxy.turn > TURN_LIMIT) {
    reason = "turnLimit";
  }
  if (!reason) return null;

  const scores = galaxy.empires.map((e) => ({ empireId: e.id, score: e.eliminated ? -Infinity : computeScore(galaxy, e) }));
  scores.sort((a, b) => b.score - a.score);
  galaxy.gameEndAnnounced = true;

  return { reason, winnerEmpireId: scores[0]?.empireId ?? null, scores };
}
