import { getTech } from "./data/techTree.js";
import { isAtWar, setRelationStatus } from "./diplomacy.js";

const MAX_GROUND_ROUNDS = 20;
const TROOPS_PER_SHIP = 5; // abstrahierte Transportkapazität ohne eigenen Transporter-Schiffstyp

// Infanterie-Modifikator (0 bis ~0,9) aus bester erforschter Panzerung
// (Schiffslegierung, siehe design-analyse.docx "Ground Combat Formula"),
// Waffen-Techstufe, Exoskelett-/Powered-Armor- und Personal-Shield-Ketten.
function armorGroundMod(empire) {
  let best = 0;
  for (const techId of empire.research.completedTechs) {
    const tech = getTech(techId);
    if (tech?.module?.kind === "armor") best = Math.max(best, tech.module.groundArmorMod ?? 0);
  }
  return best;
}

function weaponGroundMod(empire) {
  const level = empire.research.techLevel.weapons ?? 0;
  return Math.min(0.3, (level / 50) * 0.3);
}

export function infantryModifier(empire) {
  return armorGroundMod(empire) + weaponGroundMod(empire) + (empire.groundArmorBonus ?? 0) + (empire.groundShieldBonus ?? 0);
}

export function maxInvasionTroops(empire, planet) {
  return Math.max(1, Math.floor(planet.population) - 1);
}

// Fleet-basierte Transportkapazität (Platzhalter ohne dedizierten
// Transporter-Schiffstyp): Anzahl Schiffe × Truppen pro Schiff.
export function fleetTroopCapacity(fleet) {
  const shipCount = fleet.stacks.reduce((sum, s) => sum + s.count, 0);
  return shipCount * TROOPS_PER_SHIP;
}

// Löst eine automatische Bodeninvasion auf (design-analyse.docx: iterative
// Verluste pro Runde, Zufallsfaktor 1,0-1,5). Sieger übernimmt den Planeten
// samt Fabriken; Chance auf Tech-Diebstahl bei Erfolg ("Invade and Capture
// Techs"). troopsSent werden vom Quellplaneten abgezogen, bevor diese
// Funktion aufgerufen wird.
export function resolveInvasion(attackerEmpire, defenderEmpire, planet, troopsSent) {
  let attackerTroops = troopsSent;
  let defenderTroops = Math.max(1, planet.population);

  const attackerPowerPerTroop = (1 + infantryModifier(attackerEmpire)) * (attackerEmpire.groundCombatMultiplier ?? 1);
  const defenderPowerPerTroop = (1 + infantryModifier(defenderEmpire)) * (defenderEmpire.groundCombatMultiplier ?? 1);

  const log = [];
  let round = 1;
  while (round <= MAX_GROUND_ROUNDS && attackerTroops > 0 && defenderTroops > 0) {
    const attackRoll = 1 + Math.random() * 0.5;
    const defendRoll = 1 + Math.random() * 0.5;
    const damageToDefender = attackerTroops * attackerPowerPerTroop * attackRoll * 0.3;
    const damageToAttacker = defenderTroops * defenderPowerPerTroop * defendRoll * 0.3;
    defenderTroops = Math.max(0, defenderTroops - damageToDefender);
    attackerTroops = Math.max(0, attackerTroops - damageToAttacker);
    round += 1;
  }

  const attackerWon = defenderTroops <= 0 && attackerTroops > 0;
  log.push(
    attackerWon
      ? `Invasion erfolgreich nach ${round - 1} Runde(n): ${Math.ceil(attackerTroops)} Mio. Soldaten erobern den Planeten.`
      : `Invasion gescheitert nach ${round - 1} Runde(n): die Invasionstruppen wurden aufgerieben.`
  );

  let stolenTech = null;
  if (attackerWon) {
    const attackerCompleted = new Set(attackerEmpire.research.completedTechs);
    const stealable = defenderEmpire.research.completedTechs.filter((id) => !attackerCompleted.has(id));
    if (stealable.length > 0 && Math.random() < 0.3) {
      stolenTech = getTech(stealable[Math.floor(Math.random() * stealable.length)]);
      log.push(`Tech-Diebstahl: ${stolenTech.name} erbeutet.`);
    }
  }

  return { attackerWon, survivingTroops: Math.max(1, Math.ceil(attackerTroops)), log, stolenTech };
}

export function applyInvasionResult(galaxy, attackerEmpireId, planet, result) {
  if (result.attackerWon) {
    const defenderEmpireId = planet.colonizedBy;
    // Kill-Zuordnung für den Highscore (ROADMAP v0.11), siehe js/economy.js
    // resolveAllCombats und js/victory.js checkGameEnd/computeScore.
    if (defenderEmpireId !== null && defenderEmpireId !== undefined) {
      galaxy.lastDamagedBy = galaxy.lastDamagedBy ?? {};
      galaxy.lastDamagedBy[defenderEmpireId] = attackerEmpireId;
    }
    planet.colonizedBy = attackerEmpireId;
    planet.population = result.survivingTroops;
    planet.sliders = { ship: 20, def: 10, ind: 30, eco: 20, tech: 20 };
    planet.indCarry = 0;
    planet.shipCarry = 0;
    planet.productionTarget = null;
    if (result.stolenTech) {
      const attacker = galaxy.empires.find((e) => e.id === attackerEmpireId);
      if (!attacker.research.completedTechs.includes(result.stolenTech.id)) {
        attacker.research.completedTechs.push(result.stolenTech.id);
        attacker.research.techLevel[result.stolenTech.discipline] = Math.max(
          attacker.research.techLevel[result.stolenTech.discipline],
          result.stolenTech.level
        );
      }
    }
  }
}

// Biowaffen töten Bevölkerung direkt, lassen Fabriken intakt (siehe
// design-analyse.docx). Fällt die Bevölkerung auf 0, wird der Planet
// wieder unbesiedelt (Fabriken bleiben stehen und können erobert werden).
// Diplomatischer Fallout: alle Imperien, die zuvor Frieden mit dem
// Angreifer hielten, können sofort den Krieg erklären.
export function applyBioAttack(galaxy, attackerEmpire, defenderEmpire, planet) {
  const kill = Math.max(0, (attackerEmpire.bioWeaponKillMillions ?? 0) - (defenderEmpire.bioAntidoteReduceMillions ?? 0));
  const casualties = Math.min(planet.population, kill);
  planet.population -= casualties;

  let depopulated = false;
  if (planet.population <= 0) {
    // Kill-Zuordnung für den Highscore (ROADMAP v0.11), siehe js/economy.js
    // resolveAllCombats und js/victory.js checkGameEnd/computeScore.
    galaxy.lastDamagedBy = galaxy.lastDamagedBy ?? {};
    galaxy.lastDamagedBy[defenderEmpire.id] = attackerEmpire.id;
    planet.colonizedBy = null;
    depopulated = true;
  }

  let newWars = 0;
  for (const other of galaxy.empires) {
    if (other.id === attackerEmpire.id) continue;
    if (isAtWar(galaxy, attackerEmpire.id, other.id)) continue;
    if (Math.random() < 0.5) {
      setRelationStatus(galaxy, attackerEmpire.id, other.id, "war");
      newWars += 1;
    }
  }

  return { casualties, depopulated, newWars };
}
