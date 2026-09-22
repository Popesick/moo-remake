import { getEnvironment } from "./data/environments.js";
import { getRichness } from "./data/richness.js";
import { getPlanetSize } from "./data/planetSizes.js";
import { getStarType } from "./data/starTypes.js";
import { getRace } from "./data/races.js";
import { computePlanetProduction, isColonizable, maxPopulation } from "./economy.js";
import { DISCIPLINES } from "./data/disciplines.js";
import { getTech } from "./data/techTree.js";
import { costForTech, getCandidateTechs } from "./research.js";
import { getResearchCostFactor } from "./data/raceResearch.js";
import { isAtWar, getTradeAgreement, computeTradeBonusBC } from "./diplomacy.js";
import { maxInvasionTroops, fleetTroopCapacity } from "./invasion.js";
import { isSystemInRange } from "./fleets.js";
import { SPY_ACTIONS, MAX_ESPIONAGE_ALLOCATION_PCT } from "./data/espionage.js";
import { COUNCIL_MAJORITY_RATIO } from "./data/diplomacyOptions.js";
import { DEFAULT_TRAVEL_RANGE_PARSEC, UNLIMITED_TRAVEL_RANGE_PARSEC } from "./data/logistics.js";
import { isOrionGuarded } from "./orion.js";
import { killCountFor, ELIMINATION_KILL_BONUS, GUARDIAN_KILL_BONUS } from "./victory.js";
import { GALAXY_SIZES } from "./galaxyGen.js";

const SLIDER_LABELS = { ship: "Schiff", def: "Verteidigung", ind: "Industrie", eco: "Ökologie", tech: "Forschung" };

function fmt(n, digits = 1) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function envIconPath(envId) {
  return `assets/images/planets/env_${envId}.png`;
}

function racePortraitPath(raceId) {
  return `assets/images/races/race_${raceId}.png`;
}

function buildOwnedPlanetCard(system, planet, empire, callbacks) {
  const env = getEnvironment(planet.environment);
  const size = getPlanetSize(planet.size);
  const richness = getRichness(planet.richness);
  const race = getRace(empire?.raceId);
  const prod = planet.lastProduction ?? computePlanetProduction(planet, empire);
  const maxPop = maxPopulation(planet, empire);

  const li = document.createElement("li");

  const head = document.createElement("div");
  head.className = "planet-card-head";

  const icon = document.createElement("img");
  icon.className = "planet-icon";
  icon.src = envIconPath(env.id);
  icon.alt = env.name;
  head.appendChild(icon);

  const headText = document.createElement("div");

  const name = document.createElement("div");
  name.className = "planet-name";
  name.textContent = `${system.name} ${planet.name}${planet.isHomeworld ? " (Heimatwelt)" : ""}`;
  headText.appendChild(name);

  const owner = document.createElement("div");
  owner.className = "planet-owner";
  const portrait = document.createElement("img");
  portrait.className = "owner-portrait";
  portrait.src = racePortraitPath(empire?.raceId);
  portrait.alt = race?.name ?? "Unbekannt";
  owner.appendChild(portrait);
  const ownerLabel = document.createElement("span");
  ownerLabel.innerHTML = `<span class="owner-dot" style="background:${race?.color ?? "#888"}"></span>${race?.name ?? "Unbekannt"}`;
  owner.appendChild(ownerLabel);
  headText.appendChild(owner);

  head.appendChild(headText);
  li.appendChild(head);

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

  if (empire?.isPlayer && callbacks.onProductionChange) {
    const prodRow = document.createElement("label");
    prodRow.className = "design-field";
    prodRow.textContent = "Schiff-Slider baut:";
    const select = document.createElement("select");
    const colonyOpt = document.createElement("option");
    colonyOpt.value = "";
    colonyOpt.textContent = "Kolonieschiff (Standard)";
    if (!planet.productionTarget) colonyOpt.selected = true;
    select.appendChild(colonyOpt);
    for (const design of empire.shipDesigns) {
      const opt = document.createElement("option");
      opt.value = design.id;
      opt.textContent = design.name;
      if (planet.productionTarget === design.id) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => {
      callbacks.onProductionChange(system.id, planet.id, select.value || null);
    });
    prodRow.appendChild(select);
    li.appendChild(prodRow);
    if (planet.shipCarry) {
      const carryLine = document.createElement("div");
      carryLine.className = "production-line";
      carryLine.textContent = `Baufortschritt: ${fmt(planet.shipCarry, 0)} BC angespart`;
      li.appendChild(carryLine);
    }
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

function buildEnemyPlanetCard(system, planet, empire, playerEmpire, galaxy, callbacks) {
  const env = getEnvironment(planet.environment);
  const size = getPlanetSize(planet.size);
  const richness = getRichness(planet.richness);
  const race = getRace(empire?.raceId);

  const li = document.createElement("li");

  const head = document.createElement("div");
  head.className = "planet-card-head";
  const icon = document.createElement("img");
  icon.className = "planet-icon";
  icon.src = envIconPath(env.id);
  icon.alt = env.name;
  head.appendChild(icon);
  const headText = document.createElement("div");
  const name = document.createElement("div");
  name.className = "planet-name";
  name.textContent = `${system.name} ${planet.name}${planet.isHomeworld ? " (Heimatwelt)" : ""}`;
  headText.appendChild(name);
  const owner = document.createElement("div");
  owner.className = "planet-owner";
  owner.innerHTML = `<span class="owner-dot" style="background:${race?.color ?? "#888"}"></span>${race?.name ?? "Unbekannt"}`;
  headText.appendChild(owner);
  head.appendChild(headText);
  li.appendChild(head);

  const meta = document.createElement("div");
  meta.className = "planet-meta";
  meta.textContent = `${env.name} · ${size.name} · ${richness.name}`;
  li.appendChild(meta);

  const popLine = document.createElement("div");
  popLine.className = "production-line";
  popLine.textContent = `Bevölkerung: ${fmt(planet.population)} Mio. · Fabriken: ${planet.factories}`;
  li.appendChild(popLine);

  if (!playerEmpire || !isAtWar(galaxy, playerEmpire.id, empire.id)) return li;

  const playerFleetsHere = galaxy.fleets.filter(
    (f) => f.systemId === system.id && f.ownerEmpireId === playerEmpire.id && !f.destinationSystemId
  );
  const enemyFleetsHere = galaxy.fleets.filter(
    (f) => f.systemId === system.id && f.ownerEmpireId === empire.id && !f.destinationSystemId
  );
  const capacity = playerFleetsHere.reduce((sum, f) => sum + fleetTroopCapacity(f), 0);

  if (playerFleetsHere.length > 0 && enemyFleetsHere.length === 0 && capacity > 0) {
    const invasionRow = document.createElement("div");
    invasionRow.className = "fleet-actions";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = String(capacity);
    input.value = String(Math.min(capacity, 10));
    const btn = document.createElement("button");
    btn.textContent = `Invasion (max. ${capacity} Mio. Transportkapazität)`;
    btn.addEventListener("click", () => callbacks.onInvade(system.id, planet.id, Number(input.value)));
    invasionRow.appendChild(input);
    invasionRow.appendChild(btn);
    li.appendChild(invasionRow);
  } else if (enemyFleetsHere.length > 0) {
    const hint = document.createElement("div");
    hint.className = "colonize-hint";
    hint.textContent = "Orbit ist noch von feindlichen Flotten kontrolliert – keine Invasion möglich.";
    li.appendChild(hint);
  }

  if ((playerEmpire.bioWeaponKillMillions ?? 0) > 0) {
    const bioBtn = document.createElement("button");
    bioBtn.className = "btn-colonize";
    bioBtn.textContent = "Bioangriff einsetzen";
    bioBtn.addEventListener("click", () => callbacks.onBioAttack(system.id, planet.id));
    li.appendChild(bioBtn);
  }

  return li;
}

function buildUncolonizedPlanetCard(system, planet, playerEmpire, galaxy, callbacks) {
  const env = getEnvironment(planet.environment);
  const size = getPlanetSize(planet.size);
  const richness = getRichness(planet.richness);

  const li = document.createElement("li");

  const head = document.createElement("div");
  head.className = "planet-card-head";
  const icon = document.createElement("img");
  icon.className = "planet-icon";
  icon.src = envIconPath(env.id);
  icon.alt = env.name;
  head.appendChild(icon);

  const name = document.createElement("div");
  name.className = "planet-name";
  name.textContent = `${system.name} ${planet.name}`;
  head.appendChild(name);
  li.appendChild(head);

  const meta = document.createElement("div");
  meta.className = "planet-meta";
  meta.textContent = `${env.name} · ${size.name} · ${richness.name}`;
  li.appendChild(meta);

  const note = document.createElement("div");
  note.className = "planet-meta";
  note.textContent = env.note;
  li.appendChild(note);

  const inRange = isSystemInRange(galaxy, playerEmpire, system);
  const guarded = isOrionGuarded(galaxy, system.id);

  if (isColonizable(planet, playerEmpire) && inRange && !guarded) {
    const btn = document.createElement("button");
    btn.className = "btn-colonize";
    btn.textContent = `Kolonisieren (${playerEmpire.colonyShips} Kolonieschiff${playerEmpire.colonyShips === 1 ? "" : "e"} verfügbar)`;
    btn.disabled = playerEmpire.colonyShips < 1;
    btn.addEventListener("click", () => callbacks.onColonize(system.id, planet.id));
    li.appendChild(btn);
  } else {
    const hint = document.createElement("div");
    hint.className = "colonize-hint";
    if (guarded) {
      hint.textContent = "Bewacht vom Guardian of Orion – erst eine Kampfflotte hierher schicken und den Wächter besiegen.";
    } else if (!inRange) {
      hint.textContent = `Außerhalb der Treibstoffreichweite (${playerEmpire.travelRangeParsec ?? DEFAULT_TRAVEL_RANGE_PARSEC} Parsec ab eigenen Kolonien) – weitere Fuel-Cell-Forschung nötig.`;
    } else {
      hint.textContent = env.techReq > 0
        ? `Erfordert eine Planetologie-Technologie auf Stufe ${env.techReq} (siehe Forschungsdialog).`
        : "Noch nicht kolonisierbar.";
    }
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
  const orionSuffix = system.isOrionSystem
    ? galaxy.orion?.guardianAlive
      ? " · Orion (bewacht vom Guardian)"
      : " · Orion (Guardian besiegt)"
    : "";
  document.getElementById("system-star").textContent = `${star.name}${system.isHomeworld ? " · Heimatsystem" : ""}${orionSuffix}`;

  const list = document.getElementById("system-planets");
  list.innerHTML = "";

  const playerEmpire = galaxy.empires.find((e) => e.isPlayer);

  if (system.planets.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Keine Planeten in diesem System.";
    list.appendChild(li);
  }

  for (const planet of system.planets) {
    if (planet.colonizedBy !== null && planet.colonizedBy !== undefined) {
      const empire = galaxy.empires.find((e) => e.id === planet.colonizedBy);
      if (empire?.id === playerEmpire?.id) {
        list.appendChild(buildOwnedPlanetCard(system, planet, empire, callbacks));
      } else {
        list.appendChild(buildEnemyPlanetCard(system, planet, empire, playerEmpire, galaxy, callbacks));
      }
    } else {
      list.appendChild(buildUncolonizedPlanetCard(system, planet, playerEmpire, galaxy, callbacks));
    }
  }

  renderFleetSection(system, galaxy, playerEmpire, callbacks);
}

function renderFleetSection(system, galaxy, playerEmpire, callbacks) {
  const container = document.getElementById("system-fleets");
  container.innerHTML = "";
  if (!playerEmpire) return;

  const stationary = galaxy.fleets.filter(
    (f) => f.systemId === system.id && f.ownerEmpireId === playerEmpire.id && !f.destinationSystemId
  );
  const incoming = galaxy.fleets.filter(
    (f) => f.destinationSystemId === system.id && f.ownerEmpireId === playerEmpire.id
  );

  if (stationary.length === 0 && incoming.length === 0) return;

  const section = document.createElement("div");
  section.className = "fleet-section";
  const heading = document.createElement("h3");
  heading.textContent = "Flotten";
  heading.style.margin = "0 0 0.4rem";
  heading.style.fontSize = "0.95rem";
  section.appendChild(heading);

  for (const fleet of stationary) {
    const card = document.createElement("div");
    card.className = "fleet-card";
    const title = document.createElement("div");
    title.innerHTML = `<strong>Flotte ${fleet.id.replace("fleet-", "#")}</strong>`;
    card.appendChild(title);

    for (const stack of fleet.stacks) {
      const design = playerEmpire.shipDesigns.find((d) => d.id === stack.designId);
      const row = document.createElement("div");
      row.className = "fleet-stack-row";
      row.innerHTML = `<span>${stack.count}× ${design?.name ?? "Unbekanntes Design"}</span>`;
      if (stack.count > 1) {
        const splitInput = document.createElement("input");
        splitInput.type = "number";
        splitInput.min = "1";
        splitInput.max = String(stack.count - 1);
        splitInput.value = "1";
        const splitBtn = document.createElement("button");
        splitBtn.textContent = "Aufteilen";
        splitBtn.addEventListener("click", () => {
          callbacks.onSplitStack(fleet.id, stack.designId, Number(splitInput.value));
        });
        row.appendChild(splitInput);
        row.appendChild(splitBtn);
      }
      card.appendChild(row);
    }

    const actions = document.createElement("div");
    actions.className = "fleet-actions";
    const moveBtn = document.createElement("button");
    moveBtn.textContent = "Verlegen (Ziel auf Karte klicken)";
    moveBtn.addEventListener("click", () => callbacks.onArmFleetMove(fleet.id));
    actions.appendChild(moveBtn);
    card.appendChild(actions);

    section.appendChild(card);
  }

  for (const fleet of incoming) {
    const eta = Math.max(1, Math.ceil(fleet.travelRemaining / fleet.travelSpeed));
    const card = document.createElement("div");
    card.className = "fleet-card";
    const shipCount = fleet.stacks.reduce((s, st) => s + st.count, 0);
    card.textContent = `Ankommend: ${shipCount} Schiff(e), ETA ${eta} Runde${eta === 1 ? "" : "n"}`;
    section.appendChild(card);
  }

  container.appendChild(section);
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
    const techLevelSum = DISCIPLINES.reduce((s, d) => s + (player.research?.techLevel[d.id] ?? 0), 0);
    const range = player.travelRangeParsec ?? DEFAULT_TRAVEL_RANGE_PARSEC;
    const rangeText = range >= UNLIMITED_TRAVEL_RANGE_PARSEC ? "unbegrenzt" : `${range} Parsec`;
    statsEl.textContent = `${race?.name ?? "Spieler"} · Kolonieschiffe: ${player.colonyShips} · Forschung: ${fmt(player.lastResearchIncome ?? 0, 1)} RP/Runde · Techstufen gesamt: ${techLevelSum} · Flottenreichweite: ${rangeText}`;
  } else {
    statsEl.textContent = "";
  }
}

function buildDisciplineCard(discipline, empire, callbacks) {
  const research = empire.research;
  const level = research.techLevel[discipline.id];
  const targetId = research.currentTarget[discipline.id];
  const target = targetId ? getTech(targetId) : null;
  const progress = research.progress[discipline.id] ?? 0;
  const allocation = research.allocation[discipline.id] ?? 0;
  const raceFactor = getResearchCostFactor(empire.raceId, discipline.id);
  const candidates = getCandidateTechs(empire, discipline.id);

  const card = document.createElement("div");
  card.className = "discipline-card";

  const header = document.createElement("div");
  header.className = "discipline-header";
  header.innerHTML = `<span>${discipline.name}</span><span>Stufe ${level}</span>`;
  card.appendChild(header);

  if (target) {
    const cost = costForTech(target, empire.researchCostFactor ?? 26, raceFactor);

    const targetLine = document.createElement("div");
    targetLine.className = "discipline-target";
    targetLine.textContent = `Ziel: ${target.name} (Stufe ${target.level}) – ${target.description}`;
    card.appendChild(targetLine);

    const track = document.createElement("div");
    track.className = "discipline-progress-track";
    const fill = document.createElement("div");
    fill.className = "discipline-progress-fill";
    fill.style.width = `${Math.min(100, (progress / cost) * 100)}%`;
    track.appendChild(fill);
    card.appendChild(track);

    const costLine = document.createElement("div");
    costLine.className = "discipline-target";
    costLine.textContent = `${fmt(progress, 0)} / ${fmt(cost, 0)} RP`;
    card.appendChild(costLine);

    if (candidates.length > 1) {
      const pickerLabel = document.createElement("div");
      pickerLabel.className = "discipline-target";
      pickerLabel.textContent = "Alternative Ziele in dieser Rung:";
      card.appendChild(pickerLabel);

      const picker = document.createElement("div");
      picker.className = "tech-picker";
      for (const candidate of candidates) {
        const btn = document.createElement("button");
        btn.className = "btn-tech-choice";
        btn.textContent = `${candidate.name} (Lv. ${candidate.level})`;
        if (candidate.id === target.id) btn.classList.add("active");
        btn.addEventListener("click", () => callbacks.onSelectTarget(discipline.id, candidate.id));
        picker.appendChild(btn);
      }
      card.appendChild(picker);
    }
  } else {
    const targetLine = document.createElement("div");
    targetLine.className = "discipline-target";
    targetLine.textContent = "Keine weiteren Technologien in dieser Disziplin verfügbar (Zufallsauswahl dieser Partie).";
    card.appendChild(targetLine);
  }

  const row = document.createElement("div");
  row.className = "slider-row";
  const label = document.createElement("span");
  label.textContent = "Fokus";
  row.appendChild(label);
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.value = String(Math.round(allocation));
  input.addEventListener("input", () => callbacks.onAllocationChange(discipline.id, Number(input.value)));
  row.appendChild(input);
  const value = document.createElement("span");
  value.textContent = `${Math.round(allocation)}%`;
  row.appendChild(value);
  card.appendChild(row);

  return card;
}

export function renderResearchDialog(galaxy, callbacks) {
  const container = document.getElementById("research-disciplines");
  container.innerHTML = "";
  const player = galaxy.empires.find((e) => e.isPlayer);
  if (!player) return;
  for (const discipline of DISCIPLINES) {
    container.appendChild(buildDisciplineCard(discipline, player, callbacks));
  }
}

export function openResearchDialog() {
  document.getElementById("research-dialog").hidden = false;
}

export function closeResearchDialog() {
  document.getElementById("research-dialog").hidden = true;
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
    difficultyId: document.getElementById("ng-difficulty").value,
    seed: document.getElementById("ng-seed").value.trim(),
  };
}

export function renderBattleReports(reports, galaxy) {
  const container = document.getElementById("battle-report");
  container.innerHTML = "";
  for (const report of reports) {
    const system = galaxy.systems.find((s) => s.id === report.systemId);
    const box = document.createElement("div");
    box.className = "design-row";

    const title = document.createElement("div");
    title.className = "design-row-head";
    let statusText;
    if (report.isGuardianBattle) {
      const monsterName = report.monsterName ?? "Guardian of Orion";
      statusText = report.guardianDefeated ? `${monsterName} besiegt!` : `${monsterName} wehrt den Angriff ab.`;
    } else {
      const winnerRace = report.winnerEmpireId !== null
        ? getRace(galaxy.empires.find((e) => e.id === report.winnerEmpireId)?.raceId)?.name
        : null;
      statusText = winnerRace ? `Sieg: ${winnerRace}` : "Unentschieden";
    }
    title.innerHTML = `<strong>${system?.name ?? "Unbekanntes System"}</strong><span>${statusText}</span>`;
    box.appendChild(title);

    const lossLine = document.createElement("div");
    lossLine.className = "design-row-stats";
    lossLine.textContent = Object.entries(report.shipsLostByEmpire)
      .map(([empireId, lost]) => {
        if (empireId === "monster") return `${report.monsterName ?? "Guardian of Orion"}: ${lost} Schiff(e) verloren`;
        const race = getRace(galaxy.empires.find((e) => e.id === Number(empireId))?.raceId);
        return `${race?.name ?? empireId}: ${lost} Schiff(e) verloren`;
      })
      .join(" · ");
    box.appendChild(lossLine);

    const log = document.createElement("div");
    log.className = "battle-log";
    log.textContent = report.log.length > 0 ? report.log.join("\n") : "Keine Schiffe zerstört.";
    box.appendChild(log);

    container.appendChild(box);
  }
}

export function openBattleDialog() {
  document.getElementById("battle-dialog").hidden = false;
}

export function closeBattleDialog() {
  document.getElementById("battle-dialog").hidden = true;
}

export function renderDiplomacyDialog(galaxy, callbacks) {
  const player = galaxy.empires.find((e) => e.isPlayer);
  if (!player) return;

  const budgetEl = document.getElementById("espionage-budget");
  budgetEl.innerHTML = "";
  const budgetLabel = document.createElement("label");
  budgetLabel.className = "design-field";
  budgetLabel.textContent = `Spionage-Budget: ${Math.round(player.espionageAllocationPct)}% der Produktion · Vorrat: ${fmt(player.espionagePoints ?? 0, 0)} SP`;
  const budgetInput = document.createElement("input");
  budgetInput.type = "range";
  budgetInput.min = "0";
  budgetInput.max = String(MAX_ESPIONAGE_ALLOCATION_PCT);
  budgetInput.value = String(Math.round(player.espionageAllocationPct));
  budgetInput.addEventListener("input", () => callbacks.onEspionageAllocationChange(Number(budgetInput.value)));
  budgetLabel.appendChild(budgetInput);
  budgetEl.appendChild(budgetLabel);

  const container = document.getElementById("diplomacy-list");
  container.innerHTML = "";

  for (const empire of galaxy.empires) {
    if (empire.id === player.id || empire.eliminated) continue;
    const relation = callbacks.getRelation(empire.id);
    const race = getRace(empire.raceId);

    const row = document.createElement("div");
    row.className = "design-row";
    const title = document.createElement("div");
    title.className = "design-row-head";
    title.innerHTML = `<strong>${race?.name ?? empire.name}</strong><span>${relation.status === "war" ? "Krieg" : "Frieden"}</span>`;
    row.appendChild(title);

    const warBtn = document.createElement("button");
    if (relation.status === "war") {
      warBtn.textContent = "Frieden anbieten";
      warBtn.addEventListener("click", () => callbacks.onProposePeace(empire.id));
    } else {
      warBtn.textContent = "Krieg erklären";
      warBtn.addEventListener("click", () => callbacks.onDeclareWar(empire.id));
    }
    row.appendChild(warBtn);

    if (relation.status !== "war") {
      const agreement = getTradeAgreement(galaxy, player.id, empire.id);
      const tradeRow = document.createElement("div");
      tradeRow.className = "fleet-actions";
      if (agreement) {
        const bonus = computeTradeBonusBC(agreement);
        const status = document.createElement("span");
        status.className = "colonize-hint";
        status.textContent = `Handelsabkommen aktiv seit ${agreement.turnsActive} Runde(n) · Ertrag: ${fmt(bonus, 1)} BC/Runde`;
        tradeRow.appendChild(status);
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Handelsabkommen kündigen";
        cancelBtn.addEventListener("click", () => callbacks.onCancelTrade(empire.id));
        tradeRow.appendChild(cancelBtn);
      } else {
        const proposeBtn = document.createElement("button");
        proposeBtn.textContent = "Handelsabkommen vorschlagen";
        proposeBtn.addEventListener("click", () => callbacks.onProposeTrade(empire.id));
        tradeRow.appendChild(proposeBtn);
      }
      row.appendChild(tradeRow);
    }

    const frameLabel = document.createElement("label");
    frameLabel.className = "colonize-hint";
    const frameCheckbox = document.createElement("input");
    frameCheckbox.type = "checkbox";
    frameLabel.appendChild(frameCheckbox);
    frameLabel.append(" Bei Entdeckung Dritten die Schuld zuschieben (Framing)");
    row.appendChild(frameLabel);

    const spyRow = document.createElement("div");
    spyRow.className = "fleet-actions";
    for (const action of Object.values(SPY_ACTIONS)) {
      const spyBtn = document.createElement("button");
      spyBtn.textContent = `${action.name} (${action.cost} SP)`;
      spyBtn.disabled = (player.espionagePoints ?? 0) < action.cost;
      spyBtn.addEventListener("click", () => callbacks.onSpyAction(empire.id, action.id, frameCheckbox.checked));
      spyRow.appendChild(spyBtn);
    }
    row.appendChild(spyRow);

    container.appendChild(row);
  }
}

export function openDiplomacyDialog() {
  document.getElementById("diplomacy-dialog").hidden = false;
}

export function closeDiplomacyDialog() {
  document.getElementById("diplomacy-dialog").hidden = true;
}

export function renderGameEnd(gameEnd, galaxy) {
  const title = document.getElementById("gameend-title");
  const container = document.getElementById("gameend-scores");
  container.innerHTML = "";

  const winner = galaxy.empires.find((e) => e.id === gameEnd.winnerEmpireId);
  const winnerRace = getRace(winner?.raceId);
  const reasonText = gameEnd.reason === "elimination"
    ? "Sieg durch Elimination aller Rivalen"
    : gameEnd.reason === "diplomatic"
    ? `Diplomatischer Sieg im Galaktischen Rat für ${winnerRace?.name ?? winner?.name ?? "?"}`
    : `Rundenlimit erreicht (Runde ${galaxy.turn - 1})`;
  title.textContent = `Spielende – ${reasonText}`;

  for (const entry of gameEnd.scores) {
    const empire = galaxy.empires.find((e) => e.id === entry.empireId);
    const race = getRace(empire?.raceId);
    const row = document.createElement("div");
    row.className = "design-row";
    row.innerHTML = `<div class="design-row-head"><strong>${race?.name ?? entry.empireId}${empire?.id === gameEnd.winnerEmpireId ? " 🏆" : ""}</strong><span>${empire?.eliminated ? "Eliminiert" : `${entry.score} Punkte`}</span></div>`;

    if (!empire?.eliminated) {
      const killCount = killCountFor(galaxy, entry.empireId);
      const guardianKilled = galaxy.orion?.defeatedByEmpireId === entry.empireId;
      if (killCount > 0 || guardianKilled) {
        const bonusLine = document.createElement("div");
        bonusLine.className = "design-row-stats";
        const parts = [];
        if (killCount > 0) parts.push(`${killCount}× Fraktion eliminiert (+${killCount * ELIMINATION_KILL_BONUS})`);
        if (guardianKilled) parts.push(`Guardian of Orion besiegt (+${GUARDIAN_KILL_BONUS})`);
        bonusLine.textContent = parts.join(" · ");
        row.appendChild(bonusLine);
      }
    }

    container.appendChild(row);
  }
}

export function openGameEndDialog() {
  document.getElementById("gameend-dialog").hidden = false;
}

export function closeGameEndDialog() {
  document.getElementById("gameend-dialog").hidden = true;
}

const GAME_END_REASON_LABELS = {
  elimination: "Elimination",
  diplomatic: "Diplomatie",
  turnLimit: "Rundenlimit",
};

export function renderHallOfFame(entries) {
  const container = document.getElementById("halloffame-list");
  container.innerHTML = "";

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dialog-hint";
    empty.textContent = "Noch keine abgeschlossenen Partien.";
    container.appendChild(empty);
    return;
  }

  entries.forEach((entry, i) => {
    const race = getRace(entry.raceId);
    const size = GALAXY_SIZES[entry.sizeId];
    const date = new Date(entry.date).toLocaleDateString("de-DE");
    const row = document.createElement("div");
    row.className = "design-row";
    row.innerHTML = `<div class="design-row-head"><strong>#${i + 1} ${race?.name ?? entry.raceId}${entry.isPlayer ? " (Du)" : " (KI)"}</strong><span>${entry.score} Punkte</span></div>
      <div class="design-row-stats">${size?.label ?? entry.sizeId} · ${entry.empireCount} Imperien · Runde ${entry.turn} · ${GAME_END_REASON_LABELS[entry.reason] ?? entry.reason} · ${date}</div>`;
    container.appendChild(row);
  });
}

export function openHallOfFameDialog() {
  document.getElementById("halloffame-dialog").hidden = false;
}

export function closeHallOfFameDialog() {
  document.getElementById("halloffame-dialog").hidden = true;
}

// Zeigt eine fällige Ratssitzung: die beiden Kandidaten mit ihrer
// Gesamtbevölkerung und den bereits ausgezählten KI-Stimmen. Ist der Spieler
// selbst Kandidat, gibt es nichts zu wählen (nur "Fortsetzen"); sonst muss er
// sich für einen der beiden entscheiden – votiert er gegen einen KI-Kandidaten,
// der die Mehrheit erreicht, folgt der "Final War" (siehe js/council.js).
export function renderCouncilDialog(galaxy, voteResult, callbacks) {
  const body = document.getElementById("council-body");
  const actions = document.getElementById("council-actions");
  body.innerHTML = "";
  actions.innerHTML = "";

  const { candidates, tally, totalPopulation, playerIsCandidate } = voteResult;
  const required = totalPopulation * COUNCIL_MAJORITY_RATIO;

  const intro = document.createElement("p");
  intro.className = "dialog-hint";
  intro.textContent = playerIsCandidate
    ? "Du bist selbst Kandidat des Galaktischen Rats. Die übrigen Imperien haben bereits abgestimmt."
    : "Der Galaktische Rat tritt zusammen. Stimme für einen der beiden Kandidaten – lehnst du die Wahl eines Konkurrenten ab, der die Mehrheit erreicht, erklären dir alle übrigen Imperien den Krieg.";
  body.appendChild(intro);

  for (const candidate of candidates) {
    const race = getRace(candidate.raceId);
    const votes = tally[candidate.id] ?? 0;
    const pct = totalPopulation > 0 ? Math.round((votes / totalPopulation) * 100) : 0;
    const row = document.createElement("div");
    row.className = "design-row";
    row.innerHTML = `<div class="design-row-head"><strong>${race?.name ?? candidate.name}${candidate.isPlayer ? " (Du)" : ""}</strong><span>${votes.toFixed(0)} / ${totalPopulation.toFixed(0)} Mio. Stimmen (${pct}%, benötigt ${Math.round((required / totalPopulation) * 100) || 67}%)</span></div>`;
    body.appendChild(row);
  }

  if (playerIsCandidate) {
    const continueBtn = document.createElement("button");
    continueBtn.textContent = "Fortsetzen";
    continueBtn.addEventListener("click", () => callbacks.onVote(null));
    actions.appendChild(continueBtn);
    return;
  }

  for (const candidate of candidates) {
    const race = getRace(candidate.raceId);
    const btn = document.createElement("button");
    btn.textContent = `Für ${race?.name ?? candidate.name} stimmen`;
    btn.addEventListener("click", () => callbacks.onVote(candidate.id));
    actions.appendChild(btn);
  }
}

export function openCouncilDialog() {
  document.getElementById("council-dialog").hidden = false;
}

export function closeCouncilDialog() {
  document.getElementById("council-dialog").hidden = true;
}
