// Sterntypen sind in v0.1 primär kosmetisch (Farbe auf der Karte). Spätere
// Releases können sie an Planetenanzahl/-qualität koppeln.
export const STAR_TYPES = [
  { id: "blue", name: "Blauer Riese", color: "#9db8ff" },
  { id: "white", name: "Weißer Stern", color: "#f2f4ff" },
  { id: "yellow", name: "Gelber Stern", color: "#ffe08a" },
  { id: "orange", name: "Oranger Stern", color: "#ffb15c" },
  { id: "red", name: "Roter Zwerg", color: "#ff7b6b" },
  { id: "brown", name: "Brauner Zwerg", color: "#a9846b" },
];

export const STAR_TYPE_WEIGHTS = [
  { id: "blue", weight: 6 },
  { id: "white", weight: 10 },
  { id: "yellow", weight: 24 },
  { id: "orange", weight: 24 },
  { id: "red", weight: 28 },
  { id: "brown", weight: 8 },
];

export function getStarType(id) {
  return STAR_TYPES.find((s) => s.id === id);
}
