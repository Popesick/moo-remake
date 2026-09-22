import { DISCIPLINES } from "./data/disciplines.js";
import { TECHS, techsForDiscipline, rungOf } from "./data/techTree.js";
import { getResearchCostFactor } from "./data/raceResearch.js";
import { makeRng, hashSeed } from "./rng.js";

const EVEN_ALLOCATION = Object.fromEntries(DISCIPLINES.map((d) => [d.id, 100 / DISCIPLINES.length]));
const PSILON_DISCOVERY_CHANCE = 0.75;
const DEFAULT_DISCOVERY_CHANCE = 0.5;

// Jede Fraktion erhält nur einen Teil aller Technologien pro Partie (50%,
// Psilons 75% als "Proud Scholar Race"), siehe techtree-analyse.docx
// ("Forschungsvoraussetzungen und die Rung-Architektur"). Die 50 Level pro
// Disziplin sind in 10 Rungs (Subkategorien) zu je 5 Leveln gegliedert; ist
// nach den Zufallswürfen kein Tech einer Rung verfügbar, wird die letzte
// gewürfelte Technologie dieser Rung garantiert freigegeben, damit keine
// Sackgasse entsteht.
export function rollAvailableTechs(seed, empireId, raceId) {
  const discoveryChance = raceId === "psilon" ? PSILON_DISCOVERY_CHANCE : DEFAULT_DISCOVERY_CHANCE;
  const rng = makeRng(hashSeed(`${seed}:techpool:${empireId}`));
  const available = new Set();

  for (const discipline of DISCIPLINES) {
    const techs = techsForDiscipline(discipline.id);
    const byRung = new Map();
    for (const tech of techs) {
      const rung = rungOf(tech.level);
      if (!byRung.has(rung)) byRung.set(rung, []);
      byRung.get(rung).push(tech);
    }
    for (const rungTechs of byRung.values()) {
      // "Obligatorische Schlüsseltechnologien": alle Level-1-Techs sind
      // garantiert verfügbar und gelten zu Spielbeginn als erforscht.
      const mandatory = rungTechs.filter((t) => t.level === 1);
      const rolled = rungTechs.filter((t) => t.level !== 1);
      for (const tech of mandatory) available.add(tech.id);

      let anyAvailable = false;
      for (const tech of rolled) {
        if (rng() < discoveryChance) {
          available.add(tech.id);
          anyAvailable = true;
        }
      }
      if (!anyAvailable && rolled.length > 0) {
        // Verhindert eine Sackgasse: letzte Option der Rung wird garantiert freigegeben.
        available.add(rolled[rolled.length - 1].id);
      }
    }
  }
  return available;
}

function candidatesForDiscipline(disciplineId, availableSet, completedSet) {
  const techs = techsForDiscipline(disciplineId);
  const highestCompletedRung = techs
    .filter((t) => completedSet.has(t.id))
    .reduce((max, t) => Math.max(max, rungOf(t.level)), 0);
  const unlockedRung = highestCompletedRung + 1; // Rung 1 ist immer freigeschaltet
  return techs.filter(
    (t) => availableSet.has(t.id) && !completedSet.has(t.id) && rungOf(t.level) <= unlockedRung
  );
}

export function initEmpireResearch(seed, empireId, raceId) {
  const availableTechs = rollAvailableTechs(seed, empireId, raceId);
  const techLevel = Object.fromEntries(DISCIPLINES.map((d) => [d.id, 0]));
  const progress = Object.fromEntries(DISCIPLINES.map((d) => [d.id, 0]));
  const completedTechs = [];

  const research = {
    techLevel,
    effectiveTechLevel: Object.fromEntries(DISCIPLINES.map((d) => [d.id, 0])),
    progress,
    currentTarget: {},
    availableTechs: [...availableTechs],
    completedTechs,
    allocation: { ...EVEN_ALLOCATION },
  };

  // "Zu Beginn einer Partie verfügen alle Spezies über die jeweiligen
  // Level-1-Technologien" – werden sofort als erforscht markiert.
  const appliedEffects = [];
  for (const tech of TECHS) {
    if (tech.level === 1 && availableTechs.has(tech.id)) {
      completedTechs.push(tech.id);
      techLevel[tech.discipline] = Math.max(techLevel[tech.discipline], tech.level);
      appliedEffects.push(tech);
    }
  }

  const completedSet = new Set(completedTechs);
  for (const d of DISCIPLINES) {
    recomputeEffectiveLevel(research, d.id);
    const candidates = candidatesForDiscipline(d.id, availableTechs, completedSet);
    research.currentTarget[d.id] = candidates[0]?.id ?? null;
  }

  return { research, initialBreakthroughs: appliedEffects };
}

function recomputeEffectiveLevel(research, disciplineId) {
  const techs = techsForDiscipline(disciplineId).filter((t) => research.completedTechs.includes(t.id));
  if (techs.length === 0) {
    research.effectiveTechLevel[disciplineId] = 0;
    return;
  }
  const highest = Math.max(...techs.map((t) => t.level));
  const othersCount = techs.filter((t) => t.level !== highest).length;
  research.effectiveTechLevel[disciplineId] = highest * 0.8 + othersCount;
}

export function costForTech(tech, researchCostFactor, raceFactor = 1) {
  return researchCostFactor * tech.level * tech.level * raceFactor;
}

// Sobald die Basiskosten erreicht sind, entspricht die Durchbruchschance
// exakt dem prozentualen Überschuss investierter Punkte (Beispiel im
// Analyse-Dokument: 4500 RP bei 4000 Basiskosten -> 12,5% Chance).
export function breakthroughChance(progress, cost) {
  if (progress < cost || cost <= 0) return 0;
  return Math.min(1, (progress - cost) / cost);
}

export function normalizeAllocation(allocation) {
  const sum = DISCIPLINES.reduce((s, d) => s + (allocation[d.id] ?? 0), 0);
  if (sum === 0) return { ...EVEN_ALLOCATION };
  const out = {};
  for (const d of DISCIPLINES) out[d.id] = ((allocation[d.id] ?? 0) * 100) / sum;
  return out;
}

export function getCandidateTechs(empire, disciplineId) {
  const research = empire.research;
  const availableSet = new Set(research.availableTechs);
  const completedSet = new Set(research.completedTechs);
  return candidatesForDiscipline(disciplineId, availableSet, completedSet);
}

export function selectResearchTarget(empire, disciplineId, techId) {
  empire.research.currentTarget[disciplineId] = techId;
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
    case "factoryCostBC":
      empire.factoryCostBC = Math.min(empire.factoryCostBC ?? Infinity, effect.value);
      break;
    case "wasteGenerationMultiplier":
      empire.wasteGenerationMultiplier = Math.min(empire.wasteGenerationMultiplier ?? 1, effect.value);
      break;
    case "ecoCleanupUnitsPerBC":
      empire.ecoCleanupUnitsPerBC = Math.max(empire.ecoCleanupUnitsPerBC ?? 1, effect.value);
      break;
    case "popCapacityMultiplier":
      empire.popCapacityMultiplier = Math.max(empire.popCapacityMultiplier ?? 1, effect.value);
      break;
    case "popCapacityFlatBonus":
      empire.popCapacityFlatBonus = Math.max(empire.popCapacityFlatBonus ?? 0, effect.value);
      break;
    case "travelSpeed":
      empire.travelSpeedParsec = Math.max(empire.travelSpeedParsec ?? 1, effect.value);
      break;
    case "attackBonus":
      empire.attackBonus = Math.max(empire.attackBonus ?? 0, effect.value);
      break;
    case "ecmBonus":
      empire.ecmDefense = Math.max(empire.ecmDefense ?? 0, effect.value);
      break;
    case "groundArmorBonus":
      empire.groundArmorBonus = Math.max(empire.groundArmorBonus ?? 0, effect.value);
      break;
    case "groundShieldBonus":
      empire.groundShieldBonus = Math.max(empire.groundShieldBonus ?? 0, effect.value);
      break;
    case "bioWeapon":
      empire.bioWeaponKillMillions = Math.max(empire.bioWeaponKillMillions ?? 0, effect.value);
      break;
    case "bioAntidote":
      empire.bioAntidoteReduceMillions = Math.max(empire.bioAntidoteReduceMillions ?? 0, effect.value);
      break;
    case "flavor":
    default:
      break; // wartet auf Schiffsdesign/Kampf/Bodeninvasion (v0.4/v0.5/v0.7)
  }
}

// Verteilt die per Tech-Slider erzeugten Forschungspunkte einer Runde auf die
// sechs Disziplinen (gemäß Allokations-Regler) und prüft je Disziplin auf
// einen technologischen Durchbruch unter den aktuell erforschbaren Techs
// (freigeschaltete Rung ∩ für dieses Imperium verfügbarer Zufalls-Pool).
export function processResearchTurn(empire, incomingRP, seed, turn) {
  const research = empire.research;
  const availableSet = new Set(research.availableTechs);
  const completedSet = new Set(research.completedTechs);
  const breakthroughs = [];

  for (const discipline of DISCIPLINES) {
    const share = (incomingRP * (research.allocation[discipline.id] ?? 0)) / 100;

    let targetId = research.currentTarget[discipline.id];
    let target = targetId ? TECHS.find((t) => t.id === targetId) : null;
    if (!target || completedSet.has(target.id)) {
      const candidates = candidatesForDiscipline(discipline.id, availableSet, completedSet);
      target = candidates[0] ?? null;
      research.currentTarget[discipline.id] = target?.id ?? null;
    }
    if (!target || share <= 0) continue;

    research.progress[discipline.id] += share;
    const raceFactor = getResearchCostFactor(empire.raceId, discipline.id);
    const cost = costForTech(target, empire.researchCostFactor ?? 26, raceFactor);
    const rng = makeRng(hashSeed(`${seed}:breakthrough:${empire.id}:${discipline.id}:${turn}`));
    const chance = breakthroughChance(research.progress[discipline.id], cost);
    if (chance > 0 && rng() < chance) {
      research.progress[discipline.id] = 0;
      research.techLevel[discipline.id] = Math.max(research.techLevel[discipline.id], target.level);
      research.completedTechs.push(target.id);
      completedSet.add(target.id);
      applyTechEffect(empire, target);
      recomputeEffectiveLevel(research, discipline.id);
      breakthroughs.push(target);

      const candidates = candidatesForDiscipline(discipline.id, availableSet, completedSet);
      research.currentTarget[discipline.id] = candidates[0]?.id ?? null;
    }
  }

  return breakthroughs;
}
