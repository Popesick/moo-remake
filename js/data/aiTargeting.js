// KI-Zielbewertung für Kolonisierung und Angriffe (ROADMAP v0.12, "MoO KI
// Verhalten.docx"): PlanetValue = PlanetSize / 1.045^TimeToDevelop, plus ein
// Spezialwert aus dem planetaren Biom (0 für Ultra-Poor bis 6 für Orion):
// Spezialwert = PlanetSpecial × 30 − 20. Reiche/Artefakt-Welten erhalten
// zusätzlich ×2, Ultra-Rich-Welten ×3 auf den Gesamtwert. Die KI wählt ihre
// Ziele rein nach diesem Wert, ohne die gegnerische Flottenstärke zu prüfen
// (Quelle: KI analysiert keine Verteidigungsstärke vorab).
// *Vereinfacht:* keine Raketenbasen-Abschreckung (-10/Basis aus der
// Vorlage), da dieses Remake keine diskreten planetaren Verteidigungsbauten
// kennt (nur ein imperiumsweites defenseBudget, siehe js/economy.js).
export const PLANET_VALUE_TIME_DECAY = 1.045;
export const DEVELOP_OVERHEAD_TURNS = 5;
export const SPECIAL_VALUE_PER_TIER = 30;
export const SPECIAL_VALUE_OFFSET = 20;

export const RICHNESS_SPECIAL_TIER = {
  ultra_poor: 0,
  poor: 1,
  abundant: 2,
  rich: 3,
  ultra_rich: 4,
};
export const RARE_ENVIRONMENT_SPECIAL_TIER = 5; // Gaia/Artefaktwelt
export const ORION_SPECIAL_TIER = 6;
