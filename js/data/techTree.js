// Vereinfachter Technologiebaum: statt aller ~50 Stufen pro Disziplin aus
// dem Original enthält der Prototyp ausgewählte Meilenstein-Technologien
// (Namen/Reihenfolge angelehnt an docs/design-analyse.docx). Zwischen zwei
// Meilensteinen fließen Forschungspunkte direkt auf den nächsten Meilenstein
// der jeweiligen Disziplin. effect.type verknüpft eine Technologie mit einem
// konkreten Spielmechanismus (siehe js/research.js:applyTechEffect); "flavor"
// hat noch keinen mechanischen Effekt und wartet auf Schiffsdesign/Kampf
// (ROADMAP v0.4/v0.5).
export const TECHS = [
  // Planetologie: schaltet Umweltkategorien frei (siehe js/data/environments.js
  // techReq) und erhöht die planetare Bevölkerungskapazität.
  { id: "planet_barren", discipline: "planetology", level: 1, name: "Barren-Kolonisierung", effect: { type: "planetologyLevel", value: 1 }, description: "Erlaubt die Besiedlung von Barren-Welten." },
  { id: "planet_tundra", discipline: "planetology", level: 2, name: "Kontrollierte Umweltanpassung", effect: { type: "planetologyLevel", value: 2 }, description: "Erlaubt die Besiedlung von Tundra- und Dead-Welten." },
  { id: "planet_inferno", discipline: "planetology", level: 3, name: "Thermische Adaption", effect: { type: "planetologyLevel", value: 3 }, description: "Erlaubt die Besiedlung von Inferno-Welten." },
  { id: "planet_toxic", discipline: "planetology", level: 4, name: "Toxinschutzsysteme", effect: { type: "planetologyLevel", value: 4 }, description: "Erlaubt die Besiedlung von Toxic-Welten." },
  { id: "planet_radiated", discipline: "planetology", level: 5, name: "Strahlenschutz-Kolonisierung", effect: { type: "planetologyLevel", value: 5 }, description: "Erlaubt die Besiedlung von Radiated-Welten." },
  { id: "planet_soil", discipline: "planetology", level: 8, name: "Soil Enrichment", effect: { type: "popCapacityMultiplier", value: 1.25 }, description: "+25% maximale planetare Bevölkerung." },
  { id: "planet_soil_adv", discipline: "planetology", level: 14, name: "Advanced Soil Enrichment", effect: { type: "popCapacityMultiplier", value: 1.5 }, description: "+50% maximale planetare Bevölkerung." },
  { id: "planet_terraform_10", discipline: "planetology", level: 20, name: "Terraforming +10", effect: { type: "popCapacityFlatBonus", value: 10 }, description: "+10 Bevölkerungskapazität auf jedem Kolonieplaneten." },
  { id: "planet_terraform_40", discipline: "planetology", level: 30, name: "Terraforming +40", effect: { type: "popCapacityFlatBonus", value: 40 }, description: "+40 Bevölkerungskapazität auf jedem Kolonieplaneten." },
  { id: "planet_terraform_80", discipline: "planetology", level: 45, name: "Terraforming +80", effect: { type: "popCapacityFlatBonus", value: 80 }, description: "+80 Bevölkerungskapazität auf jedem Kolonieplaneten." },

  // Computer: Robotic Controls (Fabriken pro Bevölkerungseinheit, 2 -> 7) plus
  // Kampf-Flavor-Techs (Wirkung erst ab v0.5 taktischer Kampf).
  { id: "comp_robotic_1", discipline: "computer", level: 1, name: "Robotic Controls Mk1", effect: { type: "roboticControls", value: 3 }, description: "Fabriken pro Bevölkerungseinheit: 3." },
  { id: "comp_targeting", discipline: "computer", level: 4, name: "Targeting Computer", effect: { type: "flavor" }, description: "Verbessert die Trefferwahrscheinlichkeit von Strahlenwaffen (ab v0.5)." },
  { id: "comp_robotic_2", discipline: "computer", level: 5, name: "Robotic Controls Mk2", effect: { type: "roboticControls", value: 4 }, description: "Fabriken pro Bevölkerungseinheit: 4." },
  { id: "comp_amr", discipline: "computer", level: 9, name: "Anti-Missile Rockets", effect: { type: "flavor" }, description: "Punktverteidigung gegen Raketen (ab v0.5)." },
  { id: "comp_robotic_3", discipline: "computer", level: 12, name: "Robotic Controls Mk3", effect: { type: "roboticControls", value: 5 }, description: "Fabriken pro Bevölkerungseinheit: 5." },
  { id: "comp_ecm", discipline: "computer", level: 18, name: "ECM Jammer", effect: { type: "flavor" }, description: "Erschwert gegnerisches Zielerfassen (ab v0.5)." },
  { id: "comp_robotic_4", discipline: "computer", level: 22, name: "Robotic Controls Mk4", effect: { type: "roboticControls", value: 6 }, description: "Fabriken pro Bevölkerungseinheit: 6." },
  { id: "comp_robotic_5", discipline: "computer", level: 35, name: "Robotic Controls Mk5", effect: { type: "roboticControls", value: 7 }, description: "Fabriken pro Bevölkerungseinheit: 7 (Maximum)." },

  // Konstruktion: Fabrikkosten und Verschmutzungs-Bereinigungskosten sinken.
  { id: "constr_fab_1", discipline: "construction", level: 1, name: "Verbesserte Fertigungstechniken", effect: { type: "factoryCostMultiplier", value: 0.9 }, description: "-10% Fabrikkosten." },
  { id: "constr_fab_2", discipline: "construction", level: 6, name: "Fabrikautomatisierung", effect: { type: "factoryCostMultiplier", value: 0.85 }, description: "-15% Fabrikkosten (kumulativ ersetzt vorherige Stufe)." },
  { id: "constr_waste_50", discipline: "construction", level: 12, name: "Reduced Waste 50%", effect: { type: "ecoCleanupCostMultiplier", value: 0.5 }, description: "Verschmutzungs-Bereinigung kostet nur noch die Hälfte." },
  { id: "constr_fab_3", discipline: "construction", level: 18, name: "Fortschrittliche Robotik-Fertigung", effect: { type: "factoryCostMultiplier", value: 0.75 }, description: "-25% Fabrikkosten." },
  { id: "constr_waste_80", discipline: "construction", level: 26, name: "Reduced Waste 80%", effect: { type: "ecoCleanupCostMultiplier", value: 0.2 }, description: "Verschmutzungs-Bereinigung kostet nur noch 20%." },
  { id: "constr_fab_4", discipline: "construction", level: 33, name: "Hochleistungslegierungen", effect: { type: "factoryCostMultiplier", value: 0.6 }, description: "-40% Fabrikkosten." },
  { id: "constr_waste_100", discipline: "construction", level: 45, name: "Complete Ecological Restoration", effect: { type: "ecoCleanupCostMultiplier", value: 0 }, description: "Industrielle Verschmutzung wird vollständig neutralisiert." },
  { id: "constr_fab_5", discipline: "construction", level: 50, name: "Selbstreplizierende Fabriken", effect: { type: "factoryCostMultiplier", value: 0.45 }, description: "-55% Fabrikkosten." },

  // Kraftfelder: Deflektorschilde (Wirkung erst ab v0.5 taktischer Kampf).
  { id: "ff_1", discipline: "forcefields", level: 1, name: "Deflector Shield Class I", effect: { type: "flavor" }, description: "Absorbiert 1 Schaden pro Treffer (ab v0.5)." },
  { id: "ff_2", discipline: "forcefields", level: 5, name: "Deflector Shield Class II", effect: { type: "flavor" }, description: "Absorbiert 2-3 Schaden pro Treffer (ab v0.5)." },
  { id: "ff_3", discipline: "forcefields", level: 10, name: "Deflector Shield Class III", effect: { type: "flavor" }, description: "Absorbiert 4-5 Schaden pro Treffer (ab v0.5)." },
  { id: "ff_4", discipline: "forcefields", level: 16, name: "Deflector Shield Class IV", effect: { type: "flavor" }, description: "Absorbiert 6-7 Schaden pro Treffer (ab v0.5)." },
  { id: "ff_5", discipline: "forcefields", level: 24, name: "Deflector Shield Class V", effect: { type: "flavor" }, description: "Absorbiert 9 Schaden pro Treffer (ab v0.5)." },
  { id: "ff_7", discipline: "forcefields", level: 32, name: "Deflector Shield Class VII", effect: { type: "flavor" }, description: "Starke Schildstufe (ab v0.5)." },
  { id: "ff_10", discipline: "forcefields", level: 42, name: "Deflector Shield Class X", effect: { type: "flavor" }, description: "Absorbiert 25 Schaden pro Treffer (ab v0.5)." },
  { id: "ff_15", discipline: "forcefields", level: 50, name: "Deflector Shield Class XV", effect: { type: "flavor" }, description: "Höchste Prototyp-Schildstufe (ab v0.5)." },

  // Antrieb: Reisegeschwindigkeit/Manövrierfähigkeit (Wirkung erst ab v0.4/v0.5).
  { id: "prop_nuclear", discipline: "propulsion", level: 1, name: "Nuclear Drive", effect: { type: "flavor" }, description: "Grundlegender Antrieb (ab v0.4)." },
  { id: "prop_fusion", discipline: "propulsion", level: 6, name: "Fusion Drive", effect: { type: "flavor" }, description: "Schnellerer Antrieb (ab v0.4)." },
  { id: "prop_interphased", discipline: "propulsion", level: 12, name: "Interphased Drive", effect: { type: "flavor" }, description: "Erhöht Manövrierfähigkeit (ab v0.5)." },
  { id: "prop_ion", discipline: "propulsion", level: 20, name: "Ionentriebwerk", effect: { type: "flavor" }, description: "Weitere Reichweiten- und Tempoerhöhung (ab v0.4)." },
  { id: "prop_hyper", discipline: "propulsion", level: 28, name: "Hyperantrieb", effect: { type: "flavor" }, description: "Deutlich schnellere interstellare Reisen (ab v0.4)." },
  { id: "prop_inertial", discipline: "propulsion", level: 36, name: "Inertial Stabilizer", effect: { type: "flavor" }, description: "Bonus auf Ausweichrate im Kampf (ab v0.5)." },
  { id: "prop_displacement", discipline: "propulsion", level: 44, name: "Displacement Drive", effect: { type: "flavor" }, description: "Sehr hohe Reisegeschwindigkeit (ab v0.4)." },
  { id: "prop_temporal", discipline: "propulsion", level: 50, name: "Temporal Drive", effect: { type: "flavor" }, description: "Höchste Prototyp-Antriebsstufe (ab v0.4)." },

  // Waffen (Wirkung erst ab v0.5 taktischer Kampf).
  { id: "wpn_laser", discipline: "weapons", level: 1, name: "Laser", effect: { type: "flavor" }, description: "Basis-Strahlenwaffe (ab v0.5)." },
  { id: "wpn_gatling", discipline: "weapons", level: 6, name: "Gatling Laser", effect: { type: "flavor" }, description: "Schnellfeuernde Schwachwaffe (ab v0.5)." },
  { id: "wpn_mass_driver", discipline: "weapons", level: 12, name: "Mass Driver", effect: { type: "flavor" }, description: "Halbiert effektive Schildstärke des Ziels (ab v0.5)." },
  { id: "wpn_hard_beam", discipline: "weapons", level: 18, name: "Hard Beam", effect: { type: "flavor" }, description: "Halbiert effektive Schildstärke des Ziels (ab v0.5)." },
  { id: "wpn_neutron_stream", discipline: "weapons", level: 26, name: "Neutron Stream Projector", effect: { type: "flavor" }, description: "Überträgt Overkill-Schaden auf den nächsten Gegner (ab v0.5)." },
  { id: "wpn_graviton", discipline: "weapons", level: 34, name: "Graviton Beam", effect: { type: "flavor" }, description: "Streuwaffe mit Overkill-Übertrag (ab v0.5)." },
  { id: "wpn_mauler", discipline: "weapons", level: 44, name: "Mauler Device", effect: { type: "flavor" }, description: "20-100 Schaden, durchbricht starke Schilde (ab v0.5)." },
  { id: "wpn_death_ray", discipline: "weapons", level: 50, name: "Death Ray", effect: { type: "flavor" }, description: "Stärkste Prototyp-Waffe (ab v0.5)." },
];

export function getTech(id) {
  return TECHS.find((t) => t.id === id);
}

export function techsForDiscipline(disciplineId) {
  return TECHS.filter((t) => t.discipline === disciplineId).sort((a, b) => a.level - b.level);
}
