import { getStarType } from "./data/starTypes.js";
import { PARSEC_PIXELS } from "./data/logistics.js";

const STAR_RADIUS_BASE = 6;
const SELECT_RING_COLOR = "#5b9dff";
const HOME_RING_COLOR = "#ffb454";
const ORION_RING_COLOR = "#b46cff";

let starfield = null;
let starfieldSeedKey = null;

function ensureStarfield(canvas, galaxy) {
  const key = `${galaxy.width}x${galaxy.height}`;
  if (starfield && starfieldSeedKey === key) return starfield;
  const stars = [];
  const count = Math.floor((galaxy.width * galaxy.height) / 6000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * galaxy.width,
      y: Math.random() * galaxy.height,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random() * 0.5 + 0.15,
    });
  }
  starfield = stars;
  starfieldSeedKey = key;
  return starfield;
}

export function worldToScreen(camera, x, y) {
  return {
    x: (x - camera.x) * camera.zoom,
    y: (y - camera.y) * camera.zoom,
  };
}

export function screenToWorld(camera, x, y) {
  return {
    x: x / camera.zoom + camera.x,
    y: y / camera.zoom + camera.y,
  };
}

// Zentriert die Kamera (mutiert camera.x/y, Zoom bleibt unverändert) auf
// einen Weltkoordinaten-Punkt, z.B. für den "Heimatsystem"-Button.
export function centerCameraOnPoint(canvas, camera, worldX, worldY) {
  const w = canvas.clientWidth || window.innerWidth || 800;
  const h = canvas.clientHeight || window.innerHeight || 600;
  camera.x = worldX - w / 2 / camera.zoom;
  camera.y = worldY - h / 2 / camera.zoom;
}

// Zeichnet die Treibstoffreichweite (ROADMAP v0.10) als transluzente Kreise
// um alle Kolonien des angegebenen Imperiums – aktiv während der
// Zielwahl für eine Flottenbewegung (gameState.pendingFleetMove), damit
// sofort sichtbar ist, welche Systeme ohne weitere Forschung erreichbar sind.
function renderRangeOverlay(ctx, camera, galaxy, empireId, rangeParsec) {
  const ownedSystems = galaxy.systems.filter((s) => s.planets.some((p) => p.colonizedBy === empireId));
  if (ownedSystems.length === 0) return;
  const radiusPixels = rangeParsec * PARSEC_PIXELS * camera.zoom;
  ctx.save();
  ctx.fillStyle = "rgba(91, 157, 255, 0.06)";
  ctx.strokeStyle = "rgba(91, 157, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const system of ownedSystems) {
    const p = worldToScreen(camera, system.x, system.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radiusPixels, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

export function render(canvas, galaxy, camera, selectedSystemId, rangeOverlay) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#05070f";
  ctx.fillRect(0, 0, w, h);

  if (!galaxy) return;

  // Sternfeld-Hintergrund (parallax-artig, leicht gedämpft durch Zoom)
  const stars = ensureStarfield(canvas, galaxy);
  ctx.save();
  for (const s of stars) {
    const p = worldToScreen(camera, s.x, s.y);
    if (p.x < -10 || p.y < -10 || p.x > w + 10 || p.y > h + 10) continue;
    ctx.globalAlpha = s.a;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if (rangeOverlay) {
    renderRangeOverlay(ctx, camera, galaxy, rangeOverlay.empireId, rangeOverlay.rangeParsec);
  }

  // Sternensysteme
  for (const system of galaxy.systems) {
    const p = worldToScreen(camera, system.x, system.y);
    if (p.x < -30 || p.y < -30 || p.x > w + 30 || p.y > h + 30) continue;

    const star = getStarType(system.star);
    const radius = STAR_RADIUS_BASE * Math.max(0.6, Math.min(1.6, camera.zoom));

    const ownerId = system.planets.find((p) => p.colonizedBy !== null && p.colonizedBy !== undefined)?.colonizedBy;
    if (ownerId !== undefined) {
      const owner = galaxy.empires?.find((e) => e.id === ownerId);
      ctx.strokeStyle = owner ? owner.color : HOME_RING_COLOR;
      ctx.lineWidth = system.isHomeworld ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (system.id === selectedSystemId) {
      ctx.strokeStyle = SELECT_RING_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Orion-System (ROADMAP v0.10): gestrichelter violetter Ring, solange
    // der Guardian aktiv ist, durchgezogen sobald er besiegt wurde.
    if (system.isOrionSystem) {
      ctx.strokeStyle = ORION_RING_COLOR;
      ctx.lineWidth = 2;
      if (galaxy.orion?.guardianAlive) ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = star.color;
    ctx.shadowColor = star.color;
    ctx.shadowBlur = 8 * Math.max(0.6, camera.zoom);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (camera.zoom > 0.55 && system.planets.length > 0) {
      ctx.fillStyle = "#8fa0c9";
      ctx.beginPath();
      ctx.arc(p.x + radius + 5, p.y - radius - 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "9px sans-serif";
      ctx.fillText(String(system.planets.length), p.x + radius + 9, p.y - radius);
    }

    if (camera.zoom > 0.7) {
      ctx.fillStyle = system.isOrionSystem ? ORION_RING_COLOR : "#aab4d6";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(system.isOrionSystem ? `${system.name} (Orion)` : system.name, p.x, p.y + radius + 14);
      ctx.textAlign = "left";
    }
  }

  renderFleets(ctx, galaxy, camera);
}

function fleetShipCount(fleet) {
  return fleet.stacks.reduce((sum, s) => sum + s.count, 0);
}

function renderFleets(ctx, galaxy, camera) {
  if (!galaxy.fleets) return;
  const bySystem = new Map();

  for (const fleet of galaxy.fleets) {
    const owner = galaxy.empires.find((e) => e.id === fleet.ownerEmpireId);
    const color = owner?.color ?? "#ffffff";

    if (fleet.destinationSystemId) {
      const origin = galaxy.systems.find((s) => s.id === (fleet.originSystemId ?? fleet.systemId));
      const destination = galaxy.systems.find((s) => s.id === fleet.destinationSystemId);
      if (!origin || !destination) continue;
      const t = 1 - Math.max(0, fleet.travelRemaining) / Math.max(1, fleet.travelTotal);
      const wx = origin.x + (destination.x - origin.x) * t;
      const wy = origin.y + (destination.y - origin.y) * t;
      const op = worldToScreen(camera, origin.x, origin.y);
      const dp = worldToScreen(camera, destination.x, destination.y);
      const fp = worldToScreen(camera, wx, wy);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(op.x, op.y);
      ctx.lineTo(dp.x, dp.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(fp.x, fp.y - 4);
      ctx.lineTo(fp.x + 4, fp.y + 3);
      ctx.lineTo(fp.x - 4, fp.y + 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      const list = bySystem.get(fleet.systemId) ?? [];
      list.push({ fleet, color });
      bySystem.set(fleet.systemId, list);
    }
  }

  for (const [systemId, entries] of bySystem) {
    const system = galaxy.systems.find((s) => s.id === systemId);
    if (!system) continue;
    const p = worldToScreen(camera, system.x, system.y);
    const totalShips = entries.reduce((sum, e) => sum + fleetShipCount(e.fleet), 0);
    if (totalShips === 0) continue;
    const markerX = p.x - 12;
    const markerY = p.y + 12;
    ctx.fillStyle = entries[0].color;
    ctx.beginPath();
    ctx.moveTo(markerX, markerY - 4);
    ctx.lineTo(markerX + 4, markerY + 3);
    ctx.lineTo(markerX - 4, markerY + 3);
    ctx.closePath();
    ctx.fill();
    if (camera.zoom > 0.5) {
      ctx.fillStyle = "#aab4d6";
      ctx.font = "9px sans-serif";
      ctx.fillText(String(totalShips), markerX + 6, markerY + 3);
    }
  }
}

export function pickSystemAt(canvas, galaxy, camera, screenX, screenY) {
  if (!galaxy) return null;
  const world = screenToWorld(camera, screenX, screenY);
  const hitRadiusWorld = 14 / camera.zoom;
  let closest = null;
  let closestDist = Infinity;
  for (const system of galaxy.systems) {
    const dx = system.x - world.x;
    const dy = system.y - world.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < hitRadiusWorld && dist < closestDist) {
      closest = system;
      closestDist = dist;
    }
  }
  return closest;
}

export function fitGalaxyToView(canvas, galaxy) {
  const w = canvas.clientWidth || window.innerWidth || 800;
  const h = canvas.clientHeight || window.innerHeight || 600;
  const zoom = Math.min(w / galaxy.width, h / galaxy.height) * 0.92;
  return {
    zoom,
    x: galaxy.width / 2 - w / 2 / zoom,
    y: galaxy.height / 2 - h / 2 / zoom,
  };
}
