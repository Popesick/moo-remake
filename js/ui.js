import { getEnvironment } from "./data/environments.js";
import { getRichness } from "./data/richness.js";
import { getPlanetSize } from "./data/planetSizes.js";
import { getStarType } from "./data/starTypes.js";
import { getRace } from "./data/races.js";
import { computePlanetProduction, isColonizable, maxPopulation } from "./economy.js";

const SLIDER_LABELS = { ship: "Schiff", def: "Verteidigung", ind: "Industrie", eco: "Ökologie", tech: "Forschung" };

function fmt(n, digits = 1) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function buildOwnedPlanetCard(system, planet, empire, callbacks) {
  const env = getEnvironment(planet.environment);
  const size = getPlanetSize(planet.size);
  const richness = getRichness(planet.richness);
  const race = getRace(empire?.raceId);
  const prod = planet.lastProduction ?? computePlanetProduction(planet);
  const maxPop = maxPopulation(planet);

  const li = document.createElement("li");

  const name = document.createElement("div");
  name.className = "planet-name";
  name.textContent = `${system.name} ${planet.name}${planet.isHomeworld ? " (Heimatwelt)" : ""}`;
  li.appendChild(name);

  const owner = document.createElement("div");
  owner.className = "planet-owner";
  owner.innerHTML = `<span class="owner-dot" style="background:${race?.color ?? "#888"}"></span>${race?.name ?? "Unbekannt"}`;
  li.appendChild(owner);

  const meta = document.createElement("div");
  meta.className = "planet-meta";
  meta.textContent = `${env.name} · ${size.name} · ${richness.name}`;
  li.appendChild(meta);

  const popLine = document.createElement("div");
  popLine.className = "production-line";
  popLine.textContent = `Bevölkerung: ${fmt(planet.population)} / ${maxPop} Mio.`;
  li.appendChild(popLine);

  const barTrack = document.createElement("div");
  barTrack.className = "pop-bar-track";
  const barFill = document.createElement("div");
  barFill.className = "pop-bar-fill";
  barFill.style.width = `${Math.min(100, (planet.population / maxPop) * 100)}%`;
  barTrack.appendChild(barFill);
  li.appendChild(barTrack);

  const factoryLine = document.createElement("div");
  factoryLine.className = "production-line";
  factoryLine.textContent = `Fabriken: ${planet.factories} (${prod.activeFactories} aktiv) · Produktion: ${fmt(prod.totalBC)} BC/Runde`;
  li.appendChild(factoryLine);

  if (prod.pollutionPenalty > 0) {
    const pollutionLine = document.createElement("div");
    pollutionLine.className = "production-line";
    pollutionLine.textContent = `⚠ Verschmutzung reduziert Wachstum um ${Math.round(prod.pollutionPenalty * 100)}%`;
    li.appendChild(pollutionLine);
  }

  for (const key of ["ship", "def", "ind", "eco", "tech"]) {
    const row = document.createElement("div");
    row.className = "slider-row";

    const label = document.createElement("span");
    label.textContent = SLIDER_LABELS[key];
    row.appendChild(label);

    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "100";
    input.value = String(Math.round(planet.sliders[key]));
    input.addEventListener("input", () => {
      callbacks.onSliderChange(system.id, planet.id, key, Number(input.value));
    });
    row.appendChild(input);

    const value = document.createElement("span");
    value.textContent = `${Math.round(planet.sliders[key])}%`;
    row.appendChild(value);

    li.appendChild(row);
  }

  return li;
}

function buildUncolonizedPlanetCard(system, planet, playerEmpire, callbacks) {
  const env = getEnvironment(planet.environment);
  const size = getPlanetSize(planet.size);
  const richness = getRichness(planet.richness);

  const li = document.createElement("li");

  const name = document.createElement("div");
  name.className = "planet-name";
  name.textContent = `${system.name} ${planet.name}`;
  li.appendChild(name);

  const meta = document.createElement("div");
  meta.className = "planet-meta";
  meta.textContent = `${env.name} · ${size.name} · ${richness.name}`;
  li.appendChild(meta);

  const note = document.createElement("div");
  note.className = "planet-meta";
  note.textContent = env.note;
  li.appendChild(note);

  if (isColonizable(planet, playerEmpire)) {
    const btn = document.createElement("button");
    btn.className = "btn-colonize";
    btn.textContent = `Kolonisieren (${playerEmpire.colonyShips} Kolonieschiff${playerEmpire.colonyShips === 1 ? "" : "e"} verfügbar)`;
    btn.disabled = playerEmpire.colonyShips < 1;
    btn.addEventListener("click", () => callbacks.onColonize(system.id, planet.id));
    li.appendChild(btn);
  } else {
    const hint = document.createElement("div");
    hint.className = "colonize-hint";
    hint.textContent = `Erfordert Planetologie-Stufe ${env.techReq} zur Kolonisierung (noch nicht erforschbar, siehe Roadmap v0.3).`;
    li.appendChild(hint);
  }

  return li;
}

export function renderSystemPanel(system, galaxy, callbacks) {
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

  const playerEmpire = galaxy.empires.find((e) => e.isPlayer);

  for (const planet of system.planets) {
    if (planet.colonizedBy !== null && planet.colonizedBy !== undefined) {
      const empire = galaxy.empires.find((e) => e.id === planet.colonizedBy);
      list.appendChild(buildOwnedPlanetCard(system, planet, empire, callbacks));
    } else {
      list.appendChild(buildUncolonizedPlanetCard(system, planet, playerEmpire, callbacks));
    }
  }
}

export function updateTopbarInfo(galaxy) {
  const el = document.getElementById("topbar-info");
  if (!galaxy) {
    el.textContent = "Keine Galaxie geladen.";
    document.getElementById("topbar-stats").textContent = "";
    return;
  }
  const totalPlanets = galaxy.systems.reduce((sum, s) => sum + s.planets.length, 0);
  el.textContent = `Runde ${galaxy.turn ?? 1} · Seed ${galaxy.seed} · ${galaxy.systems.length} Systeme · ${totalPlanets} Planeten · ${galaxy.empireCount} Imperien`;

  const player = galaxy.empires?.find((e) => e.isPlayer);
  const statsEl = document.getElementById("topbar-stats");
  if (player) {
    const race = getRace(player.raceId);
    statsEl.textContent = `${race?.name ?? "Spieler"} · Kolonieschiffe: ${player.colonyShips} · Forschung: ${fmt(player.researchPoints, 0)} RP`;
  } else {
    statsEl.textContent = "";
  }
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
