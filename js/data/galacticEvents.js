// Galaktische Zufallsereignisse (ROADMAP v0.10), siehe design-analyse.docx
// ("Zufällige Events wie der Angriff einer gigantischen Weltraum-Amöbe,
// das Erscheinen eines kristallinen Energiewesens, Kometen auf
// Kollisionskurs oder unvorhergesehene Supernovae zwingen Spieler, ihre
// Expansion temporär für die planetare Verteidigung zu pausieren").
// *Vereinfacht:* drei statt vier Ereignistypen (Space Amoeba und Space
// Crystal sind zu einem generischen "Weltraum-Monster" zusammengefasst,
// siehe js/events.js), keine Events vor Runde EVENT_MIN_TURN, um die
// Aufbauphase nicht zu stören.
export const EVENT_CHANCE_PER_TURN = 0.06;
export const EVENT_MIN_TURN = 15;

export const COMET_POPULATION_LOSS_PCT = 0.2;
export const COMET_FACTORY_LOSS_PCT = 0.15;

export const SUPERNOVA_POPULATION_LOSS_PCT = 0.6;
export const SUPERNOVA_FACTORY_LOSS_PCT = 0.5;

// Pulsar-Waffe mit 1-1000 Schaden (extreme Varianz, Schilde nahezu
// nutzlos) laut design-analyse.docx explizit dem Space Crystal zugeordnet.
export const SPACE_MONSTER_STATS = {
  name: "Weltraum-Monster",
  hp: 800,
  shield: 3,
  speed: 3,
  attackRating: 20,
  weapons: [
    {
      tech: {
        id: "event_pulsar",
        name: "Pulsar-Strahl",
        module: { kind: "weapon", dmgMin: 1, dmgMax: 1000, shots: 1 },
      },
      count: 1,
    },
  ],
};
export const SPACE_MONSTER_BOMBARD_POPULATION_LOSS_PCT = 0.25;

// Relative Gewichtung bei der Ereigniswahl (müssen nicht auf 100 summieren).
export const EVENT_WEIGHTS = { comet: 40, supernova: 15, spaceMonster: 45 };
