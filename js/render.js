import { getStarType } from "./data/starTypes.js";

const STAR_RADIUS_BASE = 6;
const SELECT_RING_COLOR = "#5b9dff";
const HOME_RING_COLOR = "#ffb454";

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

export function render(canvas, galaxy, camera, selectedSystemId) {
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
      ctx.fillStyle = "#aab4d6";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(system.name, p.x, p.y + radius + 14);
      ctx.textAlign = "left";
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
