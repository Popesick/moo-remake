// Zeichnet das interaktive Kampf-Grid (ROADMAP v0.16) und übersetzt Klicks
// auf dem Canvas in Battle-Aktionen (Auswahl, Bewegung, Angriff). Analog zu
// js/render.js für die Galaxiekarte, nur für die taktische Hexfeld-Ansicht.
import { GRID_COLS, GRID_ROWS, reachableTiles, attackableTargets } from "./hexcombat.js";

const MAX_HEX_SIZE = 30;
const MIN_HEX_SIZE = 14;

let selectedUnitId = null;
let wired = false;
let currentBattle = null;
let currentGalaxy = null;
let currentCallbacks = null;
let currentHexSize = MAX_HEX_SIZE;

// Hexfeldgröße an die verfügbare Canvas-Breite anpassen, damit alle
// GRID_COLS Spalten auch auf schmaleren Fenstern sichtbar bleiben, statt
// rechts abgeschnitten zu werden – nach oben hin bei MAX_HEX_SIZE gedeckelt.
function fitHexSize(availableWidth) {
  const raw = (availableWidth - 8) / (GRID_COLS * 1.5 + 0.5);
  return Math.max(MIN_HEX_SIZE, Math.min(MAX_HEX_SIZE, raw));
}

function hexToPixel(col, row) {
  const size = currentHexSize;
  const w = size * 1.5;
  const h = size * Math.sqrt(3);
  const x = col * w + size + 4;
  const y = row * h + (col % 2 === 1 ? h / 2 : 0) + h / 2 + 4;
  return { x, y };
}

// Nächstliegendes Hexfeld zu einem Klickpunkt: bei einem kleinen Grid
// (max. 11×7 Felder) reicht eine einfache nächste-Nachbar-Suche statt einer
// exakten Würfelkoordinaten-Rücktransformation.
function pixelToHex(x, y) {
  let best = null;
  let bestDist = Infinity;
  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      const p = hexToPixel(col, row);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = { col, row };
      }
    }
  }
  return bestDist <= currentHexSize ? best : null;
}

function drawHex(ctx, cx, cy, size, fillStyle, strokeStyle) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

function handleClick(cell) {
  const battle = currentBattle;
  if (!battle || battle.finished) return;
  const clicked = battle.units.find((u) => u.count > 0 && u.col === cell.col && u.row === cell.row);

  if (!selectedUnitId) {
    if (clicked && clicked.empireId === battle.playerEmpireId) {
      selectedUnitId = clicked.id;
      renderHexCombat(currentBattle, currentGalaxy, currentCallbacks);
    }
    return;
  }

  if (clicked && clicked.id === selectedUnitId) {
    selectedUnitId = null;
    renderHexCombat(currentBattle, currentGalaxy, currentCallbacks);
    return;
  }

  if (clicked && clicked.empireId === battle.playerEmpireId) {
    selectedUnitId = clicked.id;
    renderHexCombat(currentBattle, currentGalaxy, currentCallbacks);
    return;
  }

  if (clicked && clicked.empireId !== battle.playerEmpireId) {
    currentCallbacks.onAttack(selectedUnitId, clicked.id);
    return;
  }

  currentCallbacks.onMove(selectedUnitId, cell.col, cell.row);
}

function renderLog(battle) {
  const el = document.getElementById("hexcombat-log");
  const lines = battle.log.length > 0 ? battle.log : ["Noch keine Treffer."];
  el.textContent = lines.slice(-40).join("\n");
  el.scrollTop = el.scrollHeight;
}

function renderStatus(battle) {
  const el = document.getElementById("hexcombat-status");
  if (battle.finished) {
    const winnerText = battle.winnerEmpireId === battle.playerEmpireId
      ? "Sieg!"
      : battle.winnerEmpireId === null
        ? "Unentschieden – Gefecht abgebrochen."
        : "Niederlage.";
    el.textContent = `Gefecht beendet (Runde ${battle.round}): ${winnerText}`;
    return;
  }
  el.textContent = `Runde ${battle.round} – eigene Einheit wählen, dann Zielfeld (Bewegung) oder gegnerische Einheit (Angriff) anklicken. Jede Einheit darf pro Runde einmal ziehen und einmal angreifen.`;
}

export function renderHexCombat(battle, galaxy, callbacks) {
  currentBattle = battle;
  currentGalaxy = galaxy;
  currentCallbacks = callbacks;
  if (selectedUnitId && !battle.units.some((u) => u.id === selectedUnitId && u.count > 0)) {
    selectedUnitId = null;
  }

  const canvas = document.getElementById("hexcombat-canvas");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 800;
  const h = canvas.clientHeight || 500;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#05070f";
  ctx.fillRect(0, 0, w, h);
  currentHexSize = fitHexSize(w);

  const selected = battle.units.find((u) => u.id === selectedUnitId) ?? null;
  const isOwnSelected = selected && selected.empireId === battle.playerEmpireId && !battle.finished;
  const moveTiles = isOwnSelected ? reachableTiles(battle, selected) : [];
  const moveTileSet = new Set(moveTiles.map((p) => `${p.col},${p.row}`));
  const targets = isOwnSelected ? attackableTargets(battle, selected) : [];
  const targetIds = new Set(targets.map((t) => t.id));

  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      const { x, y } = hexToPixel(col, row);
      const fill = moveTileSet.has(`${col},${row}`) ? "rgba(91, 157, 255, 0.25)" : "#0d1220";
      drawHex(ctx, x, y, currentHexSize * 0.94, fill, "#232b45");
    }
  }

  const barHalfWidth = currentHexSize * 0.5;
  for (const unit of battle.units) {
    if (unit.count <= 0) continue;
    const { x, y } = hexToPixel(unit.col, unit.row);
    const owner = galaxy.empires.find((e) => e.id === unit.empireId);
    // Guardian of Orion (ROADMAP v0.27) ist kein Eintrag in galaxy.empires
    // und bekommt daher eine feste, bedrohlich wirkende Signalfarbe statt
    // des Fallback-Weiß.
    const color = owner?.color ?? (unit.designId === "guardian" ? "#b23a3a" : "#ffffff");
    const isSelected = unit.id === selectedUnitId;
    const isTargetable = targetIds.has(unit.id);
    const ringColor = isTargetable ? "#ff5b5b" : isSelected ? "#ffffff" : null;
    drawHex(ctx, x, y, currentHexSize * 0.94, null, ringColor);

    const isFrozen = unit.frozenRounds > 0;
    ctx.globalAlpha = isFrozen || (unit.hasMoved && unit.hasActed) ? 0.5 : 1;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, currentHexSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Stasisfeld (ROADMAP v0.19): eingefrorene Einheiten können weder
    // ziehen noch angreifen, bis frozenRounds abgelaufen ist.
    if (isFrozen) {
      ctx.strokeStyle = "#5bd7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, currentHexSize * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#05070f";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(unit.count), x, y + 4);

    const hpFrac = Math.max(0, (unit.shipHp[0] ?? 0) / unit.maxHp);
    ctx.fillStyle = "#232b45";
    ctx.fillRect(x - barHalfWidth, y + currentHexSize * 0.5, barHalfWidth * 2, 4);
    ctx.fillStyle = hpFrac > 0.5 ? "#57c785" : hpFrac > 0.25 ? "#ffb454" : "#ff5b5b";
    ctx.fillRect(x - barHalfWidth, y + currentHexSize * 0.5, barHalfWidth * 2 * hpFrac, 4);

    ctx.fillStyle = "#aab4d6";
    ctx.font = "9px sans-serif";
    ctx.fillText(unit.designName, x, y - currentHexSize * 0.6);
  }
  ctx.textAlign = "left";

  renderLog(battle);
  renderStatus(battle);

  if (!wired) {
    wired = true;
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cell = pixelToHex(x, y);
      if (cell) handleClick(cell);
    });
  }
}

// Setzt die lokale Auswahl zurück, wenn ein neues Gefecht beginnt (z.B.
// nächstes an galaxy.pendingBattles zurückgestelltes Gefecht in derselben
// Runde), damit keine Einheit-ID aus dem vorherigen Kampf hängen bleibt.
export function resetHexCombatSelection() {
  selectedUnitId = null;
}
