// Galaktischer Rat (ROADMAP v0.9), siehe design-analyse.docx ("Der
// Galaktische Rat (High Council) und das Soft-Enrage"). Sobald 2/3 aller
// Planeten der Galaxie kolonisiert sind, tritt der Rat fortan in festen
// Intervallen zusammen. Die beiden Imperien mit der höchsten
// Gesamtbevölkerung sind Kandidaten; alle übrigen Imperien stimmen
// bevölkerungsgewichtet ab. Erreicht ein Kandidat 2/3 der Stimmen, gewinnt
// er die Partie durch diplomatische Vereinigung – lehnt der Spieler die Wahl
// eines KI-Kandidaten ab, erklären ihm stattdessen alle übrigen Imperien
// simultan den Krieg ("Final War", ein Soft-Enrage-Timer fürs Endgame).
import { isAtWar, setRelationStatus } from "./diplomacy.js";
import { makeRng, hashSeed } from "./rng.js";
import {
  COUNCIL_POPULATION_THRESHOLD_RATIO,
  COUNCIL_INTERVAL_TURNS,
  COUNCIL_MAJORITY_RATIO,
} from "./data/diplomacyOptions.js";

function totalPlanetCount(galaxy) {
  return galaxy.systems.reduce((sum, s) => sum + s.planets.length, 0);
}

function colonizedPlanetCount(galaxy) {
  return galaxy.systems.reduce(
    (sum, s) => sum + s.planets.filter((p) => p.colonizedBy !== null && p.colonizedBy !== undefined).length,
    0
  );
}

export function empirePopulation(galaxy, empireId) {
  return galaxy.systems
    .flatMap((s) => s.planets)
    .filter((p) => p.colonizedBy === empireId)
    .reduce((sum, p) => sum + p.population, 0);
}

// Aktiviert den Rat einmalig, sobald der Kolonisierungsgrad die
// Zweidrittelschwelle überschreitet, und setzt danach feste
// Abstimmungsintervalle (siehe COUNCIL_INTERVAL_TURNS).
export function checkCouncilActivation(galaxy) {
  if (!galaxy.council) galaxy.council = { active: false, nextVoteTurn: null };
  if (galaxy.council.active) return;
  const total = totalPlanetCount(galaxy);
  if (total === 0) return;
  if (colonizedPlanetCount(galaxy) / total >= COUNCIL_POPULATION_THRESHOLD_RATIO) {
    galaxy.council.active = true;
    galaxy.council.nextVoteTurn = galaxy.turn + COUNCIL_INTERVAL_TURNS;
  }
}

// Prüft, ob in dieser Runde eine Ratssitzung fällig ist, und liefert bei
// Bedarf die beiden Kandidaten sowie die bereits ausgezählten KI-Stimmen
// (bevölkerungsgewichtet). Ändert nichts an galaxy.council.nextVoteTurn –
// das übernimmt erst resolveCouncilVote(), da der Spieler zwingend zuerst
// gefragt werden muss, ob er einen KI-Sieg akzeptiert.
export function checkCouncilVoteDue(galaxy) {
  if (!galaxy.council?.active) return null;
  if (galaxy.turn < galaxy.council.nextVoteTurn) return null;

  const survivors = galaxy.empires.filter((e) => !e.eliminated);
  if (survivors.length < 2) return null;

  const ranked = [...survivors].sort((a, b) => empirePopulation(galaxy, b.id) - empirePopulation(galaxy, a.id));
  const candidates = [ranked[0], ranked[1]];
  const candidateIds = new Set(candidates.map((c) => c.id));

  const rng = makeRng(hashSeed(`${galaxy.seed}:council:${galaxy.turn}`));
  const tally = {
    [candidates[0].id]: empirePopulation(galaxy, candidates[0].id),
    [candidates[1].id]: empirePopulation(galaxy, candidates[1].id),
  };

  for (const empire of survivors) {
    if (candidateIds.has(empire.id) || empire.isPlayer) continue;
    const atWar0 = isAtWar(galaxy, empire.id, candidates[0].id);
    const atWar1 = isAtWar(galaxy, empire.id, candidates[1].id);
    let votesFor;
    if (atWar0 && !atWar1) votesFor = candidates[1].id;
    else if (atWar1 && !atWar0) votesFor = candidates[0].id;
    else votesFor = rng() < 0.5 ? candidates[0].id : candidates[1].id;
    tally[votesFor] += empirePopulation(galaxy, empire.id);
  }

  const totalPopulation = survivors.reduce((sum, e) => sum + empirePopulation(galaxy, e.id), 0);
  const player = galaxy.empires.find((e) => e.isPlayer);
  const playerIsCandidate = candidateIds.has(player?.id);

  return { candidates, tally, totalPopulation, playerIsCandidate };
}

// Schließt eine Ratssitzung ab. playerVoteEmpireId ist die vom Spieler
// gewählte Kandidaten-Id (oder null, wenn der Spieler selbst Kandidat ist
// und daher nicht separat abstimmt). Ergebnisse: "none" (keine Mehrheit),
// "playerVictory" (Diplomatie-Sieg), "aiVictory" (Spieler akzeptiert die
// KI-Wahl, Partie endet als KI-Sieg) oder "finalWar" (Spieler lehnt ab,
// alle übrigen Imperien erklären ihm den Krieg).
export function resolveCouncilVote(galaxy, voteResult, playerVoteEmpireId) {
  const { candidates, totalPopulation, playerIsCandidate } = voteResult;
  const tally = { ...voteResult.tally };
  const player = galaxy.empires.find((e) => e.isPlayer);

  if (!playerIsCandidate && playerVoteEmpireId != null && tally[playerVoteEmpireId] != null) {
    tally[playerVoteEmpireId] += empirePopulation(galaxy, player.id);
  }

  galaxy.council.nextVoteTurn = galaxy.turn + COUNCIL_INTERVAL_TURNS;

  const requiredVotes = totalPopulation * COUNCIL_MAJORITY_RATIO;
  const winner = candidates.find((c) => tally[c.id] >= requiredVotes);
  if (!winner) return { outcome: "none", candidates, tally, totalPopulation };

  if (winner.id === player.id) {
    return { outcome: "playerVictory", winner, candidates, tally, totalPopulation };
  }

  const playerAccepted = playerIsCandidate || playerVoteEmpireId === winner.id;
  if (playerAccepted) {
    return { outcome: "aiVictory", winner, candidates, tally, totalPopulation };
  }

  for (const empire of galaxy.empires) {
    if (empire.isPlayer || empire.eliminated) continue;
    setRelationStatus(galaxy, player.id, empire.id, "war");
  }
  return { outcome: "finalWar", winner, candidates, tally, totalPopulation };
}
