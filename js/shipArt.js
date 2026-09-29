// Schiffsgrafiken (ROADMAP v0.29, Nutzerwunsch): pro Rasse und Rumpfgröße
// ein über ChatGPT generiertes Bild mit transparentem Hintergrund (siehe
// docs/ROADMAP.md "Grafik-Pipeline"), unter assets/images/ships/ abgelegt.
// Ausrüstung (Waffen/Panzerung/Schild/Antrieb) verändert die Grafik
// bewusst nicht, nur Rasse und Rumpfklasse bestimmen das Bild – dieselbe
// Grafik wird im Schiffsdesigner, im interaktiven Kampf-Grid und auf der
// Galaxiekarte (dort nach Rumpfklasse skaliert) verwendet.
export function shipArtPath(raceId, hullId) {
  return `assets/images/ships/ship_${raceId}_${hullId}.png`;
}

export const GUARDIAN_ART_PATH = "assets/images/ships/ship_guardian.png";
