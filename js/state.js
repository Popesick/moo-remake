const STORAGE_KEY = "moo-remake:savegame";

export const gameState = {
  galaxy: null,
  selectedSystemId: null,
  camera: { x: 0, y: 0, zoom: 1 },
};

export function saveGame() {
  if (!gameState.galaxy) return false;
  const payload = {
    version: 1,
    savedAt: Date.now(),
    galaxy: gameState.galaxy,
    camera: gameState.camera,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return true;
}

export function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw);
    gameState.galaxy = payload.galaxy;
    gameState.camera = payload.camera ?? { x: 0, y: 0, zoom: 1 };
    gameState.selectedSystemId = null;
    return true;
  } catch (err) {
    console.error("Speicherstand konnte nicht geladen werden", err);
    return false;
  }
}

export function hasSavedGame() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
