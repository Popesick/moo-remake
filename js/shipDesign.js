import { HULLS, getHull, MAX_SHIP_DESIGNS } from "./data/hulls.js";
import { TECHS, getTech } from "./data/techTree.js";

// Platzbedarf/Kosten einzelner Komponenten sind in keiner der beiden
// Analyse-Vorlagen beziffert (nur Schaden/HP/Schild-Werte). Die Formeln hier
// sind plausible, in dieser Datei zentral tunbare Platzhalter, die die
// Miniaturisierungs-Erzählung respektieren (höherstufige Komponenten sind
// vor v0.10 spürbar teurer/größer als frühe).
const WEAPON_SPACE_BASE = 2;
const WEAPON_COST_BASE = 4;
const WEAPON_COST_PER_LEVEL = 1.2;
const SHIELD_SPACE = 3;
const SHIELD_COST_BASE = 5;
const SHIELD_COST_PER_ABSORPTION = 4;
const DRIVE_SPACE = 4;
const DRIVE_COST_BASE = 5;
const DRIVE_COST_PER_SPEED = 4;
const ARMOR_COST_PER_SPACE = 0.15;

// Miniaturisierung (ROADMAP v0.10), siehe techtree-analyse.docx: Je weiter
// das kumulierte Forschungsniveau einer Disziplin über das Level einer
// Komponente hinausgeht, desto kompakter (-66% Platz) und billiger (-50%
// Kosten) wird deren Fertigung. *Vereinfacht:* stetige Funktion über
// empire.research.effectiveTechLevel statt separater "Advanced
// Technologies"-Einträge (Level 51-99) – die Quelle beziffert diese ohnehin
// nur als reine Miniaturisierung ohne eigene Inhalte.
const MINIATURIZATION_LEVEL_RANGE = 40;
const MINIATURIZATION_COST_FLOOR = 0.5;
const MINIATURIZATION_SPACE_FLOOR = 1 / 3;

export function miniaturizationFactor(empire, tech) {
  const empireLevel = empire?.research?.effectiveTechLevel?.[tech.discipline] ?? tech.level;
  const diff = Math.max(0, empireLevel - tech.level);
  const t = Math.min(1, diff / MINIATURIZATION_LEVEL_RANGE);
  return {
    costMultiplier: 1 - t * (1 - MINIATURIZATION_COST_FLOOR),
    spaceMultiplier: 1 - t * (1 - MINIATURIZATION_SPACE_FLOOR),
  };
}

export function modulesOfKind(kind, empire) {
  const completed = new Set(empire?.research?.completedTechs ?? []);
  return TECHS.filter((t) => t.module?.kind === kind && completed.has(t.id));
}

export function weaponSpaceCost(tech) {
  return WEAPON_SPACE_BASE + Math.floor(tech.level / 10);
}

export function weaponUnitCost(tech) {
  return Math.round(WEAPON_COST_BASE + tech.level * WEAPON_COST_PER_LEVEL);
}

function shieldCost(tech) {
  return Math.round(SHIELD_COST_BASE + tech.module.absorption * SHIELD_COST_PER_ABSORPTION);
}

function driveCost(tech) {
  return Math.round(DRIVE_COST_BASE + tech.module.speed * DRIVE_COST_PER_SPEED);
}

function armorCost(hull, tech) {
  return Math.round(hull.space * ARMOR_COST_PER_SPACE * tech.module.hpMultiplier);
}

// Berechnet Gesamtkosten/-platz/-HP/-Geschwindigkeit eines Designs. weapons:
// [{ techId, count }]. armorId/shieldId/driveId dürfen leer sein (kein
// Modul gewählt); driveId leer -> Geschwindigkeit 1 (Retro Engines Minimum).
export function computeDesignStats(design, empire) {
  const hull = getHull(design.hullId);
  if (!hull) return null;

  const armor = design.armorId ? getTech(design.armorId) : null;
  const shield = design.shieldId ? getTech(design.shieldId) : null;
  const drive = design.driveId ? getTech(design.driveId) : null;

  let spaceUsed = 0;
  let costBC = hull.baseCostBC;

  if (armor) {
    costBC += armorCost(hull, armor) * miniaturizationFactor(empire, armor).costMultiplier;
  }
  if (shield) {
    const { costMultiplier, spaceMultiplier } = miniaturizationFactor(empire, shield);
    spaceUsed += SHIELD_SPACE * spaceMultiplier;
    costBC += shieldCost(shield) * costMultiplier;
  }
  if (drive) {
    const { costMultiplier, spaceMultiplier } = miniaturizationFactor(empire, drive);
    spaceUsed += DRIVE_SPACE * spaceMultiplier;
    costBC += driveCost(drive) * costMultiplier;
  }

  const weaponLines = (design.weapons ?? [])
    .map(({ techId, count }) => ({ tech: getTech(techId), count }))
    .filter((w) => w.tech?.module?.kind === "weapon");

  for (const { tech, count } of weaponLines) {
    const { costMultiplier, spaceMultiplier } = miniaturizationFactor(empire, tech);
    spaceUsed += weaponSpaceCost(tech) * spaceMultiplier * count;
    costBC += weaponUnitCost(tech) * costMultiplier * count;
  }

  spaceUsed = Math.ceil(spaceUsed);

  return {
    hull,
    spaceUsed,
    spaceTotal: hull.space,
    spaceRemaining: hull.space - spaceUsed,
    costBC: Math.round(costBC),
    hp: Math.round(hull.baseHP * (armor?.module.hpMultiplier ?? 1)),
    shieldAbsorption: shield?.module.absorption ?? 0,
    speed: drive?.module.speed ?? 1,
    hullEvasionBonus: hull.evasionBonus,
    weaponLines,
    overCapacity: spaceUsed > hull.space,
  };
}

export function canAddDesign(empire) {
  return (empire.shipDesigns?.length ?? 0) < MAX_SHIP_DESIGNS;
}

export function addShipDesign(empire, design) {
  if (!canAddDesign(empire)) {
    return { ok: false, reason: `Design-Limit erreicht (max. ${MAX_SHIP_DESIGNS}). Erst ein Design verschrotten.` };
  }
  const stats = computeDesignStats(design, empire);
  if (!stats) return { ok: false, reason: "Ungültiger Rumpf." };
  if (stats.overCapacity) return { ok: false, reason: "Design überschreitet die Raumkapazität des Rumpfs." };

  const entry = { id: `design-${Date.now()}-${Math.floor(Math.random() * 1000)}`, ...design };
  empire.shipDesigns.push(entry);
  return { ok: true, design: entry };
}

export function scrapShipDesign(empire, designId) {
  empire.shipDesigns = empire.shipDesigns.filter((d) => d.id !== designId);
}

export { HULLS };
