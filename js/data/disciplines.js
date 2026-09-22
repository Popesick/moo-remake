// Die sechs Forschungsdisziplinen aus der Analyse ("Technologischer
// Fortschritt, blinde Forschungsbäume und Miniaturisierung").
export const DISCIPLINES = [
  { id: "computer", name: "Computer" },
  { id: "construction", name: "Konstruktion" },
  { id: "forcefields", name: "Kraftfelder" },
  { id: "planetology", name: "Planetologie" },
  { id: "propulsion", name: "Antrieb" },
  { id: "weapons", name: "Waffen" },
];

export function getDiscipline(id) {
  return DISCIPLINES.find((d) => d.id === id);
}
