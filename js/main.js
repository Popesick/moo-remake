import { generateGalaxy } from "./galaxyGen.js";
import { gameState, saveGame, loadGame, hasSavedGame } from "./state.js";
import { render, pickSystemAt, fitGalaxyToView } from "./render.js";
import {
  renderSystemPanel,
  updateTopbarInfo,
  openNewGameDialog,
  closeNewGameDialog,
  readNewGameForm,
} from "./ui.js";

const canvas = document.getElementById("galaxy-canvas");

function requestRender() {
  render(canvas, gameState.galaxy, gameState.camera, gameState.selectedSystemId);
}

function selectSystem(system) {
  gameState.selectedSystemId = system ? system.id : null;
  renderSystemPanel(system);
  requestRender();
}

function startNewGalaxy({ sizeId, empireCount, seed }) {
  const galaxy = generateGalaxy({ sizeId, empireCount, seed: seed || undefined });
  gameState.galaxy = galaxy;
  gameState.selectedSystemId = null;
  gameState.camera = fitGalaxyToView(canvas, galaxy);
  updateTopbarInfo(galaxy);
  renderSystemPanel(null);
  requestRender();
  saveGame();
}

function setupCanvasInteractions() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let didDrag = false;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    didDrag = false;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!dragging || !gameState.galaxy) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
    lastX = e.clientX;
    lastY = e.clientY;
    gameState.camera.x -= dx / gameState.camera.zoom;
    gameState.camera.y -= dy / gameState.camera.zoom;
    requestRender();
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  canvas.addEventListener("click", (e) => {
    if (didDrag || !gameState.galaxy) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const system = pickSystemAt(canvas, gameState.galaxy, gameState.camera, x, y);
    selectSystem(system);
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (!gameState.galaxy) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const before = {
        x: mx / gameState.camera.zoom + gameState.camera.x,
        y: my / gameState.camera.zoom + gameState.camera.y,
      };
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      gameState.camera.zoom = Math.min(4, Math.max(0.15, gameState.camera.zoom * factor));
      gameState.camera.x = before.x - mx / gameState.camera.zoom;
      gameState.camera.y = before.y - my / gameState.camera.zoom;
      requestRender();
    },
    { passive: false }
  );

  window.addEventListener("resize", requestRender);
}

function setupDialogAndButtons() {
  document.getElementById("btn-new-game").addEventListener("click", openNewGameDialog);
  document.getElementById("ng-cancel").addEventListener("click", closeNewGameDialog);
  document.getElementById("ng-confirm").addEventListener("click", () => {
    const form = readNewGameForm();
    closeNewGameDialog();
    startNewGalaxy(form);
  });

  document.getElementById("btn-save").addEventListener("click", () => {
    const ok = saveGame();
    flashTopbar(ok ? "Gespeichert." : "Keine Galaxie zum Speichern.");
  });

  document.getElementById("btn-load").addEventListener("click", () => {
    const ok = loadGame();
    if (ok) {
      updateTopbarInfo(gameState.galaxy);
      renderSystemPanel(null);
      requestRender();
    } else {
      flashTopbar("Kein Speicherstand gefunden.");
    }
  });
}

let flashTimeout = null;
function flashTopbar(message) {
  const el = document.getElementById("topbar-info");
  const previous = el.textContent;
  el.textContent = message;
  clearTimeout(flashTimeout);
  flashTimeout = setTimeout(() => {
    updateTopbarInfo(gameState.galaxy);
  }, 2000);
}

function init() {
  setupCanvasInteractions();
  setupDialogAndButtons();

  if (hasSavedGame() && loadGame()) {
    if (!gameState.camera || !gameState.camera.zoom) {
      gameState.camera = fitGalaxyToView(canvas, gameState.galaxy);
    }
    updateTopbarInfo(gameState.galaxy);
    renderSystemPanel(null);
    requestRender();
  } else {
    startNewGalaxy({ sizeId: "medium", empireCount: 3, seed: "" });
  }
}

// Ein Frame warten, damit Layout/CSSOM sicher fertig sind, bevor wir die
// Canvas-Größe für fitGalaxyToView auslesen (clientWidth/Height wäre sonst
// beim allerersten Aufruf u.U. noch 0).
requestAnimationFrame(init);
