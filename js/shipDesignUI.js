import { HULLS } from "./data/hulls.js";
import { modulesOfKind, computeDesignStats } from "./shipDesign.js";

let editorState = null;

function freshEditorState() {
  return { hullId: "small", armorId: "", shieldId: "", driveId: "", weapons: {}, name: "" };
}

function fmt(n, digits = 0) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function buildDesignRow(design, onScrap, empire) {
  const stats = computeDesignStats(design, empire);
  const row = document.createElement("div");
  row.className = "design-row";
  const weaponSummary = stats.weaponLines.map((w) => `${w.count}× ${w.tech.name}`).join(", ") || "keine Waffen";
  row.innerHTML = `
    <div class="design-row-head"><strong>${design.name}</strong><span>${stats.hull.name}</span></div>
    <div class="design-row-stats">HP ${fmt(stats.hp)} · Schild ${stats.shieldAbsorption} · Tempo ${stats.speed} Parsec · ${fmt(stats.costBC)} BC · Platz ${stats.spaceUsed}/${stats.spaceTotal}</div>
    <div class="design-row-stats">${weaponSummary}</div>
  `;
  const scrapBtn = document.createElement("button");
  scrapBtn.textContent = "Verschrotten";
  scrapBtn.className = "btn-scrap";
  scrapBtn.addEventListener("click", () => onScrap(design.id));
  row.appendChild(scrapBtn);
  return row;
}

function buildSelect(id, label, options, selectedValue, onChange, includeNone = true) {
  const wrap = document.createElement("label");
  wrap.className = "design-field";
  wrap.textContent = label;
  const select = document.createElement("select");
  if (includeNone) {
    const noneOpt = document.createElement("option");
    noneOpt.value = "";
    noneOpt.textContent = "Keine";
    select.appendChild(noneOpt);
  }
  for (const opt of options) {
    const el = document.createElement("option");
    el.value = opt.id;
    el.textContent = opt.label;
    if (opt.id === selectedValue) el.selected = true;
    select.appendChild(el);
  }
  select.addEventListener("change", () => onChange(select.value));
  wrap.appendChild(select);
  return wrap;
}

export function renderShipDesignDialog(galaxy, callbacks) {
  const player = galaxy.empires.find((e) => e.isPlayer);
  if (!player) return;
  if (!editorState) editorState = freshEditorState();

  const listEl = document.getElementById("shipdesign-list");
  listEl.innerHTML = "";
  if (player.shipDesigns.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dialog-hint";
    empty.textContent = "Noch keine Designs erstellt.";
    listEl.appendChild(empty);
  }
  for (const design of player.shipDesigns) {
    listEl.appendChild(buildDesignRow(design, callbacks.onScrap, player));
  }

  const editorEl = document.getElementById("shipdesign-editor");
  editorEl.innerHTML = "";

  const armorOptions = modulesOfKind("armor", player).map((t) => ({ id: t.id, label: `${t.name} (×${t.module.hpMultiplier} HP)` }));
  const shieldOptions = modulesOfKind("shield", player).map((t) => ({ id: t.id, label: `${t.name} (Absorption ${t.module.absorption})` }));
  const driveOptions = modulesOfKind("drive", player).map((t) => ({ id: t.id, label: `${t.name} (${t.module.speed} Parsec/Zug)` }));
  const weaponOptions = modulesOfKind("weapon", player);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Design-Name";
  nameInput.value = editorState.name;
  nameInput.addEventListener("input", () => {
    editorState.name = nameInput.value;
  });
  const nameLabel = document.createElement("label");
  nameLabel.className = "design-field";
  nameLabel.textContent = "Name";
  nameLabel.appendChild(nameInput);
  editorEl.appendChild(nameLabel);

  editorEl.appendChild(
    buildSelect(
      "hull",
      "Rumpf",
      HULLS.map((h) => ({ id: h.id, label: `${h.name} (${h.space} Platz)` })),
      editorState.hullId,
      (v) => {
        editorState.hullId = v;
        renderShipDesignDialog(galaxy, callbacks);
      },
      false
    )
  );
  editorEl.appendChild(
    buildSelect("armor", "Panzerung", armorOptions, editorState.armorId, (v) => {
      editorState.armorId = v;
      renderShipDesignDialog(galaxy, callbacks);
    })
  );
  editorEl.appendChild(
    buildSelect("shield", "Schild", shieldOptions, editorState.shieldId, (v) => {
      editorState.shieldId = v;
      renderShipDesignDialog(galaxy, callbacks);
    })
  );
  editorEl.appendChild(
    buildSelect("drive", "Antrieb", driveOptions, editorState.driveId, (v) => {
      editorState.driveId = v;
      renderShipDesignDialog(galaxy, callbacks);
    })
  );

  const weaponsHeader = document.createElement("div");
  weaponsHeader.className = "dialog-hint";
  weaponsHeader.textContent = "Waffen (Anzahl je Typ):";
  editorEl.appendChild(weaponsHeader);

  const weaponsGrid = document.createElement("div");
  weaponsGrid.className = "weapon-grid";
  for (const tech of weaponOptions) {
    const row = document.createElement("label");
    row.className = "weapon-row";
    row.textContent = `${tech.name} (${tech.module.dmgMin}-${tech.module.dmgMax} Schaden)`;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.value = String(editorState.weapons[tech.id] ?? 0);
    input.addEventListener("input", () => {
      const n = Math.max(0, Number(input.value) || 0);
      if (n === 0) delete editorState.weapons[tech.id];
      else editorState.weapons[tech.id] = n;
      renderStatsPreview();
    });
    row.appendChild(input);
    weaponsGrid.appendChild(row);
  }
  editorEl.appendChild(weaponsGrid);

  const statsEl = document.createElement("div");
  statsEl.className = "design-stats-preview";
  editorEl.appendChild(statsEl);

  function currentDesign() {
    return {
      name: editorState.name || "Unbenanntes Design",
      hullId: editorState.hullId,
      armorId: editorState.armorId || null,
      shieldId: editorState.shieldId || null,
      driveId: editorState.driveId || null,
      weapons: Object.entries(editorState.weapons).map(([techId, count]) => ({ techId, count })),
    };
  }

  function renderStatsPreview() {
    const stats = computeDesignStats(currentDesign(), player);
    statsEl.innerHTML = "";
    statsEl.textContent = `Platz ${stats.spaceUsed}/${stats.spaceTotal} · ${fmt(stats.costBC)} BC · HP ${fmt(stats.hp)} · Schild ${stats.shieldAbsorption} · Tempo ${stats.speed} Parsec`;
    if (stats.overCapacity) {
      statsEl.classList.add("stats-error");
      statsEl.textContent += " — Raumkapazität überschritten!";
    } else {
      statsEl.classList.remove("stats-error");
    }
  }
  renderStatsPreview();

  const createBtn = document.createElement("button");
  createBtn.textContent = `Design erstellen (${player.shipDesigns.length}/6 belegt)`;
  createBtn.disabled = player.shipDesigns.length >= 6;
  createBtn.addEventListener("click", () => {
    const result = callbacks.onCreateDesign(currentDesign());
    if (result?.ok) {
      editorState = freshEditorState();
      renderShipDesignDialog(galaxy, callbacks);
    } else if (result) {
      callbacks.onError?.(result.reason);
    }
  });
  editorEl.appendChild(createBtn);
}

export function openShipDesignDialog() {
  document.getElementById("shipdesign-dialog").hidden = false;
}

export function closeShipDesignDialog() {
  document.getElementById("shipdesign-dialog").hidden = true;
}
