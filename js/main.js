import { generateGalaxy, findSystem } from "./galaxyGen.js";
import { gameState, saveGame, loadGame, hasSavedGame } from "./state.js";
import { loadSettings, saveSettings } from "./settings.js";
import { initAudio, setMusicEnabled, setSfxEnabled, setMusicVolume, setSfxVolume, playMusic, playSfx } from "./audio.js";
import { render, pickSystemAt, fitGalaxyToView, centerCameraOnPoint } from "./render.js";
import { simulateTurn, orderColonization, computePlanetProduction, applyBattleResult, resolvePendingBattleAuto } from "./economy.js";
import { createBattle, moveUnitTo, attackWithUnit, endPlayerPhase, retreat, finalizeBattleResult } from "./hexcombat.js";
import { applyInteractiveGuardianResult } from "./orion.js";
import { applyInteractiveSpaceMonsterResult } from "./events.js";
import { renderHexCombat, resetHexCombatSelection } from "./renderHexCombat.js";
import { normalizeSliders, normalizeSlidersWithLocks } from "./data/economy.js";
import { normalizeAllocation, selectResearchTarget } from "./research.js";
import { addShipDesign, scrapShipDesign } from "./shipDesign.js";
import { sendFleet, splitFleetMulti, mergeFleets } from "./fleets.js";
import { DEFAULT_TRAVEL_RANGE_PARSEC } from "./data/logistics.js";
import {
  getRelation,
  setRelationStatus,
  isAtWar,
  proposeTradeAgreement,
  cancelTradeAgreement,
  getGrudge,
  addGrudge,
  BROKEN_TRADE_GRUDGE,
} from "./diplomacy.js";
import { resolveInvasion, applyInvasionResult, applyBioAttack, maxInvasionTroops } from "./invasion.js";
import { attemptSpyAction } from "./espionage.js";
import { getPersonality } from "./data/aiPersonality.js";
import { aiAcceptsTradeOffer } from "./ai.js";
import { resolveCouncilVote } from "./council.js";
import { computeScore } from "./victory.js";
import { recordHallOfFameEntry, loadHallOfFame } from "./hallOfFame.js";
import { snapshotPlayerState, computeTurnEvents } from "./turnEvents.js";
import {
  renderSystemPanel,
  updateTopbarInfo,
  openNewGameDialog,
  closeNewGameDialog,
  readNewGameForm,
  openResearchDialog,
  closeResearchDialog,
  renderResearchDialog,
  renderBattleReports,
  openBattleDialog,
  closeBattleDialog,
  renderDiplomacyDialog,
  openDiplomacyDialog,
  closeDiplomacyDialog,
  renderGameEnd,
  openGameEndDialog,
  closeGameEndDialog,
  renderCouncilDialog,
  openCouncilDialog,
  closeCouncilDialog,
  renderHallOfFame,
  openHallOfFameDialog,
  closeHallOfFameDialog,
  openHexCombatDialog,
  closeHexCombatDialog,
  renderStaticButtons,
  renderRaceSelector,
  openMenuDialog,
  closeMenuDialog,
  openSettingsDialog,
  closeSettingsDialog,
  renderSettingsDialog,
  renderEventPanel,
  renderEmpireDiscoveredDialog,
  openEmpireDiscoveredDialog,
  closeEmpireDiscoveredDialog,
  renderPlanetsDialog,
  openPlanetsDialog,
  closePlanetsDialog,
  renderSplitFleetDialog,
  openSplitFleetDialog,
  closeSplitFleetDialog,
} from "./ui.js";
import { renderShipDesignDialog, openShipDesignDialog, closeShipDesignDialog } from "./shipDesignUI.js";

const canvas = document.getElementById("galaxy-canvas");

// Persistente Client-Einstellungen (ROADMAP v0.21, js/settings.js) statt
// eines Häkchens verstreut in der Kopfleiste – interaktive Kämpfe/Musik/
// Soundeffekte gelten über alle Spielstände hinweg. currentSettings ist die
// im Speicher gehaltene Kopie, die bei jeder Änderung im Einstellungen-
// Dialog sofort übernommen und persistiert wird.
let currentSettings = loadSettings();

// Wendet den aktuellen Interaktive-Kämpfe-Schalter auf das Spielerimperium
// an, sobald eine Galaxie geladen/gestartet wird – die Einstellung ist die
// Quelle der Wahrheit, nicht das, was zuletzt in diesem Spielstand
// gespeichert war.
function applySettingsToPlayer() {
  const player = getPlayerEmpire();
  if (player) player.interactiveCombat = currentSettings.interactiveCombat;
}

function getEmpire(id) {
  return gameState.galaxy.empires.find((e) => e.id === id);
}

function getPlayerEmpire() {
  return gameState.galaxy.empires.find((e) => e.isPlayer);
}

// Öffnet sich sowohl aus der Systemseitenleiste als auch der Planeten-
// Übersicht (ROADMAP v0.24) auf denselben Planeten – beide müssen nach
// einer Regler-/Sperren-Änderung aktualisiert werden, egal welche der
// beiden Ansichten die Änderung ausgelöst hat.
function refreshPlanetViews() {
  refreshSidePanel();
  if (!document.getElementById("planets-dialog").hidden) {
    renderPlanetsDialog(gameState.galaxy, panelCallbacks);
  }
}

const panelCallbacks = {
  onSliderChange(systemId, planetId, key, value) {
    const system = findSystem(gameState.galaxy, systemId);
    const planet = system?.planets.find((p) => p.id === planetId);
    if (!planet) return;
    planet.sliders = normalizeSlidersWithLocks(planet.sliders, planet.sliderLocks, key, value);
    planet.lastProduction = computePlanetProduction(planet, getEmpire(planet.colonizedBy));
    refreshPlanetViews();
  },
  onToggleSliderLock(systemId, planetId, key) {
    const system = findSystem(gameState.galaxy, systemId);
    const planet = system?.planets.find((p) => p.id === planetId);
    if (!planet) return;
    if (!planet.sliderLocks) planet.sliderLocks = {};
    planet.sliderLocks[key] = !planet.sliderLocks[key];
    refreshPlanetViews();
    saveGame();
  },
  onColonize(systemId, planetId) {
    const playerEmpire = gameState.galaxy.empires.find((e) => e.isPlayer);
    const result = orderColonization(gameState.galaxy, systemId, planetId, playerEmpire.id);
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
  onOpenSplitFleet(fleetId) {
    const fleet = gameState.galaxy.fleets.find((f) => f.id === fleetId);
    if (!fleet) return;
    renderSplitFleetDialog(fleet, getPlayerEmpire(), splitFleetCallbacks);
    openSplitFleetDialog();
  },
  onMergeFleets(fleetIds) {
    const result = mergeFleets(gameState.galaxy, fleetIds);
    if (!result.ok) {
      flashTopbar(result.reason);
      return;
    }
    refreshSidePanel();
    saveGame();
    flashTopbar("Flotten zusammengelegt.");
  },
  onArmFleetMove(fleetId) {
    // Ein manueller Zielbefehl beendet die Auto-Erkundung dieser Flotte,
    // damit der nächste Auto-Erkundungs-Zug den manuellen Befehl nicht
    // sofort wieder überschreibt.
    const fleet = gameState.galaxy.fleets.find((f) => f.id === fleetId);
    if (fleet) fleet.autoExplore = false;
    gameState.pendingFleetMove = fleetId;
    flashTopbar("Zielsystem auf der Karte anklicken … (erreichbare Systeme markiert)");
    requestRender();
  },
  onToggleAutoExplore(fleetId) {
    const fleet = gameState.galaxy.fleets.find((f) => f.id === fleetId);
    if (!fleet) return;
    fleet.autoExplore = !fleet.autoExplore;
    refreshSidePanel();
    saveGame();
  },
  onInvade(systemId, planetId, troopsRequested) {
    const galaxy = gameState.galaxy;
    const system = findSystem(galaxy, systemId);
    const planet = system?.planets.find((p) => p.id === planetId);
    const attacker = getPlayerEmpire();
    const defender = getEmpire(planet?.colonizedBy);
    if (!planet || !defender || !isAtWar(galaxy, attacker.id, defender.id)) return;

    // Truppen entstammen dem bevölkerungsreichsten eigenen Planeten (siehe
    // design-analyse.docx: 1 Soldat = 1 entvölkerter Bürger des Quellplaneten).
    const ownedPlanets = galaxy.systems
      .flatMap((s) => s.planets)
      .filter((p) => p.colonizedBy === attacker.id)
      .sort((a, b) => b.population - a.population);
    const source = ownedPlanets[0];
    if (!source) {
      flashTopbar("Kein eigener Planet zur Truppenaushebung verfügbar.");
      return;
    }
    const troops = Math.max(1, Math.min(troopsRequested, maxInvasionTroops(attacker, source)));
    source.population -= troops;

    const result = resolveInvasion(attacker, defender, planet, troops);
    applyInvasionResult(galaxy, attacker.id, planet, result);

    updateTopbarInfo(galaxy);
    refreshSidePanel();
    requestRender();
    saveGame();
    flashTopbar(result.log[0]);
  },
  onBioAttack(systemId, planetId) {
    const galaxy = gameState.galaxy;
    const system = findSystem(galaxy, systemId);
    const planet = system?.planets.find((p) => p.id === planetId);
    const attacker = getPlayerEmpire();
    const defender = getEmpire(planet?.colonizedBy);
    if (!planet || !defender || !isAtWar(galaxy, attacker.id, defender.id)) return;
    if (!window.confirm(`Bioangriff auf ${system.name} ${planet.name} einsetzen? Dies tötet Zivilisten und verschlechtert die Beziehungen zu allen anderen Imperien drastisch.`)) {
      return;
    }

    const result = applyBioAttack(galaxy, attacker, defender, planet);
    updateTopbarInfo(galaxy);
    refreshSidePanel();
    requestRender();
    saveGame();
    flashTopbar(
      `Bioangriff: ${result.casualties.toFixed(1)} Mio. Opfer${result.depopulated ? ", Planet entvölkert" : ""}${result.newWars > 0 ? ` · ${result.newWars} neue Kriegserklärung(en)` : ""}.`
    );
  },
};

const splitFleetCallbacks = {
  onConfirmSplitFleet(fleetId, transfers) {
    closeSplitFleetDialog();
    const hasAny = Object.values(transfers).some((n) => n > 0);
    if (!hasAny) return;
    const result = splitFleetMulti(gameState.galaxy, fleetId, transfers);
    if (!result.ok) {
      flashTopbar(result.reason);
      return;
    }
    refreshSidePanel();
    saveGame();
    flashTopbar("Flotte aufgeteilt.");
  },
};

function requestRender() {
  const rangeOverlay = gameState.pendingFleetMove
    ? { empireId: getPlayerEmpire()?.id, rangeParsec: getPlayerEmpire()?.travelRangeParsec ?? DEFAULT_TRAVEL_RANGE_PARSEC }
    : null;
  render(canvas, gameState.galaxy, gameState.camera, gameState.selectedSystemId, rangeOverlay);
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

// Zentriert die Kamera auf ein System und wählt es zugleich in der
// Seitenleiste aus – Basis für "Heimatsystem" sowie die Sprung-Aktionen des
// Rundenereignis-Panels (ROADMAP v0.24: Feind gesichtet/Planet besetzt/
// System verloren).
function jumpToSystem(systemId) {
  const system = findSystem(gameState.galaxy, systemId);
  if (!system) {
    flashTopbar("System nicht gefunden.");
    return;
  }
  gameState.camera.zoom = Math.max(gameState.camera.zoom, 0.9);
  centerCameraOnPoint(canvas, gameState.camera, system.x, system.y);
  selectSystem(system);
}

// Springt zum Heimatsystem des Spielers (behebt "Heimatsystem nicht
// auffindbar" nach dem Verschieben/Zoomen der Karte).
function goToHomeSystem() {
  if (!gameState.galaxy) return;
  const player = getPlayerEmpire();
  const homeSystem = gameState.galaxy.systems.find((s) => s.homeworldEmpireId === player.id);
  if (!homeSystem) {
    flashTopbar("Heimatsystem nicht gefunden.");
    return;
  }
  jumpToSystem(homeSystem.id);
}

function startNewGalaxy({ sizeId, empireCount, difficultyId, seed, raceId }) {
  const galaxy = generateGalaxy({ sizeId, empireCount, difficultyId, seed: seed || undefined, raceId });
  gameState.galaxy = galaxy;
  gameState.selectedSystemId = null;
  gameState.camera = fitGalaxyToView(canvas, galaxy);
  applySettingsToPlayer();
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
      // Das Produktionsziel-Dropdown der Seitenleiste (js/ui.js
      // buildOwnedPlanetCard) listet player.shipDesigns – ohne diesen
      // Refresh war ein frisch erstelltes Design erst nach dem nächsten,
      // aus anderem Grund ausgelösten Seitenleisten-Rendering wählbar (z.B.
      // erst in der Folgerunde), obwohl es sofort einsatzbereit ist.
      refreshSidePanel();
      saveGame();
    }
    return result;
  },
  onScrap(designId) {
    const player = getPlayerEmpire();
    const result = scrapShipDesign(player, designId, gameState.galaxy);
    if (!result.ok) {
      shipDesignCallbacks.onError(result.reason);
      return;
    }
    renderShipDesignDialog(gameState.galaxy, shipDesignCallbacks);
    refreshSidePanel();
    saveGame();
  },
  onError(reason) {
    flashTopbar(reason);
  },
};

const diplomacyCallbacks = {
  getRelation(otherEmpireId) {
    const player = getPlayerEmpire();
    return getRelation(gameState.galaxy, player.id, otherEmpireId);
  },
  onDeclareWar(otherEmpireId) {
    const player = getPlayerEmpire();
    setRelationStatus(gameState.galaxy, player.id, otherEmpireId, "war");
    renderDiplomacyDialog(gameState.galaxy, diplomacyCallbacks);
    saveGame();
  },
  onProposePeace(otherEmpireId) {
    const player = getPlayerEmpire();
    const other = getEmpire(otherEmpireId);
    const personality = getPersonality(other.personalityId);
    const grudge = getGrudge(gameState.galaxy, player.id, otherEmpireId);
    // Diplomatisches Gedächtnis (ROADMAP v0.12): jeder Groll-Punkt aus
    // vergangenen Kriegserklärungen/gebrochenen Handelsabkommen senkt die
    // Friedensbereitschaft der KI zusätzlich zur Persönlichkeit.
    const acceptChance = (personality.erratic ? 0.5 : 1 - personality.warBias) - grudge * 0.01;
    if (Math.random() < acceptChance) {
      setRelationStatus(gameState.galaxy, player.id, otherEmpireId, "peace");
      flashTopbar(`${other.name} nimmt das Friedensangebot an.`);
    } else {
      flashTopbar(`${other.name} lehnt den Frieden ab.`);
    }
    renderDiplomacyDialog(gameState.galaxy, diplomacyCallbacks);
    saveGame();
  },
  onEspionageAllocationChange(value) {
    const player = getPlayerEmpire();
    player.espionageAllocationPct = value;
    renderDiplomacyDialog(gameState.galaxy, diplomacyCallbacks);
    saveGame();
  },
  onSpyAction(otherEmpireId, actionId, useFraming) {
    const player = getPlayerEmpire();
    const other = getEmpire(otherEmpireId);
    const result = attemptSpyAction(gameState.galaxy, player, other, actionId, useFraming);
    renderDiplomacyDialog(gameState.galaxy, diplomacyCallbacks);
    updateTopbarInfo(gameState.galaxy);
    refreshSidePanel();
    saveGame();
    flashTopbar(result.log[result.log.length - 1]);
  },
  onProposeTrade(otherEmpireId) {
    const player = getPlayerEmpire();
    const other = getEmpire(otherEmpireId);
    const grudge = getGrudge(gameState.galaxy, player.id, otherEmpireId);
    if (aiAcceptsTradeOffer(other, grudge)) {
      proposeTradeAgreement(gameState.galaxy, player.id, otherEmpireId);
      flashTopbar(`${other.name} nimmt das Handelsabkommen an.`);
    } else {
      flashTopbar(`${other.name} lehnt das Handelsabkommen ab.`);
    }
    renderDiplomacyDialog(gameState.galaxy, diplomacyCallbacks);
    saveGame();
  },
  onCancelTrade(otherEmpireId) {
    const player = getPlayerEmpire();
    cancelTradeAgreement(gameState.galaxy, player.id, otherEmpireId);
    // Einseitiges Aufkündigen eines laufenden Handelsabkommens hinterlässt
    // Groll (diplomatisches Gedächtnis, ROADMAP v0.12) – anders als die
    // automatische Beendigung durch eine Kriegserklärung, die bereits über
    // WAR_DECLARATION_GRUDGE abgedeckt ist.
    addGrudge(gameState.galaxy, player.id, otherEmpireId, BROKEN_TRADE_GRUDGE);
    renderDiplomacyDialog(gameState.galaxy, diplomacyCallbacks);
    saveGame();
  },
};

// Rundenereignis-Panel (ROADMAP v0.24, Nutzer-Feedback): entfernt ein
// einzelnes Ereignis aus der Liste (nach Ansehen/Springen oder per X) und
// rendert das Panel neu.
function dismissEvent(eventId) {
  gameState.turnEvents = (gameState.turnEvents ?? []).filter((e) => e.id !== eventId);
  renderEventPanel(gameState.turnEvents, eventCallbacks);
}

const eventCallbacks = {
  onNewEmpire(event) {
    const empire = getEmpire(event.empireId);
    gameState.pendingDiscoveredEmpireId = event.empireId;
    renderEmpireDiscoveredDialog(empire);
    openEmpireDiscoveredDialog();
    dismissEvent(event.id);
  },
  onShipBuilt(event) {
    jumpToSystem(event.systemId);
    dismissEvent(event.id);
  },
  onJumpToSystem(systemId) {
    jumpToSystem(systemId);
  },
  onDismiss(eventId) {
    dismissEvent(eventId);
  },
};

// Interaktives Kampf-Grid (ROADMAP v0.16): galaxy.pendingBattles sammelt die
// Gefechte, die simulateTurn (js/economy.js) wegen der aktivierten
// Einstellung zurückgestellt hat. Die Runde gilt erst als abgeschlossen
// (Kampfbericht/Durchbrüche/Ankünfte anzeigen), wenn diese Warteschlange
// leer ist – jedes Gefecht wird nacheinander im Kampf-Grid oder per
// Auto-Auflösung entschieden.
function openNextPendingBattle() {
  const galaxy = gameState.galaxy;
  const pending = galaxy.pendingBattles ?? [];
  if (pending.length === 0) {
    const ctx = gameState.turnEndContext;
    const reports = gameState.turnEndBattleReports ?? [];
    gameState.turnEndContext = null;
    gameState.turnEndBattleReports = null;
    gameState.activeBattle = null;
    closeHexCombatDialog();
    if (ctx) {
      finishTurnDisplay(
        ctx.playerEmpire,
        reports,
        ctx.breakthroughsByEmpire,
        ctx.arrivals,
        ctx.galacticEvent,
        ctx.before,
        ctx.shipsBuilt,
        ctx.newDiscoveries
      );
    }
    return;
  }

  const next = pending[0];
  const player = getPlayerEmpire();
  const battle = createBattle(galaxy, next.systemId, player.id);
  if (!battle) {
    // Mehr als zwei Parteien am System oder Spieler nicht mehr beteiligt
    // (z.B. Flotte inzwischen abgezogen) -> automatisch auflösen.
    const result = resolvePendingBattleAuto(galaxy, next.systemId);
    galaxy.pendingBattles = pending.slice(1);
    if (result) gameState.turnEndBattleReports = [...(gameState.turnEndBattleReports ?? []), result];
    openNextPendingBattle();
    return;
  }

  resetHexCombatSelection();
  gameState.activeBattle = battle;
  // Dialog zuerst sichtbar machen: das Canvas hat als Kind eines noch
  // versteckten [hidden]-Overlays clientWidth/clientHeight=0, sonst würde
  // renderHexCombat mit einer falschen Notfall-Auflösung zeichnen, die beim
  // Sichtbarwerden verzerrt gestreckt erscheint.
  openHexCombatDialog();
  renderHexCombat(battle, galaxy, hexCombatCallbacks);
}

function finishActiveBattle(report) {
  const galaxy = gameState.galaxy;
  const systemId = gameState.activeBattle.systemId;
  if (report) gameState.turnEndBattleReports = [...(gameState.turnEndBattleReports ?? []), report];
  if (Object.values(report?.shipsLostByEmpire ?? {}).some((n) => n > 0)) playSfx("explosion");
  galaxy.pendingBattles = (galaxy.pendingBattles ?? []).filter((p) => p.systemId !== systemId);
  gameState.activeBattle = null;
  updateTopbarInfo(galaxy);
  refreshSidePanel();
  requestRender();
  saveGame();
  openNextPendingBattle();
}

// Wendet das Ergebnis eines im Kampf-Grid zu Ende gespielten Gefechts an.
// Guardian-Gefechte (ROADMAP v0.27) und Weltraum-Monster-Gefechte (ROADMAP
// v0.30, battle.isGuardianBattle/isSpaceMonsterBattle aus js/hexcombat.js
// createBattle) brauchen ihre eigene Nachbearbeitung (Guardian: Sieg-
// Belohnungen, galaxy.orion.guardianAlive; Weltraum-Monster: löscht das
// transiente galaxy.pendingSpaceMonster) statt der normalen
// Zwei-Imperien-Flottenneuaufbau-Logik.
function finalizeAndApplyBattle(battle) {
  const result = finalizeBattleResult(battle);
  if (battle.isGuardianBattle) {
    return applyInteractiveGuardianResult(gameState.galaxy, battle.systemId, result);
  }
  if (battle.isSpaceMonsterBattle) {
    return applyInteractiveSpaceMonsterResult(gameState.galaxy, battle.systemId, result);
  }
  return applyBattleResult(gameState.galaxy, battle.systemId, result);
}

const hexCombatCallbacks = {
  onMove(unitId, col, row) {
    const battle = gameState.activeBattle;
    const result = moveUnitTo(battle, unitId, col, row);
    if (!result.ok) {
      if (result.reason) flashHexCombatStatus(result.reason);
      return;
    }
    renderHexCombat(battle, gameState.galaxy, hexCombatCallbacks);
  },
  onAttack(attackerId, targetId) {
    const battle = gameState.activeBattle;
    const result = attackWithUnit(battle, attackerId, targetId);
    if (!result.ok) {
      if (result.reason) flashHexCombatStatus(result.reason);
      return;
    }
    playSfx("weaponFire");
    if (battle.finished) {
      finishActiveBattle(finalizeAndApplyBattle(battle));
    } else {
      renderHexCombat(battle, gameState.galaxy, hexCombatCallbacks);
    }
  },
  onEndPhase() {
    const battle = gameState.activeBattle;
    endPlayerPhase(battle);
    if (battle.finished) {
      finishActiveBattle(finalizeAndApplyBattle(battle));
    } else {
      renderHexCombat(battle, gameState.galaxy, hexCombatCallbacks);
    }
  },
  onRetreat() {
    const battle = gameState.activeBattle;
    if (!window.confirm("Verbliebene Flotte aus dem Gefecht zurückziehen?")) return;
    retreat(battle, getPlayerEmpire().id);
    finishActiveBattle(finalizeAndApplyBattle(battle));
  },
  onAutoResolve() {
    const battle = gameState.activeBattle;
    finishActiveBattle(resolvePendingBattleAuto(gameState.galaxy, battle.systemId));
  },
};

// Fasst den Rundenabschluss zusammen, sobald keine offenen Kampf-Grid-Gefechte
// mehr anstehen: entweder sofort (klassische Auto-Auflösung, keine
// Interaktion nötig) oder nach Abarbeiten der Warteschlange oben.
function proceedToBattlesOrFinish(
  playerEmpire,
  battleReports,
  breakthroughsByEmpire,
  arrivals,
  galacticEvent,
  before,
  shipsBuilt,
  newDiscoveries
) {
  if (gameState.galaxy.pendingBattles?.length > 0) {
    gameState.turnEndContext = { playerEmpire, breakthroughsByEmpire, arrivals, galacticEvent, before, shipsBuilt, newDiscoveries };
    gameState.turnEndBattleReports = [...battleReports];
    openNextPendingBattle();
    return;
  }
  finishTurnDisplay(playerEmpire, battleReports, breakthroughsByEmpire, arrivals, galacticEvent, before, shipsBuilt, newDiscoveries);
}

function finishTurnDisplay(playerEmpire, battleReports, breakthroughsByEmpire, arrivals, galacticEvent, before, shipsBuilt, newDiscoveries) {
  // Rundenereignisse (ROADMAP v0.24) werden IMMER berechnet und angezeigt,
  // bevor die bisherige Prioritätenkette (Kampfbericht > galaktisches
  // Ereignis > Durchbruch > Ankunft) greift – das Panel ist unabhängig von
  // etwaigen Dialogen sichtbar.
  gameState.turnEvents = before
    ? computeTurnEvents(gameState.galaxy, playerEmpire, before, {
        arrivals,
        shipsBuilt: shipsBuilt ?? [],
        newDiscoveries: newDiscoveries ?? [],
      })
    : [];
  renderEventPanel(gameState.turnEvents, eventCallbacks);
  if (gameState.turnEvents.length > 0) playSfx("alertNotify");

  const playerBattles = battleReports.filter((r) => r.empireIds.includes(playerEmpire.id));
  if (playerBattles.length > 0) {
    renderBattleReports(playerBattles, gameState.galaxy);
    openBattleDialog();
    return;
  }

  if (galacticEvent?.log) {
    flashTopbar(galacticEvent.log);
    return;
  }

  const playerBreakthroughs = breakthroughsByEmpire.get(playerEmpire.id);
  if (playerBreakthroughs?.length) {
    playSfx("breakthrough");
    flashTopbar(`Durchbruch: ${playerBreakthroughs.map((t) => t.name).join(", ")}`);
    return;
  }
  const playerArrivals = arrivals.filter((f) => f.ownerEmpireId === playerEmpire.id);
  if (playerArrivals.length > 0) {
    const system = findSystem(gameState.galaxy, playerArrivals[0].systemId);
    flashTopbar(`Flotte in ${system?.name ?? "einem System"} angekommen.`);
  }
}

let pendingCouncilVote = null;

// Löst eine vom Spieler beantwortete Ratssitzung auf (siehe js/council.js)
// und führt danach den regulären Rundenabschluss (Kampfberichte,
// Durchbrüche, Ankünfte) für dieselbe Runde fort.
const councilCallbacks = {
  onVote(candidateEmpireIdOrNull) {
    const pending = pendingCouncilVote;
    pendingCouncilVote = null;
    closeCouncilDialog();
    if (!pending) return;

    const result = resolveCouncilVote(gameState.galaxy, pending.vote, candidateEmpireIdOrNull);
    saveGame();
    const playerEmpire = getPlayerEmpire();

    if (result.outcome === "playerVictory" || result.outcome === "aiVictory") {
      const scores = gameState.galaxy.empires.map((e) => ({ empireId: e.id, score: computeScore(gameState.galaxy, e) }));
      gameState.galaxy.gameEndAnnounced = true;
      const diplomaticGameEnd = { reason: "diplomatic", winnerEmpireId: result.winner.id, scores };
      recordHallOfFameEntry(gameState.galaxy, diplomaticGameEnd);
      renderGameEnd(diplomaticGameEnd, gameState.galaxy);
      openGameEndDialog();
      return;
    }

    if (result.outcome === "finalWar") {
      updateTopbarInfo(gameState.galaxy);
      refreshSidePanel();
      requestRender();
      flashTopbar(`Galaktischer Rat: Wahl von ${result.winner.name} abgelehnt – alle Imperien erklären dir den Krieg!`);
    } else if (result.outcome === "none") {
      flashTopbar("Galaktischer Rat: keine Mehrheit erreicht.");
    }

    proceedToBattlesOrFinish(
      playerEmpire,
      pending.battleReports,
      pending.breakthroughsByEmpire,
      pending.arrivals,
      pending.galacticEvent,
      pending.before,
      pending.shipsBuilt,
      pending.newDiscoveries
    );
  },
};

function endTurn() {
  if (!gameState.galaxy) return;

  // Offene Kampf-Grid-Gefechte (ROADMAP v0.16) blockieren den eigentlichen
  // Rundenwechsel, bis sie entschieden sind (z.B. nach einem Neuladen mit
  // noch unerledigtem galaxy.pendingBattles) – einfach das Kampf-Grid für
  // das nächste offene Gefecht erneut öffnen statt eine neue Runde zu
  // simulieren.
  if (gameState.galaxy.pendingBattles?.length > 0) {
    if (!gameState.turnEndContext) {
      gameState.turnEndContext = {
        playerEmpire: getPlayerEmpire(),
        breakthroughsByEmpire: new Map(),
        arrivals: [],
        galacticEvent: null,
        before: null,
        shipsBuilt: [],
        newDiscoveries: [],
      };
      gameState.turnEndBattleReports = [];
    }
    openNextPendingBattle();
    return;
  }

  const before = snapshotPlayerState(gameState.galaxy, getPlayerEmpire());
  const { breakthroughsByEmpire, arrivals, battleReports, gameEnd, councilVote, galacticEvent, shipsBuilt, newDiscoveries } =
    simulateTurn(gameState.galaxy);
  playSfx("endTurn");
  updateTopbarInfo(gameState.galaxy);
  refreshSidePanel();
  requestRender();
  saveGame();

  const playerEmpire = getPlayerEmpire();

  if (gameEnd) {
    recordHallOfFameEntry(gameState.galaxy, gameEnd);
    renderGameEnd(gameEnd, gameState.galaxy);
    openGameEndDialog();
    return;
  }

  if (councilVote) {
    pendingCouncilVote = { vote: councilVote, battleReports, breakthroughsByEmpire, arrivals, galacticEvent, before, shipsBuilt, newDiscoveries };
    renderCouncilDialog(gameState.galaxy, councilVote, councilCallbacks);
    openCouncilDialog();
    return;
  }

  proceedToBattlesOrFinish(playerEmpire, battleReports, breakthroughsByEmpire, arrivals, galacticEvent, before, shipsBuilt, newDiscoveries);
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
      requestRender(); // Reichweiten-Overlay ausblenden, unabhängig vom Ausgang
      if (!system) {
        flashTopbar("Kein Zielsystem ausgewählt.");
        return;
      }
      const result = sendFleet(gameState.galaxy, fleetId, system.id);
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

  window.addEventListener("resize", () => {
    requestRender();
    if (gameState.activeBattle) renderHexCombat(gameState.activeBattle, gameState.galaxy, hexCombatCallbacks);
  });
}

// Dezenter Klick-Sound für JEDEN Button-Klick in der App (ROADMAP v0.31,
// Nutzerwunsch: Soundeffekte) – per Event-Delegation auf #app, statt jeden
// der zahlreichen Buttons einzeln zu verdrahten. Spezifischere Effekte
// (Runde beenden, Waffenfeuer, Durchbruch, Ereignis-Alarm) kommen zusätzlich
// on top und sind bewusst lauter als dieser Basis-Klick.
function setupGlobalUiSounds() {
  document.getElementById("app").addEventListener("click", (e) => {
    if (e.target.closest("button")) playSfx("uiClick");
  });
}

function setupDialogAndButtons() {
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

  document.getElementById("battle-close").addEventListener("click", closeBattleDialog);

  document.getElementById("hexcombat-endphase").addEventListener("click", () => hexCombatCallbacks.onEndPhase());
  document.getElementById("hexcombat-retreat").addEventListener("click", () => hexCombatCallbacks.onRetreat());
  document.getElementById("hexcombat-autoresolve").addEventListener("click", () => hexCombatCallbacks.onAutoResolve());

  document.getElementById("btn-diplomacy").addEventListener("click", () => {
    if (!gameState.galaxy) return;
    renderDiplomacyDialog(gameState.galaxy, diplomacyCallbacks);
    openDiplomacyDialog();
  });
  document.getElementById("diplomacy-close").addEventListener("click", closeDiplomacyDialog);

  document.getElementById("btn-planets").addEventListener("click", () => {
    if (!gameState.galaxy) return;
    renderPlanetsDialog(gameState.galaxy, panelCallbacks);
    openPlanetsDialog();
  });
  document.getElementById("planets-close").addEventListener("click", closePlanetsDialog);

  document.getElementById("splitfleet-cancel").addEventListener("click", closeSplitFleetDialog);

  document.getElementById("btn-home").addEventListener("click", goToHomeSystem);

  // "Neues Imperium entdeckt"-Dialog (ROADMAP v0.24): OK schließt nur,
  // "Kontakt aufnehmen" wechselt direkt zur Diplomatie (jetzt mit dem neu
  // entdeckten Imperium in der Liste, siehe hasDiscoveredEmpire-Filter in
  // js/ui.js renderDiplomacyDialog).
  document.getElementById("empire-discovered-ok").addEventListener("click", () => {
    closeEmpireDiscoveredDialog();
    gameState.pendingDiscoveredEmpireId = null;
  });
  document.getElementById("empire-discovered-contact").addEventListener("click", () => {
    closeEmpireDiscoveredDialog();
    gameState.pendingDiscoveredEmpireId = null;
    if (!gameState.galaxy) return;
    renderDiplomacyDialog(gameState.galaxy, diplomacyCallbacks);
    openDiplomacyDialog();
  });

  document.getElementById("btn-halloffame").addEventListener("click", () => {
    renderHallOfFame(loadHallOfFame());
    openHallOfFameDialog();
  });
  document.getElementById("halloffame-close").addEventListener("click", closeHallOfFameDialog);

  document.getElementById("gameend-close").addEventListener("click", closeGameEndDialog);

  // Spielmenü (ROADMAP v0.21): bündelt Neue Galaxie/Speichern/Laden/
  // Einstellungen, statt sie einzeln in der Kopfleiste zu verstreuen.
  document.getElementById("btn-menu").addEventListener("click", openMenuDialog);
  document.getElementById("menu-close").addEventListener("click", closeMenuDialog);

  document.getElementById("menu-new-game").addEventListener("click", () => {
    closeMenuDialog();
    renderRaceSelector("human");
    openNewGameDialog();
  });

  document.getElementById("menu-save").addEventListener("click", () => {
    const ok = saveGame();
    closeMenuDialog();
    flashTopbar(ok ? "Gespeichert." : "Keine Galaxie zum Speichern.");
  });

  document.getElementById("menu-load").addEventListener("click", () => {
    const ok = loadGame();
    closeMenuDialog();
    if (ok) {
      applySettingsToPlayer();
      updateTopbarInfo(gameState.galaxy);
      refreshSidePanel();
      requestRender();
    } else {
      flashTopbar("Kein Speicherstand gefunden.");
    }
  });

  document.getElementById("menu-settings").addEventListener("click", () => {
    closeMenuDialog();
    renderSettingsDialog(currentSettings, gameState.galaxy);
    openSettingsDialog();
  });
  document.getElementById("settings-close").addEventListener("click", closeSettingsDialog);

  document.getElementById("chk-interactive-combat").addEventListener("change", (e) => {
    currentSettings.interactiveCombat = e.target.checked;
    saveSettings(currentSettings);
    applySettingsToPlayer();
    saveGame();
  });
  document.getElementById("chk-music-enabled").addEventListener("change", (e) => {
    currentSettings.musicEnabled = e.target.checked;
    saveSettings(currentSettings);
    setMusicEnabled(e.target.checked);
    renderSettingsDialog(currentSettings, gameState.galaxy);
  });
  document.getElementById("rng-music-volume").addEventListener("input", (e) => {
    currentSettings.musicVolume = Number(e.target.value) / 100;
    saveSettings(currentSettings);
    setMusicVolume(currentSettings.musicVolume);
  });
  document.getElementById("chk-sfx-enabled").addEventListener("change", (e) => {
    currentSettings.sfxEnabled = e.target.checked;
    saveSettings(currentSettings);
    setSfxEnabled(e.target.checked);
    renderSettingsDialog(currentSettings, gameState.galaxy);
  });
  document.getElementById("rng-sfx-volume").addEventListener("input", (e) => {
    currentSettings.sfxVolume = Number(e.target.value) / 100;
    saveSettings(currentSettings);
    setSfxVolume(currentSettings.sfxVolume);
  });
}

let flashTimeout = null;
function flashTopbar(message) {
  const el = document.getElementById("topbar-turn");
  el.textContent = message;
  clearTimeout(flashTimeout);
  flashTimeout = setTimeout(() => {
    updateTopbarInfo(gameState.galaxy);
  }, 2500);
}

// Rückmeldungen zu ungültigen Kampf-Grid-Aktionen (z.B. "außerhalb der
// Waffenreichweite") müssen INS Dialogfeld selbst – flashTopbar würde die
// Meldung hinter dem vollflächigen Kampf-Grid-Overlay verstecken.
let hexCombatFlashTimeout = null;
function flashHexCombatStatus(message) {
  const el = document.getElementById("hexcombat-status");
  el.textContent = message;
  clearTimeout(hexCombatFlashTimeout);
  hexCombatFlashTimeout = setTimeout(() => {
    if (gameState.activeBattle) renderHexCombat(gameState.activeBattle, gameState.galaxy, hexCombatCallbacks);
  }, 2000);
}

function init() {
  setupCanvasInteractions();
  setupDialogAndButtons();
  setupGlobalUiSounds();
  renderStaticButtons();
  initAudio(currentSettings);
  playMusic("theme");

  if (hasSavedGame() && loadGame()) {
    if (!gameState.camera || !gameState.camera.zoom) {
      gameState.camera = fitGalaxyToView(canvas, gameState.galaxy);
    }
    applySettingsToPlayer();
    updateTopbarInfo(gameState.galaxy);
    refreshSidePanel();
    requestRender();
    // Ein beim letzten Speichern noch unerledigtes Kampf-Grid-Gefecht
    // (ROADMAP v0.16) sofort wieder anbieten, statt die Runde stillschweigend
    // weiterlaufen zu lassen.
    if (gameState.galaxy.pendingBattles?.length > 0) {
      gameState.turnEndContext = {
        playerEmpire: getPlayerEmpire(),
        breakthroughsByEmpire: new Map(),
        arrivals: [],
        galacticEvent: null,
        before: null,
        shipsBuilt: [],
        newDiscoveries: [],
      };
      gameState.turnEndBattleReports = [];
      openNextPendingBattle();
    }
  } else {
    startNewGalaxy({ sizeId: "medium", empireCount: 3, seed: "", raceId: "human" });
  }
}

// Ein Frame warten, damit Layout/CSSOM sicher fertig sind, bevor wir die
// Canvas-Größe für fitGalaxyToView auslesen (clientWidth/Height wäre sonst
// beim allerersten Aufruf u.U. noch 0).
requestAnimationFrame(init);
