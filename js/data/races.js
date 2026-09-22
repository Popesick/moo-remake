// Die 10 spielbaren Fraktionen aus der Analyse ("Asymmetrisches
// Fraktionsdesign"). In v0.2 sind nur Name/Farbe/Kurzbeschreibung aktiv;
// die tatsächlichen Regelbrüche (siehe ROADMAP v0.6) werden erst mit den
// KI-Verhaltensmatrizen verdrahtet. Der Spieler spielt vorerst immer die
// Menschen (Race-Auswahl ist ein Kandidat für einen späteren Release).
export const RACES = [
  { id: "human", name: "Humans", color: "#5b9dff", blurb: "+20% Produktion durch interstellaren Handel." },
  { id: "alkari", name: "Alkari", color: "#7fe3ff", blurb: "+3 Manövrierfähigkeit im Raumkampf." },
  { id: "bulrathi", name: "Bulrathi", color: "#c9694a", blurb: "+20 auf Bodenkampf-Würfe." },
  { id: "darlok", name: "Darlok", color: "#8a6bd6", blurb: "Spionage- und Sabotage-Experten." },
  { id: "klackon", name: "Klackons", color: "#e0c23a", blurb: "Basisproduktion pro Bevölkerungseinheit verdoppelt." },
  { id: "meklar", name: "Meklar", color: "#8fa0c9", blurb: "+2 Robotic Controls." },
  { id: "mrrshan", name: "Mrrshan", color: "#e0733a", blurb: "+4 Angriff im Raumkampf." },
  { id: "psilon", name: "Psilons", color: "#63e6a0", blurb: "+50% Forschungsleistung." },
  { id: "sakkra", name: "Sakkra", color: "#4fbf6a", blurb: "+100% Bevölkerungswachstum." },
  { id: "silicoid", name: "Silicoids", color: "#a8a8a8", blurb: "Immun gegen Umweltverschmutzung." },
];

export function getRace(id) {
  return RACES.find((r) => r.id === id);
}
