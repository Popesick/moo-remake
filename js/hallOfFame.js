// Hall of Fame (ROADMAP v0.11), siehe design-analyse.docx ("Am Ende einer
// Partie wird die imperiale Leistung in einer numerischen Punktzahl (Score)
// aggregiert, die in die Hall of Fame eingetragen wird"). Persistiert die
// Siegerimperien vergangener Partien lokal im Browser (localStorage),
// unabhängig vom laufenden Spielstand.
const STORAGE_KEY = "moo-remake:halloffame";
const MAX_ENTRIES = 20;

export function loadHallOfFame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const entries = raw ? JSON.parse(raw) : [];
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

export function recordHallOfFameEntry(galaxy, gameEnd) {
  const winner = galaxy.empires.find((e) => e.id === gameEnd.winnerEmpireId);
  if (!winner) return;
  const score = gameEnd.scores.find((s) => s.empireId === winner.id)?.score ?? 0;

  const entry = {
    date: Date.now(),
    seed: galaxy.seed,
    sizeId: galaxy.sizeId,
    empireCount: galaxy.empireCount,
    raceId: winner.raceId,
    isPlayer: winner.isPlayer === true,
    score,
    reason: gameEnd.reason,
    turn: (galaxy.turn ?? 1) - 1,
  };

  const entries = loadHallOfFame();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  entries.length = Math.min(entries.length, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
