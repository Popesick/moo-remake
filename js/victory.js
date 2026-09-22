import { DISCIPLINES } from "./data/disciplines.js";

// Sieg durch Elimination oder Punktzahl-Vergleich am Rundenlimit, siehe
// ROADMAP ("Prototyp erreicht") und design-analyse.docx ("Berechnung des
// finalen Highscores"). Basiswert pro Spieler nach Galaxiegröße (100 Small
// ... 160 Huge, siehe Dokument); die "+50 pro eliminierter Fraktion" und
// "+100 für Guardian" Boni aus dem Original sind hier nicht enthalten, da
// weder Kill-Zuordnung noch das Orion-System im Prototyp existieren
// (siehe ROADMAP v0.9/v0.10).
export const TURN_LIMIT = 150;

const BASE_POINTS_PER_PLAYER = { small: 100, medium: 120, large: 140, huge: 160 };

export function computeScore(galaxy, empire) {
  const base = (BASE_POINTS_PER_PLAYER[galaxy.sizeId] ?? 120) * galaxy.empireCount;
  const colonists = galaxy.systems
    .flatMap((s) => s.planets)
    .filter((p) => p.colonizedBy === empire.id)
    .reduce((sum, p) => sum + p.population, 0);
  const techLevels = DISCIPLINES.reduce((sum, d) => sum + (empire.research.techLevel[d.id] ?? 0), 0);
  return Math.round(base - galaxy.turn + colonists + techLevels * 3);
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
