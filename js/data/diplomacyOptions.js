// Konstanten für Handelsabkommen und Galaktischen Rat, siehe
// design-analyse.docx ("Diplomatie, Spionage und der Galaktische Rat").
// *Vereinfacht:* Rat-Intervall in Spielrunden statt 25 Jahren, da die Partie
// insgesamt auf 150 Runden begrenzt ist (siehe js/victory.js TURN_LIMIT).
export const COUNCIL_POPULATION_THRESHOLD_RATIO = 2 / 3;
export const COUNCIL_INTERVAL_TURNS = 10;
export const COUNCIL_MAJORITY_RATIO = 2 / 3;

// Handelsabkommen laufen TRADE_DEFICIT_TURNS Runden mit leichtem Verlust an,
// reifen danach linear zu einem Bonus heran (Obergrenze TRADE_MAX_BC_PER_TURN).
export const TRADE_DEFICIT_TURNS = 5;
export const TRADE_DEFICIT_BC_PER_TURN = 2;
export const TRADE_GROWTH_BC_PER_TURN = 1.5;
export const TRADE_MAX_BC_PER_TURN = 40;
