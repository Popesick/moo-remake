// Diplomatie: Krieg/Frieden pro Imperiumspaar (ROADMAP v0.6) und
// Handelsabkommen (ROADMAP v0.9). Der Galaktische Rat lebt in js/council.js.
// Kampf zwischen Flotten unterschiedlicher Imperien (js/combat.js) findet
// nur im Kriegszustand statt. Bündnisse/Nichtangriffspakte über
// Krieg/Frieden/Handel hinaus gibt es nicht (siehe ROADMAP-Simplifizierung).
import {
  TRADE_DEFICIT_TURNS,
  TRADE_DEFICIT_BC_PER_TURN,
  TRADE_GROWTH_BC_PER_TURN,
  TRADE_MAX_BC_PER_TURN,
} from "./data/diplomacyOptions.js";

// Diplomatisches Gedächtnis (ROADMAP v0.12, "MoO KI Verhalten.docx": KI
// verweigert nach Vertragsbrüchen dauerhaft neue Allianzen/Handelsabkommen).
// Ein einzelner, symmetrischer Groll-Wert pro Imperiumspaar statt einer
// gerichteten Zuordnung – vereinfacht, aber ausreichend, um Friedens- und
// Handelsangebote nach Kriegserklärungen/gebrochenen Handelsabkommen
// dauerhaft unwahrscheinlicher zu machen.
export const WAR_DECLARATION_GRUDGE = 40;
export const BROKEN_TRADE_GRUDGE = 15;

function pairKey(empireIdA, empireIdB) {
  const [a, b] = [empireIdA, empireIdB].sort((x, y) => x - y);
  return `${a}-${b}`;
}

export function initRelations(galaxy) {
  galaxy.relations = {};
  galaxy.tradeAgreements = {};
  for (let i = 0; i < galaxy.empires.length; i++) {
    for (let j = i + 1; j < galaxy.empires.length; j++) {
      galaxy.relations[pairKey(galaxy.empires[i].id, galaxy.empires[j].id)] = { status: "peace", grudge: 0 };
    }
  }
}

export function getRelation(galaxy, empireIdA, empireIdB) {
  return galaxy.relations?.[pairKey(empireIdA, empireIdB)] ?? { status: "peace", grudge: 0 };
}

export function isAtWar(galaxy, empireIdA, empireIdB) {
  return getRelation(galaxy, empireIdA, empireIdB).status === "war";
}

export function getGrudge(galaxy, empireIdA, empireIdB) {
  return getRelation(galaxy, empireIdA, empireIdB).grudge ?? 0;
}

export function addGrudge(galaxy, empireIdA, empireIdB, amount) {
  if (!galaxy.relations) galaxy.relations = {};
  const key = pairKey(empireIdA, empireIdB);
  const existing = galaxy.relations[key] ?? { status: "peace", grudge: 0 };
  galaxy.relations[key] = { ...existing, grudge: (existing.grudge ?? 0) + amount };
}

export function setRelationStatus(galaxy, empireIdA, empireIdB, status) {
  if (!galaxy.relations) galaxy.relations = {};
  const key = pairKey(empireIdA, empireIdB);
  const existing = galaxy.relations[key] ?? { status: "peace", grudge: 0 };
  // Unprovozierte Kriegserklärung (aus vorherigem Frieden) hinterlässt
  // dauerhaften Groll, der spätere Friedens-/Handelsangebote erschwert.
  const grudge = status === "war" && existing.status === "peace"
    ? (existing.grudge ?? 0) + WAR_DECLARATION_GRUDGE
    : existing.grudge ?? 0;
  galaxy.relations[key] = { status, grudge };
  // Krieg beendet ein bestehendes Handelsabkommen automatisch.
  if (status === "war") cancelTradeAgreement(galaxy, empireIdA, empireIdB);
}

export function getTradeAgreement(galaxy, empireIdA, empireIdB) {
  return galaxy.tradeAgreements?.[pairKey(empireIdA, empireIdB)] ?? null;
}

export function proposeTradeAgreement(galaxy, empireIdA, empireIdB) {
  if (isAtWar(galaxy, empireIdA, empireIdB)) return false;
  if (getTradeAgreement(galaxy, empireIdA, empireIdB)) return false;
  if (!galaxy.tradeAgreements) galaxy.tradeAgreements = {};
  galaxy.tradeAgreements[pairKey(empireIdA, empireIdB)] = { turnsActive: 0 };
  return true;
}

export function cancelTradeAgreement(galaxy, empireIdA, empireIdB) {
  if (!galaxy.tradeAgreements) return;
  delete galaxy.tradeAgreements[pairKey(empireIdA, empireIdB)];
}

// Ertrag eines Handelsabkommens: läuft zunächst TRADE_DEFICIT_TURNS Runden
// mit leichtem Verlust an, reift danach linear zu einem Bonus heran (siehe
// design-analyse.docx: "Handelsabkommen akkumulieren ihren Ertrag über die
// Zeit; sie starten oft im Defizit und reifen allmählich zu massiven
// industriellen Boni heran").
export function computeTradeBonusBC(agreement) {
  if (!agreement) return 0;
  if (agreement.turnsActive < TRADE_DEFICIT_TURNS) return -TRADE_DEFICIT_BC_PER_TURN;
  return Math.min(TRADE_MAX_BC_PER_TURN, (agreement.turnsActive - TRADE_DEFICIT_TURNS) * TRADE_GROWTH_BC_PER_TURN);
}

// Zählt alle aktiven Handelsabkommen eine Runde weiter und liefert den
// jeweils aktuellen BC-Ertrag pro Partnerpaar; wird in js/economy.js auf
// beide beteiligten Imperien angewendet (je zur Hälfte auf Forschung,
// Verteidigung und Kolonieschiff-Fortschritt verteilt, da es keine eigene
// Handels-Slider-Zuteilung gibt).
export function tickTradeAgreements(galaxy) {
  if (!galaxy.tradeAgreements) return [];
  const results = [];
  for (const [key, agreement] of Object.entries(galaxy.tradeAgreements)) {
    agreement.turnsActive += 1;
    const [empireIdA, empireIdB] = key.split("-").map(Number);
    results.push({ empireIdA, empireIdB, bonusBC: computeTradeBonusBC(agreement) });
  }
  return results;
}
