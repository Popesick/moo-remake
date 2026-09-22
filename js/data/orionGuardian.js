import { getTech } from "./techTree.js";

// Guardian of Orion (ROADMAP v0.10), siehe design-analyse.docx ("Das
// Orion-System, Wächter und Endgame-Bedrohungen"): auf Schwierigkeitsgrad
// "Impossible" 10.000 HP, Deflektorschild Klasse 9, Death Rays (200-1000
// Einzelschaden). *Vereinfacht:* feste Werte unabhängig vom gewählten
// Schwierigkeitsgrad (das Original beziffert nur die Impossible-Stufe);
// Streuraketen und Stellar Converter aus der Quelle sind nicht simuliert,
// nur der namensgebende Death Ray als einzige Waffe.
export const DEATH_RAY_TECH_ID = "guardian_death_ray";

export const GUARDIAN_STATS = {
  name: "Guardian of Orion",
  hp: 10000,
  shield: 9,
  speed: 6,
  // Weit über der Standard-Angriffswerte-Skala (Basis 10, Battle Computer
  // Mark I-XI: +1 bis +11) – siehe js/combat.js BASE_ATTACK_RATING.
  attackRating: 55,
  weapons: [{ tech: getTech(DEATH_RAY_TECH_ID), count: 1 }],
};
