// Kompaktes, handgezeichnetes Icon-Set (ROADMAP v0.21) für die
// Kopfleisten-/Menü-Buttons – reine Inline-SVGs (kein Icon-Font/CDN),
// stroke-basiert und über currentColor einfärbbar, damit sie sich nahtlos
// in die Button-Zustände (Standard/Hover/Aktiv) einfügen.
const PATHS = {
  research: `<circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>`,
  shipdesign: `<path d="M12 3l4 14h-3l-1 3-1-3H8z"/><circle cx="12" cy="10" r="1.4" fill="currentColor" stroke="none"/>`,
  diplomacy: `<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>`,
  endturn: `<circle cx="12" cy="12" r="9"/><path d="M10 8l5 4-5 4z" fill="currentColor" stroke="none"/>`,
  home: `<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10" ry="3" transform="rotate(-20 12 12)"/>`,
  halloffame: `<path d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"/><path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5"/><path d="M12 13v3.5M9 21h6M9.5 21c0-1.8 1-2.8 2.5-2.8s2.5 1 2.5 2.8"/>`,
  menu: `<path d="M4 6h16M4 12h16M4 18h16"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12M19.07 19.07l-2.12-2.12M7.05 7.05 4.93 4.93"/>`,
  save: `<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M7 14h10v7H7z"/>`,
  load: `<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3z"/><path d="M3 8l1.5 10a2 2 0 0 0 2 1.7h11a2 2 0 0 0 2-1.7L21 8"/>`,
  newgame: `<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>`,
  "music-on": `<path d="M9 18V5l10-2v13"/><circle cx="7" cy="18" r="2.4"/><circle cx="17" cy="16" r="2.4"/>`,
  "music-off": `<path d="M9 18V5l10-2v13"/><circle cx="7" cy="18" r="2.4"/><circle cx="17" cy="16" r="2.4"/><path d="M3 3l18 18"/>`,
  "sfx-on": `<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 7a7 7 0 0 1 0 10"/>`,
  "sfx-off": `<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9l5 5M21 9l-5 5"/>`,
  "empire-discovered": `<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16"/>`,
  "ship-built": `<path d="M12 3l4 14h-3l-1 3-1-3H8z"/><path d="M12 8v6" stroke-dasharray="1.6 1.6"/>`,
  "enemy-sighted": `<path d="M12 3l8 4v5c0 5-3.4 7.6-8 9-4.6-1.4-8-4-8-9V7z"/><path d="M9 10l6 6M15 10l-6 6"/>`,
  "planet-lost": `<circle cx="12" cy="12" r="7"/><ellipse cx="12" cy="12" rx="10" ry="3.2" transform="rotate(-20 12 12)"/><path d="M4 4l16 16" stroke="var(--danger,#e05555)"/>`,
  "system-lost": `<path d="M12 3l2.2 6.8H21l-5.6 4.2L17.6 21 12 16.9 6.4 21l2.2-6.9L3 9.8h6.8z"/><path d="M4 4l16 16" stroke="var(--danger,#e05555)"/>`,
  jump: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>`,
  dismiss: `<path d="M5 5l14 14M19 5L5 19"/>`,
};

// Liefert Inline-SVG-Markup für `name` (siehe PATHS oben). size in px,
// Strichstärke/Linienenden fix für einen einheitlichen Look über alle
// Icons hinweg.
export function iconSvg(name, size = 18) {
  const inner = PATHS[name];
  if (!inner) return "";
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
