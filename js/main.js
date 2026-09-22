import { generateGalaxy, findSystem } from "./galaxyGen.js";
import { gameState, saveGame, loadGame, hasSavedGame } from "./state.js";
import { render, pickSystemAt, fitGalaxyToView } from "./render.js";
import { simulateTurn, colonizePlanet, computePlanetProduction } from "./economy.js";
import { normalizeSliders } from "./data/economy.js";
import { normalizeAllocation, selectResearchTarget } from "./research.js";
import { addShipDesign, scrapShipDesign } from "./shipDesign.js";
import { sendFleet, splitStack } from "./fleets.js";
import {
  renderSystemPanel,
  updateTopbarInfo,
  openNewGameDialog,
  closeNewGameDialog,
  readNewGameForm,
  openResearchDialog,
  closeResearchDialog,
  renderResearchDialog,
} from "./ui.js";
import { renderShipDesignDialog, openShipDesignDialog, closeShipDesignDialog } from "./shipDesignUI.js";

const canvas = document.getElementById("galaxy-canvas");

function getEmpire(id) {
  return gameState.galaxy.empires.find((e) => e.id === id);
}

function getPlayerEmpire() {
  return gameState.galaxy.empires.find((e) => e.isPlayer);
}

const panelCallbacks = {
  onSliderChange(systemId, planetId, key, value) {
    const system = findSystem(gameState.galaxy, systemId);
    const planet = system?.planets.find((p) => p.id === planetId);
    if (!planet) return;
    planet.sliders[key] = value;
    planet.sliders = normalizeSliders(planet.sliders);
    planet.lastProduction = computePlanetProduction(planet, getEmpire(planet.colonizedBy));
    refreshSidePanel();
  },
  onColonize(systemId, planetId) {
    const playerEmpire = gameState.galaxy.empires.find((e) => e.isPlayer);
    const result = colonizePlanet(gameState.galaxy, systemId, planetId, playerEmpire.id);
    if (!result.ok) {
      flashTopbar(result.reason);
      return;
    }
    updateTopbarInfo(gameState.galaxy);
    refreshSidePanel();
    requestRender();
    saveGame();
  },
  onProductionChange(systemId, planetId, target) {
    const system = findSystem(gameState.galaxy, systemId);
    const planet = system?.planets.find((p) => p.id === planetId);
    if (!planet) return;
    planet.productionTarget = target;
    planet.shipCarry = 0;
    refreshSidePanel();
    saveGame();
  },
  onSplitStack(fleetId, designId, count) {
    const result = splitStack(gameState.galaxy, fleetId, designId, count);
    if (!result.ok) {
      flashTopbar(result.reason);
      return;
    }
    refreshSidePanel();
    saveGame();
  },
  onArmFleetMove(fleetId) {
    gameState.pendingFleetMove = fleetId;
    flashTopbar("Zielsystem auf der Karte anklicken …");
  },
};

function requestRender() {
  render(canvas, gameState.galaxy, gameState.camera, gameState.selectedSystemId);
}

function refreshSidePanel() {
  const system = gameState.selectedSystemId ? findSystem(gameState.galaxy, gameState.selectedSystemId) : null;
  renderSystemPanel(system, gameState.galaxy, panelCallbacks);
}

function selectSystem(system) {
  gameState.selectedSystemId = system ? system.id : null;
  refreshSidePanel();
  requestRender();
}

function startNewGalaxy({ sizeId, empireCount, difficultyId, seed }) {
  const galaxy = generateGalaxy({ sizeId, empireCount, difficultyId, seed: seed || undefined });
  gameState.galaxy = galaxy;
  gameState.selectedSystemId = null;
  gameState.camera = fitGalaxyToView(canvas, galaxy);
  updateTopbarInfo(galaxy);
  refreshSidePanel();
  requestRender();
  saveGame();
}

const researchCallbacks = {
  onAllocationChange(disciplineId, value) {
    const player = getPlayerEmpire();
    player.research.allocation[disciplineId] = value;
    player.research.allocation = normalizeAllocation(player.research.allocation);
    renderResearchDialog(gameState.galaxy, researchCallbacks);
  },
  onSelectTarget(disciplineId, techId) {
    const player = getPlayerEmpire();
    selectResearchTarget(player, disciplineId, techId);
    renderResearchDialog(gameState.galaxy, researchCallbacks);
    saveGame();
  },
};

const shipDesignCallbacks = {
  onCreateDesign(design) {
    const player = getPlayerEmpire();
    const result = addShipDesign(player, design);
    if (result.ok) {
      updateTopbarInfo(gameState.galaxy);
      saveGame();
    }
    return result;
  },
  onScrap(designId) {
    const player = getPlayerEmpire();
    scrapShipDesign(player, designId);
    renderShipDesignDialog(gameState.galaxy, shipDesignCallbacks);
    saveGame();
  },
  onError(reason) {
    flashTopbar(reason);
  },
};

function endTurn() {
  if (!gameState.galaxy) return;
  const { breakthroughsByEmpire, arrivals } = simulateTurn(gameState.galaxy);
  updateTopbarInfo(gameState.galaxy);
  refreshSidePanel();
  requestRender();
  saveGame();

  const playerEmpire = getPlayerEmpire();
  const playerBreakthroughs = breakthroughsByEmpire.get(playerEmpire.id);
  if (playerBreakthroughs?.length) {
    flashTopbar(`Durchbruch: ${playerBreakthroughs.map((t) => t.name).join(", ")}`);
    return;
  }
  const playerArrivals = arrivals.filter((f) => f.ownerEmpireId === playerEmpire.id);
  if (playerArrivals.length > 0) {
    const system = findSystem(gameState.galaxy, playerArrivals[0].systemId);
    flashTopbar(`Flotte in ${system?.name ?? "einem System"} angekommen.`);
  }
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

    if (gameState.pendingFleetMove) {
      const fleetId = gameState.pendingFleetMove;
      gameState.pendingFleetMove = null;
      if (!system) {
        flashTopbar("Kein Zielsystem ausgewählt.");
        return;
      }
      const player = getPlayerEmpire();
      const result = sendFleet(gameState.galaxy, fleetId, system.id, player.travelSpeedParsec);
      if (!result.ok) {
        flashTopbar(result.reason);
      } else {
        flashTopbar(`Flotte unterwegs nach ${system.name}.`);
        refreshSidePanel();
        saveGame();
      }
      return;
    }

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

  document.getElementById("btn-end-turn").addEventListener("click", endTurn);

  document.getElementById("btn-research").addEventListener("click", () => {
    if (!gameState.galaxy) return;
    renderResearchDialog(gameState.galaxy, researchCallbacks);
    openResearchDialog();
  });
  document.getElementById("research-close").addEventListener("click", closeResearchDialog);

  document.getElementById("btn-shipdesign").addEventListener("click", () => {
    if (!gameState.galaxy) return;
    renderShipDesignDialog(gameState.galaxy, shipDesignCallbacks);
    openShipDesignDialog();
  });
  document.getElementById("shipdesign-close").addEventListener("click", closeShipDesignDialog);

  document.getElementById("btn-save").addEventListener("click", () => {
    const ok = saveGame();
    flashTopbar(ok ? "Gespeichert." : "Keine Galaxie zum Speichern.");
  });

  document.getElementById("btn-load").addEventListener("click", () => {
    const ok = loadGame();
    if (ok) {
      updateTopbarInfo(gameState.galaxy);
      refreshSidePanel();
      requestRender();
    } else {
      flashTopbar("Kein Speicherstand gefunden.");
    }
  });
}

let flashTimeout = null;
function flashTopbar(message) {
  const el = document.getElementById("topbar-info");
  el.textContent = message;
  clearTimeout(flashTimeout);
  flashTimeout = setTimeout(() => {
    updateTopbarInfo(gameState.galaxy);
  }, 2500);
}

function init() {
  setupCanvasInteractions();
  setupDialogAndButtons();

  if (hasSavedGame() && loadGame()) {
    if (!gameState.camera || !gameState.camera.zoom) {
      gameState.camera = fitGalaxyToView(canvas, gameState.galaxy);
    }
    updateTopbarInfo(gameState.galaxy);
    refreshSidePanel();
    requestRender();
  } else {
    startNewGalaxy({ sizeId: "medium", empireCount: 3, seed: "" });
  }
}

// Ein Frame warten, damit Layout/CSSOM sicher fertig sind, bevor wir die
// Canvas-Größe für fitGalaxyToView auslesen (clientWidth/Height wäre sonst
// beim allerersten Aufruf u.U. noch 0).
requestAnimationFrame(init);
