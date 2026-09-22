import { DISCIPLINES } from "./data/disciplines.js";
import { TECHS, techsForDiscipline } from "./data/techTree.js";
import { makeRng, hashSeed } from "./rng.js";

const EVEN_ALLOCATION = Object.fromEntries(DISCIPLINES.map((d) => [d.id, 100 / DISCIPLINES.length]));

// Jede Fraktion erhält nur ~50% aller Technologien pro Partie (Psilons wären
// mit 75% die Ausnahme, siehe ROADMAP v0.6 für Rassen-Regelbrüche). Das
// jeweils niedrigste Level pro Disziplin ist garantiert verfügbar, damit kein
// Imperium zu Spielbeginn in einer Disziplin komplett feststeckt.
export function rollAvailableTechs(seed, empireId, discoveryChance = 0.5) {
  const rng = makeRng(hashSeed(`${seed}:techpool:${empireId}`));
  const available = new Set();
  for (const discipline of DISCIPLINES) {
    const techs = techsForDiscipline(discipline.id);
    techs.forEach((tech, i) => {
      if (i === 0 || rng() < discoveryChance) available.add(tech.id);
    });
  }
  return available;
}

export function initEmpireResearch(seed, empireId) {
  const availableTechs = rollAvailableTechs(seed, empireId);
  const techLevel = Object.fromEntries(DISCIPLINES.map((d) => [d.id, 0]));
  const progress = Object.fromEntries(DISCIPLINES.map((d) => [d.id, 0]));
  const currentTarget = {};
  for (const d of DISCIPLINES) {
    currentTarget[d.id] = nextTechFor(d.id, 0, availableTechs, new Set())?.id ?? null;
  }
  return {
    techLevel,
    progress,
    currentTarget,
    availableTechs: [...availableTechs],
    completedTechs: [],
    allocation: { ...EVEN_ALLOCATION },
  };
}

function nextTechFor(discipline, techLevel, availableSet, completedSet) {
  const techs = techsForDiscipline(discipline);
  return techs.find((t) => t.level > techLevel && availableSet.has(t.id) && !completedSet.has(t.id));
}

export function costForTech(tech, researchCostFactor) {
  return researchCostFactor * tech.level * tech.level;
}

// Ab Erreichen der Basiskosten existiert bereits eine Grundchance auf einen
// Durchbruch, die mit zusätzlicher Investition weiter steigt (siehe
// design-analyse.docx, exakte Originalformel nicht erhalten).
export function breakthroughChance(progress, cost) {
  if (progress < cost) return 0;
  const overinvestment = (progress - cost) / cost;
  return Math.min(1, 0.15 + overinvestment);
}

export function normalizeAllocation(allocation) {
  const sum = DISCIPLINES.reduce((s, d) => s + (allocation[d.id] ?? 0), 0);
  if (sum === 0) return { ...EVEN_ALLOCATION };
  const out = {};
  for (const d of DISCIPLINES) out[d.id] = ((allocation[d.id] ?? 0) * 100) / sum;
  return out;
}

export function applyTechEffect(empire, tech) {
  const effect = tech.effect;
  switch (effect.type) {
    case "planetologyLevel":
      empire.planetologyTechLevel = Math.max(empire.planetologyTechLevel ?? 0, effect.value);
      break;
    case "roboticControls":
      empire.roboticControlsLevel = Math.max(empire.roboticControlsLevel ?? 2, effect.value);
      break;
    case "factoryCostMultiplier":
      empire.factoryCostMultiplier = effect.value;
      break;
    case "ecoCleanupCostMultiplier":
      empire.ecoCleanupCostMultiplier = effect.value;
      break;
    case "popCapacityMultiplier":
      empire.popCapacityMultiplier = effect.value;
      break;
    case "popCapacityFlatBonus":
      empire.popCapacityFlatBonus = Math.max(empire.popCapacityFlatBonus ?? 0, effect.value);
      break;
    case "flavor":
    default:
      break; // wartet auf Schiffsdesign/Kampf (v0.4/v0.5)
  }
}

// Verteilt die per Tech-Slider erzeugten Forschungspunkte einer Runde auf die
// sechs Disziplinen (gemäß Allokations-Regler) und prüft je Disziplin auf
// einen technologischen Durchbruch.
export function processResearchTurn(empire, incomingRP, seed, turn) {
  const research = empire.research;
  const availableSet = new Set(research.availableTechs);
  const completedSet = new Set(research.completedTechs);
  const breakthroughs = [];

  for (const discipline of DISCIPLINES) {
    const share = (incomingRP * (research.allocation[discipline.id] ?? 0)) / 100;
    if (share <= 0) continue;

    let targetId = research.currentTarget[discipline.id];
    if (!targetId) continue;
    let target = TECHS.find((t) => t.id === targetId);
    if (!target || completedSet.has(target.id)) {
      target = nextTechFor(discipline.id, research.techLevel[discipline.id], availableSet, completedSet);
      research.currentTarget[discipline.id] = target?.id ?? null;
      if (!target) continue;
    }

    research.progress[discipline.id] += share;
    const cost = costForTech(target, empire.researchCostFactor ?? 26);
    const rng = makeRng(hashSeed(`${seed}:breakthrough:${empire.id}:${discipline.id}:${turn}`));
    const chance = breakthroughChance(research.progress[discipline.id], cost);
    if (chance > 0 && rng() < chance) {
      research.progress[discipline.id] = 0;
      research.techLevel[discipline.id] = target.level;
      research.completedTechs.push(target.id);
      completedSet.add(target.id);
      applyTechEffect(empire, target);
      breakthroughs.push(target);

      const next = nextTechFor(discipline.id, target.level, availableSet, completedSet);
      research.currentTarget[discipline.id] = next?.id ?? null;
    }
  }

  return breakthroughs;
}
