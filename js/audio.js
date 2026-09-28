// Musik-/Soundeffekt-Infrastruktur (ROADMAP v0.21). Es liegen noch keine
// Audio-Dateien im Projekt (das folgt in einem späteren Release), daher ist
// dieser Manager bewusst tolerant: fehlt eine Datei unter assets/audio/,
// schlägt das Laden einmalig fehl, wird als "nicht verfügbar" vermerkt und
// danach lautlos ignoriert (kein Konsolenspam, kein Absturz) – Lautstärke-
// und An/Aus-Regler in den Einstellungen funktionieren schon jetzt
// vollständig, sie haben nur noch nichts zum Abspielen.
const AUDIO_BASE = "assets/audio/";
const unavailable = new Set();

const state = {
  musicEnabled: true,
  musicVolume: 0.6,
  sfxEnabled: true,
  sfxVolume: 0.8,
};

let musicEl = null;
let currentMusicName = null;

function markUnavailable(name) {
  unavailable.add(name);
}

export function initAudio(settings) {
  state.musicEnabled = settings.musicEnabled ?? true;
  state.musicVolume = settings.musicVolume ?? 0.6;
  state.sfxEnabled = settings.sfxEnabled ?? true;
  state.sfxVolume = settings.sfxVolume ?? 0.8;
}

export function setMusicEnabled(enabled) {
  state.musicEnabled = enabled;
  if (!musicEl) return;
  if (enabled) musicEl.play().catch(() => {});
  else musicEl.pause();
}

export function setSfxEnabled(enabled) {
  state.sfxEnabled = enabled;
}

export function setMusicVolume(volume) {
  state.musicVolume = volume;
  if (musicEl) musicEl.volume = volume;
}

export function setSfxVolume(volume) {
  state.sfxVolume = volume;
}

// Startet (bzw. wechselt zu) einem endlos wiederholten Hintergrund-Track.
// Kein Effekt, solange Musik deaktiviert ist oder die Datei fehlt.
export function playMusic(name) {
  if (currentMusicName === name && musicEl && !musicEl.paused) return;
  currentMusicName = name;
  if (unavailable.has(`music:${name}`)) return;

  if (!musicEl) {
    musicEl = new Audio();
    musicEl.loop = true;
  }
  musicEl.src = `${AUDIO_BASE}${name}.mp3`;
  musicEl.volume = state.musicVolume;
  musicEl.onerror = () => {
    markUnavailable(`music:${name}`);
    musicEl.onerror = null;
  };
  if (state.musicEnabled) musicEl.play().catch(() => markUnavailable(`music:${name}`));
}

export function stopMusic() {
  currentMusicName = null;
  if (musicEl) musicEl.pause();
}

// Spielt einen kurzen Einzel-Sound ab (z.B. Klick, Explosion). Erzeugt pro
// Aufruf ein frisches Audio-Element, damit sich überlappende Effekte nicht
// gegenseitig abschneiden.
export function playSfx(name) {
  if (!state.sfxEnabled || unavailable.has(`sfx:${name}`)) return;
  const el = new Audio(`${AUDIO_BASE}${name}.mp3`);
  el.volume = state.sfxVolume;
  el.onerror = () => markUnavailable(`sfx:${name}`);
  el.play().catch(() => markUnavailable(`sfx:${name}`));
}
