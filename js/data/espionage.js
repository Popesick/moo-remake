// Spionage-Konstanten, siehe design-analyse.docx ("Diplomatie, Spionage und
// der Galaktische Rat"). Exakte Originalwerte sind dort nicht beziffert
// ("Spieler weisen einen Prozentsatz ihrer Ressourcen zu") – die Werte hier
// sind plausible, zentral tunbare Platzhalter.
export const ESPIONAGE_GENERATION_RATE = 0.5; // Anteil des Budget-Prozentsatzes, der tatsächlich in SP umgesetzt wird
export const DEFAULT_ESPIONAGE_ALLOCATION_PCT = 10;
export const MAX_ESPIONAGE_ALLOCATION_PCT = 30;

export const SPY_ACTIONS = {
  stealTech: { id: "stealTech", name: "Technologie stehlen", cost: 60 },
  sabotage: { id: "sabotage", name: "Industrielle Sabotage", cost: 45 },
  rebellion: { id: "rebellion", name: "Rebellion anzetteln", cost: 70 },
};

export const MISSION_BASE_SUCCESS_CHANCE = 0.65;
export const BASE_DETECTION_CHANCE = 0.35;
export const DARLOK_DETECTION_REDUCTION = 0.15; // formwandelnde Spione: schwerer zu entdecken
export const DARLOK_FRAME_SUCCESS_CHANCE = 0.85; // "insbesondere die formwandelnden Darloks"
export const DEFAULT_FRAME_SUCCESS_CHANCE = 0.5;

// "MoO KI Verhalten.docx" (ROADMAP v0.12): erfolgreiche Rebellionen können
// bei KI-Imperien den Herrscher stürzen und Persönlichkeit/Ziel neu würfeln.
export const REBELLION_PERSONALITY_CHANGE_CHANCE = 0.35;
