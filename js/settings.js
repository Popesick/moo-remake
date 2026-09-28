// Persistente Client-Einstellungen (ROADMAP v0.21): Musik/Soundeffekte
// (an/aus + Lautstärke) und der Schalter für interaktive Kämpfe leben
// bewusst in einem EIGENEN localStorage-Eintrag statt im Spielstand
// (js/state.js) – es sind Präferenzen des Spielers als Person, nicht
// Eigenschaften einer einzelnen Partie, und sollen daher auch über "Neue
// Galaxie" und verschiedene Spielstände hinweg erhalten bleiben.
const STORAGE_KEY = "moo-remake:settings";

const DEFAULT_SETTINGS = {
  interactiveCombat: false,
  musicEnabled: true,
  musicVolume: 0.6,
  sfxEnabled: true,
  sfxVolume: 0.8,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.warn("Einstellungen konnten nicht geladen werden, verwende Standardwerte.", err);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.warn("Einstellungen konnten nicht gespeichert werden.", err);
    return false;
  }
}
