// Planetengröße bestimmt die maximale Bevölkerungskapazität (vor
// Habitabilitäts- und Terraforming-Modifikatoren, siehe v0.2).
export const PLANET_SIZES = [
  { id: "tiny", name: "Tiny", basePopCapacity: 20 },
  { id: "small", name: "Small", basePopCapacity: 40 },
  { id: "medium", name: "Medium", basePopCapacity: 60 },
  { id: "large", name: "Large", basePopCapacity: 80 },
  { id: "huge", name: "Huge", basePopCapacity: 100 },
];

export const PLANET_SIZE_WEIGHTS = [
  { id: "tiny", weight: 15 },
  { id: "small", weight: 25 },
  { id: "medium", weight: 30 },
  { id: "large", weight: 20 },
  { id: "huge", weight: 10 },
];

export function getPlanetSize(id) {
  return PLANET_SIZES.find((s) => s.id === id);
}
