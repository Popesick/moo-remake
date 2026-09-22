import { getEnvironment } from "./data/environments.js";
import { getRichness } from "./data/richness.js";
import { getPlanetSize } from "./data/planetSizes.js";
import { getStarType } from "./data/starTypes.js";

export function renderSystemPanel(system) {
  const empty = document.getElementById("side-panel-empty");
  const details = document.getElementById("system-details");

  if (!system) {
    empty.hidden = false;
    details.hidden = true;
    return;
  }

  empty.hidden = true;
  details.hidden = false;

  document.getElementById("system-name").textContent = system.name + (system.isHomeworld ? " ★" : "");
  const star = getStarType(system.star);
  document.getElementById("system-star").textContent = `${star.name}${system.isHomeworld ? " · Heimatsystem" : ""}`;

  const list = document.getElementById("system-planets");
  list.innerHTML = "";

  if (system.planets.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Keine Planeten in diesem System.";
    list.appendChild(li);
    return;
  }

  for (const planet of system.planets) {
    const env = getEnvironment(planet.environment);
    const richness = getRichness(planet.richness);
    const size = getPlanetSize(planet.size);

    const li = document.createElement("li");

    const name = document.createElement("div");
    name.className = "planet-name";
    name.textContent = `${system.name} ${planet.name}${planet.isHomeworld ? " (Heimatwelt)" : ""}`;
    li.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "planet-meta";
    meta.textContent = `${env.name} · ${size.name} · ${richness.name}`;
    li.appendChild(meta);

    const note = document.createElement("div");
    note.className = "planet-meta";
    note.textContent = env.note;
    li.appendChild(note);

    list.appendChild(li);
  }
}

export function updateTopbarInfo(galaxy) {
  const el = document.getElementById("topbar-info");
  if (!galaxy) {
    el.textContent = "Keine Galaxie geladen.";
    return;
  }
  const totalPlanets = galaxy.systems.reduce((sum, s) => sum + s.planets.length, 0);
  el.textContent = `Galaxie-Seed ${galaxy.seed} · ${galaxy.systems.length} Systeme · ${totalPlanets} Planeten · ${galaxy.empireCount} Imperien`;
}

export function openNewGameDialog() {
  document.getElementById("new-game-dialog").hidden = false;
}

export function closeNewGameDialog() {
  document.getElementById("new-game-dialog").hidden = true;
}

export function readNewGameForm() {
  return {
    sizeId: document.getElementById("ng-size").value,
    empireCount: Number(document.getElementById("ng-empires").value),
    seed: document.getElementById("ng-seed").value.trim(),
  };
}
