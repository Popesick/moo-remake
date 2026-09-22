import { makeRng, hashSeed, randomSeed, pick, pickWeighted, randInt } from "./rng.js";
import { STAR_TYPE_WEIGHTS } from "./data/starTypes.js";
import { ENVIRONMENT_WEIGHTS, getEnvironment } from "./data/environments.js";
import { RICHNESS_WEIGHTS } from "./data/richness.js";
import { PLANET_SIZE_WEIGHTS } from "./data/planetSizes.js";
import { RACES } from "./data/races.js";
import { initEmpireEconomy, initColony } from "./economy.js";

export const GALAXY_SIZES = {
  small: { label: "Klein (Small)", systems: 24, width: 2200, height: 1500 },
  medium: { label: "Mittel (Medium)", systems: 40, width: 2800, height: 1900 },
  large: { label: "Groß (Large)", systems: 60, width: 3400, height: 2300 },
  huge: { label: "Riesig (Huge)", systems: 85, width: 4000, height: 2700 },
};

// Anzahl Planeten pro System: die meisten Systeme haben 2-4 Planeten, wenige
// sind leer oder randvoll (1-8 laut Analyse-Dokument).
const PLANET_COUNT_WEIGHTS = [
  { value: 0, weight: 6 },
  { value: 1, weight: 12 },
  { value: 2, weight: 18 },
  { value: 3, weight: 20 },
  { value: 4, weight: 18 },
  { value: 5, weight: 12 },
  { value: 6, weight: 8 },
  { value: 7, weight: 4 },
  { value: 8, weight: 2 },
];

const SYSTEM_NAME_SYLLABLES = [
  "An", "Bel", "Cor", "Dra", "El", "Fen", "Gor", "Hel", "Il", "Jor",
  "Kal", "Lor", "Mir", "Nyx", "Or", "Pyr", "Quen", "Rho", "Syl", "Tor",
  "Ul", "Vex", "Wyn", "Xer", "Yl", "Zor",
];

function generateSystemName(rng) {
  const parts = randInt(rng, 2, 3);
  let name = "";
  for (let i = 0; i < parts; i++) {
    name += pick(rng, SYSTEM_NAME_SYLLABLES).toLowerCase();
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function minDistance(pos, others, minDist) {
  for (const o of others) {
    const dx = pos.x - o.x;
    const dy = pos.y - o.y;
    if (Math.sqrt(dx * dx + dy * dy) < minDist) return false;
  }
  return true;
}

function generatePlanet(rng, index) {
  const envId = pickWeighted(rng, ENVIRONMENT_WEIGHTS.map((e) => ({ value: e.id, weight: e.weight })));
  const sizeId = pickWeighted(rng, PLANET_SIZE_WEIGHTS.map((s) => ({ value: s.id, weight: s.weight })));
  const richnessId = pickWeighted(rng, RICHNESS_WEIGHTS.map((r) => ({ value: r.id, weight: r.weight })));
  return {
    id: `planet-${index}`,
    name: String.fromCharCode(65 + index), // A, B, C, ...
    environment: envId,
    size: sizeId,
    richness: richnessId,
    colonizedBy: null,
  };
}

function generateSystem(rng, id, bounds) {
  const starType = pickWeighted(rng, STAR_TYPE_WEIGHTS.map((s) => ({ value: s.id, weight: s.weight })));
  const planetCount = pickWeighted(rng, PLANET_COUNT_WEIGHTS);
  const planets = [];
  for (let i = 0; i < planetCount; i++) {
    planets.push(generatePlanet(rng, i));
  }
  return {
    id,
    name: generateSystemName(rng),
    star: starType,
    x: 0,
    y: 0,
    planets,
    ownerEmpireId: null,
  };
}

export function generateGalaxy({ sizeId = "medium", empireCount = 3, seed, difficultyId = "normal" } = {}) {
  const sizeCfg = GALAXY_SIZES[sizeId] ?? GALAXY_SIZES.medium;
  const numericSeed = seed === undefined || seed === null || seed === ""
    ? randomSeed()
    : (typeof seed === "number" ? seed >>> 0 : hashSeed(String(seed)));
  const rng = makeRng(numericSeed);

  const margin = 120;
  const minDist = Math.max(60, Math.sqrt((sizeCfg.width * sizeCfg.height) / sizeCfg.systems) * 0.45);
  const positions = [];
  const maxAttemptsPerSystem = 60;

  for (let i = 0; i < sizeCfg.systems; i++) {
    let placed = null;
    for (let attempt = 0; attempt < maxAttemptsPerSystem; attempt++) {
      const candidate = {
        x: margin + rng() * (sizeCfg.width - margin * 2),
        y: margin + rng() * (sizeCfg.height - margin * 2),
      };
      if (minDistance(candidate, positions, minDist)) {
        placed = candidate;
        break;
      }
    }
    if (!placed) {
      placed = {
        x: margin + rng() * (sizeCfg.width - margin * 2),
        y: margin + rng() * (sizeCfg.height - margin * 2),
      };
    }
    positions.push(placed);
  }

  const systems = positions.map((pos, i) => {
    const system = generateSystem(rng, `sys-${i}`, sizeCfg);
    system.x = pos.x;
    system.y = pos.y;
    return system;
  });

  const empires = generateEmpires(rng, empireCount, numericSeed, difficultyId);
  assignHomeworlds(rng, systems, empires);

  return {
    seed: numericSeed,
    sizeId,
    difficultyId,
    width: sizeCfg.width,
    height: sizeCfg.height,
    empireCount,
    empires,
    turn: 1,
    systems,
    fleets: [],
    nextFleetId: 1,
    createdAt: Date.now(),
  };
}

// Empire 0 ist immer der Spieler und spielt die Menschen; die KI-Imperien
// (aktiv erst ab v0.6) erhalten eine zufällige Auswahl der übrigen
// Fraktionen ohne Wiederholung.
function generateEmpires(rng, empireCount, seed, difficultyId) {
  const aiRaces = RACES.filter((r) => r.id !== "human");
  for (let i = aiRaces.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [aiRaces[i], aiRaces[j]] = [aiRaces[j], aiRaces[i]];
  }

  const empires = [];
  for (let e = 0; e < empireCount; e++) {
    const race = e === 0 ? RACES[0] : aiRaces[(e - 1) % aiRaces.length];
    empires.push(
      initEmpireEconomy(
        {
          id: e,
          name: race.name,
          raceId: race.id,
          color: race.color,
          isPlayer: e === 0,
        },
        seed,
        difficultyId
      )
    );
  }
  return empires;
}

// Wählt für jedes Imperium ein Startsystem mit garantiert kolonisierbarer
// Terranisch/Ozean- oder Gaia-Heimatwelt und ausreichendem Abstand zu den
// anderen Startsystemen (nur Platzierung – Wirtschaft folgt in v0.2).
function assignHomeworlds(rng, systems, empires) {
  const empireCount = empires.length;
  const candidates = systems.filter((s) =>
    s.planets.some((p) => p.environment === "terran" || p.environment === "gaia")
  );
  const pool = candidates.length >= empireCount ? candidates : systems;
  const chosen = [];
  const minSeparation = Math.min(500, Math.sqrt(pool.length) * 60);

  let remaining = [...pool];
  for (let e = 0; e < empireCount && remaining.length > 0; e++) {
    let idx = 0;
    if (chosen.length > 0) {
      let best = -1;
      let bestDist = -1;
      remaining.forEach((s, i) => {
        const d = Math.min(...chosen.map((c) => Math.hypot(c.x - s.x, c.y - s.y)));
        if (d > bestDist) {
          bestDist = d;
          best = i;
        }
      });
      idx = best;
    } else {
      idx = randInt(rng, 0, remaining.length - 1);
    }
    const system = remaining[idx];
    remaining.splice(idx, 1);
    chosen.push(system);

    let homeworld = system.planets.find((p) => p.environment === "terran" || p.environment === "gaia");
    if (!homeworld) {
      homeworld = generatePlanet(rng, system.planets.length);
      homeworld.environment = "terran";
      homeworld.size = "large";
      homeworld.richness = "abundant";
      system.planets.push(homeworld);
    }
    system.isHomeworld = true;
    system.homeworldEmpireId = e;
    homeworld.isHomeworld = true;
    homeworld.colonizedBy = e;
    initColony(homeworld, { isHomeworld: true });
  }
}

export function findSystem(galaxy, systemId) {
  return galaxy.systems.find((s) => s.id === systemId);
}

export { getEnvironment };
