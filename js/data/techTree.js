// Vollständiger Technologiebaum, transkribiert aus der Nutzer-Recherche
// "Master of Orion 1 Comprehensive Technology Tree and Cost Analysis"
// (docs/techtree-analyse.docx). Level 1-50 je Disziplin, in zehn "Rungs"
// (Subkategorien) zu je 5 Leveln gruppiert – siehe js/research.js für die
// Rung-Freischaltung und die Zufallsverfügbarkeit pro Imperium.
//
// effect.type verknüpft eine Technologie mit einem im Prototyp simulierten
// Mechanismus; "flavor" markiert Technologien, deren Wirkung erst mit
// Kampf (ROADMAP v0.5) oder Bodeninvasion/Diplomatie (v0.7+) simuliert wird.
//
// module beschreibt eine im Schiffsdesign-Editor (v0.4, js/data/hulls.js)
// wählbare Komponente. Schaden/HP-Werte sind aus docs/techtree-analyse.docx
// übernommen; Platzbedarf (space) und BC-Kosten sind dort nicht beziffert
// und daher plausible, in js/shipDesign.js zentral skalierte Platzhalter.
export const TECHS = [
  // ---- Computer ------------------------------------------------------
  { id: "comp_robotic_2", discipline: "computer", level: 1, name: "Robotics Controls 2", effect: { type: "roboticControls", value: 2 }, description: "Erlaubt die Kontrolle von 2 Fabriken pro Bevölkerungseinheit." },
  { id: "comp_battle_computer_1", discipline: "computer", level: 1, name: "Battle Computer Mark I", effect: { type: "attackBonus", value: 1 }, description: "Erhöht den Angriffswert von Raumschiffen um +1." },
  { id: "comp_battle_scanner", discipline: "computer", level: 1, name: "Battle Scanner", effect: { type: "flavor" }, description: "+3 Initiative, +1 Angriffswert, deckt feindliche Schiffsdaten auf (ab v0.5)." },
  { id: "comp_deep_space_scanner", discipline: "computer", level: 2, name: "Deep Space Scanner", effect: { type: "flavor" }, description: "Kolonien detektieren feindliche Schiffe auf 5 Parsec Distanz (ab v0.4)." },
  { id: "comp_battle_computer_2", discipline: "computer", level: 5, name: "Battle Computer Mark II", effect: { type: "attackBonus", value: 2 }, description: "Erhöht den Angriffswert um +2 (ab v0.5)." },
  { id: "comp_improved_scanner", discipline: "computer", level: 7, name: "Improved Space Scanner", effect: { type: "flavor" }, description: "Detektionsreichweite 7 Parsec, zeigt ETA und Flottenziel (ab v0.4)." },
  { id: "comp_battle_computer_3", discipline: "computer", level: 10, name: "Battle Computer Mark III", effect: { type: "attackBonus", value: 3 }, description: "Erhöht den Angriffswert um +3 (ab v0.5)." },
  { id: "comp_ecm_3", discipline: "computer", level: 12, name: "ECM Jammer Mark III", effect: { type: "ecmBonus", value: 3 }, description: "Erhöht den Raketenabwehrwert um +3 (ab v0.5)." },
  { id: "comp_battle_computer_4", discipline: "computer", level: 15, name: "Battle Computer Mark IV", effect: { type: "attackBonus", value: 4 }, description: "Erhöht den Angriffswert um +4 (ab v0.5)." },
  { id: "comp_ecm_4", discipline: "computer", level: 17, name: "ECM Jammer Mark IV", effect: { type: "ecmBonus", value: 4 }, description: "Erhöht den Raketenabwehrwert um +4 (ab v0.5)." },
  { id: "comp_robotic_4", discipline: "computer", level: 18, name: "Improved Robotic Controls IV", effect: { type: "roboticControls", value: 4 }, description: "Erlaubt die Kontrolle von 4 Fabriken pro Bevölkerungseinheit." },
  { id: "comp_battle_computer_5", discipline: "computer", level: 20, name: "Battle Computer Mark V", effect: { type: "attackBonus", value: 5 }, description: "Erhöht den Angriffswert um +5 (ab v0.5)." },
  { id: "comp_ecm_5", discipline: "computer", level: 22, name: "ECM Jammer Mark V", effect: { type: "ecmBonus", value: 5 }, description: "Erhöht den Raketenabwehrwert um +5 (ab v0.5)." },
  { id: "comp_advanced_scanner", discipline: "computer", level: 23, name: "Advanced Space Scanner", effect: { type: "flavor" }, description: "Detektion auf 9 Parsec, Planetenscans ohne Flotten-Orbit (ab v0.4)." },
  { id: "comp_battle_computer_6", discipline: "computer", level: 25, name: "Battle Computer Mark VI", effect: { type: "attackBonus", value: 6 }, description: "Erhöht den Angriffswert um +6 (ab v0.5)." },
  { id: "comp_ecm_6", discipline: "computer", level: 27, name: "ECM Jammer Mark VI", effect: { type: "ecmBonus", value: 6 }, description: "Erhöht den Raketenabwehrwert um +6 (ab v0.5)." },
  { id: "comp_robotic_5", discipline: "computer", level: 28, name: "Improved Robotic Controls V", effect: { type: "roboticControls", value: 5 }, description: "Erlaubt die Kontrolle von 5 Fabriken pro Bevölkerungseinheit." },
  { id: "comp_battle_computer_7", discipline: "computer", level: 30, name: "Battle Computer Mark VII", effect: { type: "attackBonus", value: 7 }, description: "Erhöht den Angriffswert um +7 (ab v0.5)." },
  { id: "comp_ecm_7", discipline: "computer", level: 32, name: "ECM Jammer Mark VII", effect: { type: "ecmBonus", value: 7 }, description: "Erhöht den Raketenabwehrwert um +7 (ab v0.5)." },
  { id: "comp_oracle", discipline: "computer", level: 34, name: "Oracle Interface", effect: { type: "flavor" }, description: "Direktfeuerwaffen werden rüstungsdurchschlagend (ab v0.5)." },
  { id: "comp_robotic_6", discipline: "computer", level: 35, name: "Improved Robotic Controls VI", effect: { type: "roboticControls", value: 6 }, description: "Erlaubt die Kontrolle von 6 Fabriken pro Bevölkerungseinheit." },
  { id: "comp_battle_computer_8", discipline: "computer", level: 38, name: "Battle Computer Mark VIII", effect: { type: "attackBonus", value: 8 }, description: "Erhöht den Angriffswert um +8 (ab v0.5)." },
  { id: "comp_ecm_8", discipline: "computer", level: 40, name: "ECM Jammer Mark VIII", effect: { type: "ecmBonus", value: 8 }, description: "Erhöht den Raketenabwehrwert um +8 (ab v0.5)." },
  { id: "comp_hyperspace_comm", discipline: "computer", level: 42, name: "Hyperspace Communications", effect: { type: "flavor" }, description: "Befehlsaustausch mit Flotten im Transit (ab v0.4)." },
  { id: "comp_battle_computer_9", discipline: "computer", level: 44, name: "Battle Computer Mark IX", effect: { type: "attackBonus", value: 9 }, description: "Erhöht den Angriffswert um +9 (ab v0.5)." },
  { id: "comp_ecm_9", discipline: "computer", level: 46, name: "ECM Jammer Mark IX", effect: { type: "ecmBonus", value: 9 }, description: "Erhöht den Raketenabwehrwert um +9 (ab v0.5)." },
  { id: "comp_robotic_7", discipline: "computer", level: 47, name: "Improved Robotic Controls VII", effect: { type: "roboticControls", value: 7 }, description: "Erlaubt die Kontrolle von 7 Fabriken pro Bevölkerungseinheit (Maximum)." },
  { id: "comp_tech_nullifier", discipline: "computer", level: 49, name: "Technology Nullifier", effect: { type: "flavor" }, description: "Reduziert den feindlichen Angriffswert pro Schuss um 2-6 (ab v0.5)." },
  { id: "comp_battle_computer_11", discipline: "computer", level: 50, name: "Battle Computer Mark XI", effect: { type: "attackBonus", value: 11 }, description: "Erhöht den Angriffswert um +11 (ab v0.5)." },

  // ---- Konstruktion ---------------------------------------------------
  { id: "constr_titanium", discipline: "construction", level: 1, name: "Titanium Armor", effect: { type: "flavor" }, description: "Basispanzerung für alle Einheiten.", module: { kind: "armor", hpMultiplier: 1.0, groundArmorMod: 0 } },
  { id: "constr_ind_9", discipline: "construction", level: 3, name: "Industrial Tech 9", effect: { type: "factoryCostBC", value: 9 }, description: "Fabrikkosten sinken auf 9 BC." },
  { id: "constr_waste_80", discipline: "construction", level: 5, name: "Reduced Industrial Waste 80%", effect: { type: "wasteGenerationMultiplier", value: 0.8 }, description: "Fabrik-Verschmutzung sinkt auf 80% des Basiswerts." },
  { id: "constr_ind_8", discipline: "construction", level: 8, name: "Industrial Tech 8", effect: { type: "factoryCostBC", value: 8 }, description: "Fabrikkosten sinken auf 8 BC." },
  { id: "constr_duralloy", discipline: "construction", level: 10, name: "Duralloy Armor", effect: { type: "flavor" }, description: "+50% Trefferpunkte für Schiffe, +Bodenkampfwert (ab v0.7).", module: { kind: "armor", hpMultiplier: 1.5, groundArmorMod: 0.05 } },
  { id: "constr_waste_60", discipline: "construction", level: 13, name: "Reduced Industrial Waste 60%", effect: { type: "wasteGenerationMultiplier", value: 0.6 }, description: "Fabrik-Verschmutzung sinkt auf 60% des Basiswerts." },
  { id: "constr_ind_7", discipline: "construction", level: 14, name: "Industrial Tech 7", effect: { type: "factoryCostBC", value: 7 }, description: "Fabrikkosten sinken auf 7 BC." },
  { id: "constr_zortium", discipline: "construction", level: 17, name: "Zortium Armor", effect: { type: "flavor" }, description: "+100% HP für Schiffe, +Bodenkampfwert (ab v0.7).", module: { kind: "armor", hpMultiplier: 2.0, groundArmorMod: 0.1 } },
  { id: "constr_ind_6", discipline: "construction", level: 18, name: "Industrial Tech 6", effect: { type: "factoryCostBC", value: 6 }, description: "Fabrikkosten sinken auf 6 BC." },
  { id: "constr_ind_5", discipline: "construction", level: 23, name: "Industrial Tech 5", effect: { type: "factoryCostBC", value: 5 }, description: "Fabrikkosten sinken auf 5 BC." },
  { id: "constr_exoskeleton", discipline: "construction", level: 24, name: "Armored Exoskeleton", effect: { type: "groundArmorBonus", value: 0.2 }, description: "+20 Bodenkampfwert der Infanterie (ab v0.7)." },
  { id: "constr_waste_40", discipline: "construction", level: 25, name: "Reduced Industrial Waste 40%", effect: { type: "wasteGenerationMultiplier", value: 0.4 }, description: "Fabrik-Verschmutzung sinkt auf 40% des Basiswerts." },
  { id: "constr_andrium", discipline: "construction", level: 26, name: "Andrium Armor", effect: { type: "flavor" }, description: "+150% HP für Schiffe, +Bodenkampfwert (ab v0.7).", module: { kind: "armor", hpMultiplier: 2.5, groundArmorMod: 0.15 } },
  { id: "constr_ind_4", discipline: "construction", level: 28, name: "Industrial Tech 4", effect: { type: "factoryCostBC", value: 4 }, description: "Fabrikkosten sinken auf 4 BC." },
  { id: "constr_tritanium", discipline: "construction", level: 33, name: "Tritanium Armor", effect: { type: "flavor" }, description: "+200% HP für Schiffe, +Bodenkampfwert (ab v0.7).", module: { kind: "armor", hpMultiplier: 3.0, groundArmorMod: 0.2 } },
  { id: "constr_waste_20", discipline: "construction", level: 35, name: "Reduced Industrial Waste 20%", effect: { type: "wasteGenerationMultiplier", value: 0.2 }, description: "Fabrik-Verschmutzung sinkt auf 20% des Basiswerts." },
  { id: "constr_damage_control", discipline: "construction", level: 37, name: "Advanced Damage Control", effect: { type: "flavor" }, description: "Regeneriert 30% der Schiffs-HP pro Kampfrunde (ab v0.5)." },
  { id: "constr_ind_2", discipline: "construction", level: 38, name: "Industrial Tech 2", effect: { type: "factoryCostBC", value: 2 }, description: "Fabrikkosten sinken auf 2 BC." },
  { id: "constr_powered_armor", discipline: "construction", level: 40, name: "Powered Armor", effect: { type: "groundArmorBonus", value: 0.3 }, description: "+30 Bodenkampfwert der Infanterie (ab v0.7)." },
  { id: "constr_adamantium", discipline: "construction", level: 42, name: "Adamantium Armor", effect: { type: "flavor" }, description: "+250% HP für Schiffe, +Bodenkampfwert (ab v0.7).", module: { kind: "armor", hpMultiplier: 3.5, groundArmorMod: 0.25 } },
  { id: "constr_waste_0", discipline: "construction", level: 47, name: "Industrial Waste Elimination", effect: { type: "wasteGenerationMultiplier", value: 0 }, description: "Fabrik-Verschmutzung wird vollständig eliminiert." },
  { id: "constr_neutronium", discipline: "construction", level: 50, name: "Neutronium Armor", effect: { type: "flavor" }, description: "+300% HP für Schiffe, ultimative Panzerung.", module: { kind: "armor", hpMultiplier: 4.0, groundArmorMod: 0.3 } },

  // ---- Kraftfelder ------------------------------------------------------
  { id: "ff_class_1", discipline: "forcefields", level: 1, name: "Class I Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden pro Treffer um 1 (ab v0.5).", module: { kind: "shield", absorption: 1 } },
  { id: "ff_class_2", discipline: "forcefields", level: 4, name: "Class II Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 2 (ab v0.5).", module: { kind: "shield", absorption: 2 } },
  { id: "ff_personal_deflector", discipline: "forcefields", level: 8, name: "Personal Deflector Shield", effect: { type: "groundShieldBonus", value: 0.1 }, description: "+10 Bodenkampfwert (ab v0.7)." },
  { id: "ff_class_3", discipline: "forcefields", level: 10, name: "Class III Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 3 (ab v0.5).", module: { kind: "shield", absorption: 3 } },
  { id: "ff_planetary_5", discipline: "forcefields", level: 12, name: "Class V Planetary Shield", effect: { type: "flavor" }, description: "Reduziert Schaden an Raketenbasen/Planet um 5 (ab v0.7)." },
  { id: "ff_class_4", discipline: "forcefields", level: 14, name: "Class IV Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 4 (ab v0.5).", module: { kind: "shield", absorption: 4 } },
  { id: "ff_repulsor", discipline: "forcefields", level: 16, name: "Repulsor Beam", effect: { type: "flavor" }, description: "Stößt feindliche Schiffe auf Distanz (ab v0.5)." },
  { id: "ff_class_5", discipline: "forcefields", level: 20, name: "Class V Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 5 (ab v0.5).", module: { kind: "shield", absorption: 5 } },
  { id: "ff_personal_absorption", discipline: "forcefields", level: 21, name: "Personal Absorption Shield", effect: { type: "groundShieldBonus", value: 0.2 }, description: "+20 Bodenkampfwert (ab v0.7)." },
  { id: "ff_planetary_10", discipline: "forcefields", level: 22, name: "Class X Planetary Shield", effect: { type: "flavor" }, description: "Reduziert Schaden an planetaren Zielen um 10 (ab v0.7)." },
  { id: "ff_class_6", discipline: "forcefields", level: 24, name: "Class VI Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 6 (ab v0.5).", module: { kind: "shield", absorption: 6 } },
  { id: "ff_cloaking", discipline: "forcefields", level: 27, name: "Cloaking Device", effect: { type: "flavor" }, description: "Enorme Ausweichchance für getarnte Schiffe (ab v0.5)." },
  { id: "ff_class_7", discipline: "forcefields", level: 30, name: "Class VII Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 7 (ab v0.5).", module: { kind: "shield", absorption: 7 } },
  { id: "ff_zyro", discipline: "forcefields", level: 31, name: "Zyro Shield", effect: { type: "flavor" }, description: "75% Chance, Raketen vor Einschlag zu zerstören (ab v0.5)." },
  { id: "ff_planetary_15", discipline: "forcefields", level: 32, name: "Class XV Planetary Shield", effect: { type: "flavor" }, description: "Reduziert Schaden an planetaren Zielen um 15 (ab v0.7)." },
  { id: "ff_class_9", discipline: "forcefields", level: 34, name: "Class IX Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 9 (ab v0.5).", module: { kind: "shield", absorption: 9 } },
  { id: "ff_stasis", discipline: "forcefields", level: 37, name: "Stasis Field", effect: { type: "flavor" }, description: "Nimmt ein Zielschiff 1 Runde aus dem Kampf (ab v0.5)." },
  { id: "ff_personal_barrier", discipline: "forcefields", level: 38, name: "Personal Barrier Shield", effect: { type: "groundShieldBonus", value: 0.3 }, description: "+30 Bodenkampfwert (ab v0.7)." },
  { id: "ff_class_11", discipline: "forcefields", level: 40, name: "Class XI Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 11 (ab v0.5).", module: { kind: "shield", absorption: 11 } },
  { id: "ff_planetary_20", discipline: "forcefields", level: 42, name: "Class XX Planetary Shield", effect: { type: "flavor" }, description: "Reduziert Schaden an planetaren Zielen um 20 (ab v0.7)." },
  { id: "ff_black_hole", discipline: "forcefields", level: 43, name: "Black Hole Generator", effect: { type: "flavor" }, description: "Zerstört 25-100% der Ziele im Wirkungsbereich (ab v0.5)." },
  { id: "ff_class_13", discipline: "forcefields", level: 44, name: "Class 13 Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 13 (ab v0.5).", module: { kind: "shield", absorption: 13 } },
  { id: "ff_lightning", discipline: "forcefields", level: 46, name: "Lightning Shield", effect: { type: "flavor" }, description: "100% Basis-Chance, Raketen zu zerstören (ab v0.5)." },
  { id: "ff_class_15", discipline: "forcefields", level: 50, name: "Class XV Deflector Shield", effect: { type: "flavor" }, description: "Reduziert Hüllenschaden um 15 (Maximum, ab v0.5).", module: { kind: "shield", absorption: 15 } },

  // ---- Planetologie -----------------------------------------------------
  { id: "planet_terra_10", discipline: "planetology", level: 2, name: "Terraforming +10", effect: { type: "popCapacityFlatBonus", value: 10 }, description: "+10 maximale planetare Bevölkerung." },
  { id: "planet_eco_improved", discipline: "planetology", level: 5, name: "Improved Eco Restoration", effect: { type: "ecoCleanupUnitsPerBC", value: 5 }, description: "Erhöht die Effizienz der Verschmutzungs-Bereinigung." },
  { id: "planet_tundra", discipline: "planetology", level: 6, name: "Controlled Tundra Env.", effect: { type: "planetologyLevel", value: 6 }, description: "Erlaubt die Besiedlung von Tundra-Welten." },
  { id: "planet_terra_20", discipline: "planetology", level: 8, name: "Terraforming +20", effect: { type: "popCapacityFlatBonus", value: 20 }, description: "+20 maximale planetare Bevölkerung." },
  { id: "planet_dead", discipline: "planetology", level: 9, name: "Controlled Dead Env.", effect: { type: "planetologyLevel", value: 9 }, description: "Erlaubt die Besiedlung toter Welten ohne Atmosphäre." },
  { id: "planet_death_spores", discipline: "planetology", level: 10, name: "Death Spores", effect: { type: "bioWeapon", value: 1 }, description: "Biowaffe: eliminiert 1 Mio. Zivilisten pro Treffer (ab v0.7)." },
  { id: "planet_terra_30", discipline: "planetology", level: 13, name: "Terraforming +30", effect: { type: "popCapacityFlatBonus", value: 30 }, description: "+30 maximale planetare Bevölkerung." },
  { id: "planet_toxic", discipline: "planetology", level: 15, name: "Controlled Toxic Env.", effect: { type: "planetologyLevel", value: 15 }, description: "Erlaubt die risikoreiche Besiedlung toxischer Welten." },
  { id: "planet_soil_enrichment", discipline: "planetology", level: 16, name: "Soil Enrichment", effect: { type: "popCapacityMultiplier", value: 1.25 }, description: "Planetare Basisgröße +25%, Wachstum beschleunigt." },
  { id: "planet_bio_antidote", discipline: "planetology", level: 17, name: "Bio Toxin Antidote", effect: { type: "bioAntidote", value: 1 }, description: "Reduziert Biowaffen-Schaden um 1 Mio. pro Treffer (ab v0.7)." },
  { id: "planet_radiated", discipline: "planetology", level: 18, name: "Controlled Radiated Env.", effect: { type: "planetologyLevel", value: 18 }, description: "Erlaubt die Besiedlung radioaktiver Welten." },
  { id: "planet_terra_40", discipline: "planetology", level: 20, name: "Terraforming +40", effect: { type: "popCapacityFlatBonus", value: 40 }, description: "+40 maximale planetare Bevölkerung." },
  { id: "planet_cloning", discipline: "planetology", level: 21, name: "Cloning", effect: { type: "flavor" }, description: "Senkt die Kosten künstlicher Besiedlung auf 10 BC (ab v0.4)." },
  { id: "planet_atmospheric_terra", discipline: "planetology", level: 22, name: "Atmospheric Terraforming", effect: { type: "flavor" }, description: "Wandelt toxische/tote/radioaktive Welten in normale Biome um (später)." },
  { id: "planet_eco_advanced", discipline: "planetology", level: 24, name: "Advanced Eco Restoration", effect: { type: "ecoCleanupUnitsPerBC", value: 10 }, description: "1 BC beseitigt nun 10 Einheiten Verschmutzung." },
  { id: "planet_terra_50", discipline: "planetology", level: 26, name: "Terraforming +50", effect: { type: "popCapacityFlatBonus", value: 50 }, description: "+50 maximale planetare Bevölkerung." },
  { id: "planet_doom_virus", discipline: "planetology", level: 27, name: "Doom Virus", effect: { type: "bioWeapon", value: 2 }, description: "Biowaffe: eliminiert 2 Mio. Zivilisten pro Treffer (ab v0.7)." },
  { id: "planet_soil_advanced", discipline: "planetology", level: 30, name: "Advanced Soil Enrichment", effect: { type: "popCapacityMultiplier", value: 1.5 }, description: "Wandelt fruchtbare Welten in Gaia-Klasse um, Basisgröße +50%." },
  { id: "planet_terra_60", discipline: "planetology", level: 32, name: "Terraforming +60", effect: { type: "popCapacityFlatBonus", value: 60 }, description: "+60 maximale planetare Bevölkerung." },
  { id: "planet_eco_complete", discipline: "planetology", level: 34, name: "Complete Eco Restoration", effect: { type: "ecoCleanupUnitsPerBC", value: 20 }, description: "1 BC beseitigt nun 20 Einheiten Verschmutzung." },
  { id: "planet_universal_antidote", discipline: "planetology", level: 36, name: "Universal Antidote", effect: { type: "bioAntidote", value: 2 }, description: "Reduziert Biowaffen-Schaden um 2 Mio. pro Treffer (ab v0.7)." },
  { id: "planet_terra_80", discipline: "planetology", level: 38, name: "Terraforming +80", effect: { type: "popCapacityFlatBonus", value: 80 }, description: "+80 maximale planetare Bevölkerung." },
  { id: "planet_bio_terminator", discipline: "planetology", level: 40, name: "Bio Terminator", effect: { type: "bioWeapon", value: 3 }, description: "Biowaffe: eliminiert 3 Mio. Zivilisten pro Treffer (ab v0.7)." },
  { id: "planet_cloning_advanced", discipline: "planetology", level: 42, name: "Advanced Cloning", effect: { type: "flavor" }, description: "Senkt Besiedlungskosten weiter auf 5 BC (ab v0.4)." },
  { id: "planet_terra_100", discipline: "planetology", level: 44, name: "Terraforming +100", effect: { type: "popCapacityFlatBonus", value: 100 }, description: "+100 maximale planetare Bevölkerung." },
  { id: "planet_terra_complete", discipline: "planetology", level: 50, name: "Complete Terraforming", effect: { type: "popCapacityFlatBonus", value: 120 }, description: "+120 maximale planetare Bevölkerung (Maximum)." },

  // ---- Antrieb ------------------------------------------------------
  { id: "prop_retro", discipline: "propulsion", level: 1, name: "Retro Engines", effect: { type: "travelSpeed", value: 1 }, description: "Reisegeschwindigkeit 1 Parsec/Zug.", module: { kind: "drive", speed: 1 } },
  { id: "prop_hydrogen", discipline: "propulsion", level: 2, name: "Hydrogen Fuel Cells", effect: { type: "travelRange", value: 10 }, description: "Flottenreichweite 10 Parsec ab eigenen Kolonien." },
  { id: "prop_deuterium", discipline: "propulsion", level: 5, name: "Deuterium Fuel Cells", effect: { type: "travelRange", value: 13 }, description: "Flottenreichweite 13 Parsec ab eigenen Kolonien." },
  { id: "prop_nuclear", discipline: "propulsion", level: 6, name: "Nuclear Engines", effect: { type: "travelSpeed", value: 2 }, description: "Reisegeschwindigkeit 2 Parsec/Zug.", module: { kind: "drive", speed: 2 } },
  { id: "prop_irridium", discipline: "propulsion", level: 9, name: "Irridium Fuel Cells", effect: { type: "travelRange", value: 16 }, description: "Flottenreichweite 16 Parsec ab eigenen Kolonien." },
  { id: "prop_inertial_stabilizer", discipline: "propulsion", level: 10, name: "Inertial Stabilizer", effect: { type: "flavor" }, description: "+2 Manövrierwert, erschwert Zielerfassung (ab v0.5)." },
  { id: "prop_sublight", discipline: "propulsion", level: 12, name: "Sub Light Drives", effect: { type: "travelSpeed", value: 3 }, description: "Reisegeschwindigkeit 3 Parsec/Zug.", module: { kind: "drive", speed: 3 } },
  { id: "prop_dotomite", discipline: "propulsion", level: 14, name: "Dotomite Crystals", effect: { type: "travelRange", value: 20 }, description: "Flottenreichweite 20 Parsec ab eigenen Kolonien." },
  { id: "prop_energy_pulsar", discipline: "propulsion", level: 16, name: "Energy Pulsar", effect: { type: "flavor" }, description: "5 Flächenschaden an benachbarten Schiffen (ab v0.5)." },
  { id: "prop_fusion", discipline: "propulsion", level: 18, name: "Fusion Drives", effect: { type: "travelSpeed", value: 4 }, description: "Reisegeschwindigkeit 4 Parsec/Zug.", module: { kind: "drive", speed: 4 } },
  { id: "prop_uridium", discipline: "propulsion", level: 19, name: "Uridium Fuel Cells", effect: { type: "travelRange", value: 25 }, description: "Flottenreichweite 25 Parsec ab eigenen Kolonien." },
  { id: "prop_warp_dissipator", discipline: "propulsion", level: 20, name: "Warp Dissipator", effect: { type: "flavor" }, description: "Reduziert gegnerischen Manövrierwert pro Runde (ab v0.5)." },
  { id: "prop_reajax", discipline: "propulsion", level: 23, name: "Reajax II Fuel Cells", effect: { type: "travelRange", value: 30 }, description: "Flottenreichweite 30 Parsec ab eigenen Kolonien." },
  { id: "prop_impulse", discipline: "propulsion", level: 24, name: "Impulse Drives", effect: { type: "travelSpeed", value: 5 }, description: "Reisegeschwindigkeit 5 Parsec/Zug.", module: { kind: "drive", speed: 5 } },
  { id: "prop_stargates", discipline: "propulsion", level: 27, name: "Intergalactic Star Gates", effect: { type: "flavor" }, description: "Sofortreise zwischen eigenen Sternentor-Kolonien (später)." },
  { id: "prop_trilithium", discipline: "propulsion", level: 29, name: "Trilithium Crystals", effect: { type: "travelRange", value: 36 }, description: "Flottenreichweite 36 Parsec ab eigenen Kolonien." },
  { id: "prop_ion", discipline: "propulsion", level: 30, name: "Ion Drives", effect: { type: "travelSpeed", value: 6 }, description: "Reisegeschwindigkeit 6 Parsec/Zug.", module: { kind: "drive", speed: 6 } },
  { id: "prop_high_energy_focus", discipline: "propulsion", level: 34, name: "High Energy Focus", effect: { type: "flavor" }, description: "+3 Feuerreichweite für Direktfeuerwaffen (ab v0.5)." },
  { id: "prop_antimatter", discipline: "propulsion", level: 36, name: "Anti-Matter Drives", effect: { type: "travelSpeed", value: 7 }, description: "Reisegeschwindigkeit 7 Parsec/Zug.", module: { kind: "drive", speed: 7 } },
  { id: "prop_subspace_teleporter", discipline: "propulsion", level: 38, name: "Sub Space Teleporter", effect: { type: "flavor" }, description: "Schiffe bewegen sich im Kampf zuerst, teleportieren frei (ab v0.5)." },
  { id: "prop_ionic_pulsar", discipline: "propulsion", level: 40, name: "Ionic Pulsar", effect: { type: "flavor" }, description: "10 Flächenschaden an benachbarten Schiffen (ab v0.5)." },
  { id: "prop_thorium", discipline: "propulsion", level: 41, name: "Thorium Cells", effect: { type: "travelRange", value: 9999 }, description: "Unbegrenzte Flottenreichweite (keine Reichweitenbeschränkung mehr)." },
  { id: "prop_interphased", discipline: "propulsion", level: 42, name: "Inter-phased Drives", effect: { type: "travelSpeed", value: 8 }, description: "Reisegeschwindigkeit 8 Parsec/Zug.", module: { kind: "drive", speed: 8 } },
  { id: "prop_subspace_interdictor", discipline: "propulsion", level: 43, name: "Sub Space Interdictor", effect: { type: "flavor" }, description: "Negiert gegnerische Sub Space Teleporter über eigenen Kolonien (ab v0.5)." },
  { id: "prop_combat_transporters", discipline: "propulsion", level: 45, name: "Combat Transporters", effect: { type: "flavor" }, description: "Garantiert 50% Transporter-Überlebensrate bei Invasionen (ab v0.7)." },
  { id: "prop_inertial_nullifier", discipline: "propulsion", level: 46, name: "Inertial Nullifier", effect: { type: "flavor" }, description: "+4 Manövrierwert, +2 Kampffeld-Bewegung (ab v0.5)." },
  { id: "prop_hyper", discipline: "propulsion", level: 48, name: "Hyper Drives", effect: { type: "travelSpeed", value: 9 }, description: "Reisegeschwindigkeit 9 Parsec/Zug.", module: { kind: "drive", speed: 9 } },
  { id: "prop_displacement", discipline: "propulsion", level: 50, name: "Displacement Device", effect: { type: "flavor" }, description: "33% Chance, dass feindliche Angriffe automatisch verfehlen (ab v0.5)." },

  // ---- Waffen ------------------------------------------------------
  // Planetarbomben (kein Schiffsmodul, wirken erst mit Bodeninvasion v0.7).
  { id: "wpn_laser", discipline: "weapons", level: 1, name: "Lasers", effect: { type: "flavor" }, description: "Basis-Strahlenwaffe, Schaden 1-4.", module: { kind: "weapon", dmgMin: 1, dmgMax: 4, shots: 1 } },
  { id: "wpn_nuclear_missile", discipline: "weapons", level: 1, name: "Nuclear Missile", effect: { type: "flavor" }, description: "Rakete, Schaden 4.", module: { kind: "weapon", dmgMin: 4, dmgMax: 4, shots: 1, isMissile: true } },
  { id: "wpn_nuclear_bomb", discipline: "weapons", level: 1, name: "Nuclear Bomb", effect: { type: "flavor" }, description: "Planetarbombe, Schaden 3-12 (ab v0.7)." },
  { id: "wpn_gatling_laser", discipline: "weapons", level: 4, name: "Gatling Lasers", effect: { type: "flavor" }, description: "Feuert 4x pro Runde, Schaden 1-4.", module: { kind: "weapon", dmgMin: 1, dmgMax: 4, shots: 4 } },
  { id: "wpn_fusion_bomb", discipline: "weapons", level: 7, name: "Fusion Bomb", effect: { type: "flavor" }, description: "Planetarbombe, Schaden 5-20 (ab v0.7)." },
  { id: "wpn_merculite", discipline: "weapons", level: 11, name: "Merculite Missiles", effect: { type: "flavor" }, description: "Rakete, Schaden 10, +2 Angriffsbonus.", module: { kind: "weapon", dmgMin: 10, dmgMax: 10, shots: 1, isMissile: true } },
  { id: "wpn_neutron_blaster", discipline: "weapons", level: 15, name: "Neutron Blaster", effect: { type: "flavor" }, description: "Strahlenwaffe, Schaden 3-12.", module: { kind: "weapon", dmgMin: 3, dmgMax: 12, shots: 1 } },
  { id: "wpn_antimatter_bomb", discipline: "weapons", level: 16, name: "Anti-matter Bomb", effect: { type: "flavor" }, description: "Planetarbombe, Schaden 10-40 (ab v0.7)." },
  { id: "wpn_graviton_beam", discipline: "weapons", level: 17, name: "Graviton Beam", effect: { type: "flavor" }, description: "Streuwaffe, Schaden 1-15, Overkill-Übertrag.", module: { kind: "weapon", dmgMin: 1, dmgMax: 15, shots: 1, streaming: true } },
  { id: "wpn_stinger", discipline: "weapons", level: 18, name: "Stinger Missiles", effect: { type: "flavor" }, description: "Rakete, Schaden 15, +3 Angriffsbonus.", module: { kind: "weapon", dmgMin: 15, dmgMax: 15, shots: 1, isMissile: true } },
  { id: "wpn_hard_beam", discipline: "weapons", level: 19, name: "Hard Beam", effect: { type: "flavor" }, description: "Schaden 8-12, halbiert gegnerische Schilde.", module: { kind: "weapon", dmgMin: 8, dmgMax: 12, shots: 1, shieldHalving: true } },
  { id: "wpn_fusion_beam", discipline: "weapons", level: 20, name: "Fusion Beam", effect: { type: "flavor" }, description: "Strahlenwaffe, Schaden 4-16.", module: { kind: "weapon", dmgMin: 4, dmgMax: 16, shots: 1 } },
  { id: "wpn_ion_stream", discipline: "weapons", level: 21, name: "Ion Stream Proj.", effect: { type: "flavor" }, description: "Schaden = 20% der Ziel-HP.", module: { kind: "weapon", dmgMin: 0, dmgMax: 0, shots: 1, percentTargetHP: 0.2 } },
  { id: "wpn_omega_bomb", discipline: "weapons", level: 22, name: "Omega Bomb", effect: { type: "flavor" }, description: "Planetarbombe, Schaden 20-50 (ab v0.7)." },
  { id: "wpn_antimatter_torpedo", discipline: "weapons", level: 23, name: "Anti-matter Torpedo", effect: { type: "flavor" }, description: "Torpedo, Schaden 30, jede 2. Runde.", module: { kind: "weapon", dmgMin: 30, dmgMax: 30, shots: 1, everyOtherTurn: true } },
  { id: "wpn_megabolt", discipline: "weapons", level: 25, name: "Megabolt Cannon", effect: { type: "flavor" }, description: "Schaden 2-20, +3 Angriffsbonus.", module: { kind: "weapon", dmgMin: 2, dmgMax: 20, shots: 1 } },
  { id: "wpn_phasor", discipline: "weapons", level: 27, name: "Phasor", effect: { type: "flavor" }, description: "Schaden 5-20, Mid-Game-Standard.", module: { kind: "weapon", dmgMin: 5, dmgMax: 20, shots: 1 } },
  { id: "wpn_auto_blaster", discipline: "weapons", level: 28, name: "Auto Blaster", effect: { type: "flavor" }, description: "Schaden 4-16, feuert 3x pro Runde.", module: { kind: "weapon", dmgMin: 4, dmgMax: 16, shots: 3 } },
  { id: "wpn_pulson", discipline: "weapons", level: 29, name: "Pulson Missiles", effect: { type: "flavor" }, description: "Rakete, Schaden 20, +4 Angriffsbonus.", module: { kind: "weapon", dmgMin: 20, dmgMax: 20, shots: 1, isMissile: true } },
  { id: "wpn_tachyon", discipline: "weapons", level: 30, name: "Tachyon Beam", effect: { type: "flavor" }, description: "Schaden 1-25, Overkill-Übertrag.", module: { kind: "weapon", dmgMin: 1, dmgMax: 25, shots: 1, streaming: true } },
  { id: "wpn_gauss", discipline: "weapons", level: 32, name: "Gauss Autocannon", effect: { type: "flavor" }, description: "Schaden 7-10, 4x Feuerrate, halbiert Schilde.", module: { kind: "weapon", dmgMin: 7, dmgMax: 10, shots: 4, shieldHalving: true } },
  { id: "wpn_particle_beam", discipline: "weapons", level: 33, name: "Particle Beam", effect: { type: "flavor" }, description: "Schaden 10-20, halbiert Schilde.", module: { kind: "weapon", dmgMin: 10, dmgMax: 20, shots: 1, shieldHalving: true } },
  { id: "wpn_hercular", discipline: "weapons", level: 34, name: "Hercular Missiles", effect: { type: "flavor" }, description: "Rakete, Schaden 25, +5 Angriffsbonus.", module: { kind: "weapon", dmgMin: 25, dmgMax: 25, shots: 1, isMissile: true } },
  { id: "wpn_plasma_cannon", discipline: "weapons", level: 35, name: "Plasma Cannon", effect: { type: "flavor" }, description: "Schaden 6-30.", module: { kind: "weapon", dmgMin: 6, dmgMax: 30, shots: 1 } },
  { id: "wpn_disruptor", discipline: "weapons", level: 37, name: "Disruptor", effect: { type: "flavor" }, description: "Schaden 10-40, Basisreichweite 2.", module: { kind: "weapon", dmgMin: 10, dmgMax: 40, shots: 1, range: 2 } },
  { id: "wpn_pulse_phasor", discipline: "weapons", level: 38, name: "Pulse Phasor", effect: { type: "flavor" }, description: "Schaden 5-20, feuert 3x pro Runde.", module: { kind: "weapon", dmgMin: 5, dmgMax: 20, shots: 3 } },
  { id: "wpn_neutronium_bomb", discipline: "weapons", level: 39, name: "Neutronium Bomb", effect: { type: "flavor" }, description: "Planetarbombe, Schaden 40-70 (ab v0.7)." },
  { id: "wpn_hellfire", discipline: "weapons", level: 40, name: "Hellfire Torpedo", effect: { type: "flavor" }, description: "4x 25 Schaden, jede 2. Runde.", module: { kind: "weapon", dmgMin: 25, dmgMax: 25, shots: 4, everyOtherTurn: true } },
  { id: "wpn_zeon", discipline: "weapons", level: 41, name: "Zeon Missiles", effect: { type: "flavor" }, description: "Rakete, Schaden 30, +7 Angriffsbonus.", module: { kind: "weapon", dmgMin: 30, dmgMax: 30, shots: 1, isMissile: true } },
  { id: "wpn_proton_torpedo", discipline: "weapons", level: 43, name: "Proton Torpedoes", effect: { type: "flavor" }, description: "Torpedo, Schaden 75, jede 2. Runde.", module: { kind: "weapon", dmgMin: 75, dmgMax: 75, shots: 1, everyOtherTurn: true } },
  { id: "wpn_scatter_pack", discipline: "weapons", level: 44, name: "Scatter Pack X", effect: { type: "flavor" }, description: "10 Sub-Raketen à 15 Schaden.", module: { kind: "weapon", dmgMin: 15, dmgMax: 15, shots: 10, isMissile: true } },
  { id: "wpn_neutron_stream", discipline: "weapons", level: 47, name: "Neutron Stream Proj", effect: { type: "flavor" }, description: "Schaden = 40% der Ziel-HP.", module: { kind: "weapon", dmgMin: 0, dmgMax: 0, shots: 1, percentTargetHP: 0.4 } },
  { id: "wpn_mauler", discipline: "weapons", level: 48, name: "Mauler Device", effect: { type: "flavor" }, description: "Schaden 20-100, ignoriert Schilde fast vollständig.", module: { kind: "weapon", dmgMin: 20, dmgMax: 100, shots: 1, ignoresShields: true } },
  { id: "wpn_plasma_torpedo", discipline: "weapons", level: 50, name: "Plasma Torpedoes", effect: { type: "flavor" }, description: "Schaden 150, feuert alle 2 Runden.", module: { kind: "weapon", dmgMin: 150, dmgMax: 150, shots: 1, everyOtherTurn: true } },
  // Vorläufer-Technologie (ROADMAP v0.10): nicht über die reguläre
  // Zufallsverteilung erforschbar (hidden:true blendet sie aus
  // techsForDiscipline/rollAvailableTechs aus), nur als Beute für die
  // Zerstörung des Guardian of Orion erhältlich, siehe js/orion.js und
  // design-analyse.docx ("transferiert den Death Ray dauerhaft in das
  // Arsenal des Spielers").
  { id: "guardian_death_ray", discipline: "weapons", level: 60, name: "Death Ray", hidden: true, effect: { type: "flavor" }, description: "Vorläufer-Waffe, Schaden 200-1000. Beute für die Zerstörung des Guardian of Orion.", module: { kind: "weapon", dmgMin: 200, dmgMax: 1000, shots: 1 } },
];

export function getTech(id) {
  return TECHS.find((t) => t.id === id);
}

export function techsForDiscipline(disciplineId) {
  return TECHS.filter((t) => t.discipline === disciplineId && !t.hidden).sort((a, b) => a.level - b.level);
}

export function rungOf(level) {
  return Math.ceil(level / 5);
}
