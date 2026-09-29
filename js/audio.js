// Audio-Infrastruktur (ROADMAP v0.21; Soundeffekt-Synthese seit ROADMAP
// v0.31; echte Musik-Dateien seit ROADMAP v0.32, vom Nutzer per Suno
// erzeugt und bereitgestellt). Soundeffekte bleiben synthetisiert (kein
// Datei-Download, kein Lizenzrisiko für die zahlreichen kurzen UI-Klänge),
// Hintergrundmusik läuft jetzt über echte .mp3-Dateien unter
// assets/audio/.
const AUDIO_BASE = "assets/audio/";

let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Playlists nach Kontext (ROADMAP v0.32): "ingame" ist der allgemeine
// Erkundungs-/Wirtschafts-Loop, der beim Spielstart beginnt; "combat" läuft
// im interaktiven Kampf-Grid (js/main.js öffnet/schließt es passend zu
// openHexCombatDialog/closeHexCombatDialog). "ingame" und "combat" sind
// bewusst Mehr-Track-Playlists mit Shuffle (siehe pickNextTrack) – für "council"
// und "victory" hat der Nutzer je EINEN festen Track vorgegeben (nicht
// zufällig, da hier nur ein einzelner, dem Moment zugeordneter Song
// erwünscht ist); pickNextTrack gibt bei einelementigen Playlists ohnehin
// immer genau diesen einen Track zurück.
const PLAYLISTS = {
  ingame: [
    "deep_space_transit_1",
    "deep_space_transit_2",
    "vast_horizons",
    "galactic_legacies",
    "expansion_of_the_unknown_1",
    "expansion_of_the_unknown_2",
  ],
  combat: ["deep_space_conflict_1", "deep_space_conflict_2"],
  council: ["council_theme"],
  victory: ["victory_theme"],
};

const state = {
  musicEnabled: true,
  musicVolume: 0.6,
  sfxEnabled: true,
  sfxVolume: 0.8,
};

let musicEl = null;
let currentPlaylistName = null;
let lastTrackName = null;

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

// Wählt den nächsten Track aus einer Playlist zufällig, aber nie denselben
// zweimal hintereinander (bei mehr als einem Track) – reines Zufalls-Shuffle
// würde bei 6 Tracks sichtbar oft direkt wiederholen.
function pickNextTrack(playlist) {
  if (playlist.length === 1) return playlist[0];
  let candidate;
  do {
    candidate = playlist[Math.floor(Math.random() * playlist.length)];
  } while (candidate === lastTrackName);
  return candidate;
}

function playTrack(name) {
  lastTrackName = name;
  if (!musicEl) {
    musicEl = new Audio();
    // Kein `loop = true`: beim Ende eines Tracks wird automatisch der
    // nächste (andere) Track derselben Playlist nachgeladen, damit sich
    // eine lange Partie nicht denselben 8-10-Minuten-Loop wiederholt.
    musicEl.addEventListener("ended", () => {
      if (currentPlaylistName) playTrack(pickNextTrack(PLAYLISTS[currentPlaylistName]));
    });
  }
  musicEl.src = `${AUDIO_BASE}${name}.mp3`;
  musicEl.volume = state.musicVolume;
  musicEl.onerror = () => {
    // Fehlende/kaputte Datei: stumm zum nächsten Track derselben Playlist
    // weiterschalten statt die Wiedergabe ganz abzubrechen.
    if (currentPlaylistName) playTrack(pickNextTrack(PLAYLISTS[currentPlaylistName]));
  };
  if (state.musicEnabled) musicEl.play().catch(() => armAutoplayRetry());
}

// Browser blockieren Audio-Wiedergabe mit Ton meist, bis der/die Nutzer:in
// irgendwo auf der Seite interagiert hat – der Aufruf von playMusic("ingame")
// direkt beim Laden (js/main.js init()) schlägt daher beim ersten Versuch
// häufig lautlos fehl. Ein einmaliger Listener auf die erste Interaktion
// holt die Wiedergabe dann nach, statt dass die Musik bis zum nächsten
// manuellen playMusic-Aufruf (z.B. Laden eines Spielstands) stumm bleibt.
let autoplayRetryArmed = false;
function armAutoplayRetry() {
  if (autoplayRetryArmed) return;
  autoplayRetryArmed = true;
  const retry = () => {
    document.removeEventListener("pointerdown", retry);
    document.removeEventListener("keydown", retry);
    if (state.musicEnabled && musicEl && musicEl.paused) musicEl.play().catch(() => {});
  };
  document.addEventListener("pointerdown", retry, { once: true });
  document.addEventListener("keydown", retry, { once: true });
}

// Startet (bzw. wechselt zu) einer benannten Playlist (siehe PLAYLISTS
// oben). Ruft bei bereits laufender, identischer Playlist nichts neu auf,
// damit ein wiederholter Aufruf (z.B. bei jedem Rundenwechsel) den
// aktuellen Track nicht unterbricht.
export function playMusic(playlistName) {
  const playlist = PLAYLISTS[playlistName];
  if (!playlist || playlist.length === 0) return;
  if (currentPlaylistName === playlistName && musicEl && !musicEl.paused) return;
  currentPlaylistName = playlistName;
  playTrack(pickNextTrack(playlist));
}

export function stopMusic() {
  currentPlaylistName = null;
  if (musicEl) musicEl.pause();
}

// Einzelner Ton mit kurzer Attack-/Exponential-Decay-Hüllkurve, optional
// mit Frequenz-Sweep (freqEnd) für Laser-/Sweep-artige Effekte.
function playTone({ freqStart, freqEnd, duration, type = "sine", volume = 1, delay = 0 }) {
  const c = ctx();
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
  }
  const peak = Math.max(0.0001, state.sfxVolume * volume);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Gefiltertes Rauschen mit fallender Cutoff-Frequenz – Basis für
// perkussive/"Wumms"-artige Effekte statt reiner Tonhöhen.
function playNoiseBurst({ duration, volume = 1, filterFreq = 1200, delay = 0 }) {
  const c = ctx();
  const t0 = c.currentTime + delay;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(80, filterFreq * 0.15), t0 + duration);
  const gain = c.createGain();
  const peak = Math.max(0.0001, state.sfxVolume * volume);
  gain.gain.setValueAtTime(peak, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  noise.connect(filter).connect(gain).connect(c.destination);
  noise.start(t0);
  noise.stop(t0 + duration + 0.02);
}

const SFX = {
  // Leiser, kurzer Klick für allgemeine UI-Bedienung (Buttons/Dialoge) –
  // bewusst dezent, damit er spezifischere Effekte (unten) nicht überdeckt.
  uiClick: () => playTone({ freqStart: 1000, freqEnd: 700, duration: 0.05, type: "square", volume: 0.15 }),
  // Aufsteigender Zweiklang – "Runde beenden".
  endTurn: () => {
    playTone({ freqStart: 440, freqEnd: 440, duration: 0.1, type: "sine", volume: 0.35 });
    playTone({ freqStart: 660, freqEnd: 660, duration: 0.16, type: "sine", volume: 0.3, delay: 0.09 });
  },
  // Absteigender Sägezahn-Sweep – Waffenfeuer im Kampf-Grid.
  weaponFire: () => playTone({ freqStart: 1400, freqEnd: 180, duration: 0.14, type: "sawtooth", volume: 0.3 }),
  // Tiefer, kurzer Rausch-Wumms – Schiffsverlust/Explosion.
  explosion: () => playNoiseBurst({ duration: 0.3, volume: 0.45, filterFreq: 900 }),
  // Aufsteigender Dreiklang – Forschungsdurchbruch.
  breakthrough: () => {
    playTone({ freqStart: 523, duration: 0.12, type: "triangle", volume: 0.3 });
    playTone({ freqStart: 659, duration: 0.12, type: "triangle", volume: 0.3, delay: 0.1 });
    playTone({ freqStart: 784, duration: 0.2, type: "triangle", volume: 0.32, delay: 0.2 });
  },
  // Zwei kurze, helle Pings – neue Ereignisse im Rundenereignis-Panel.
  alertNotify: () => {
    playTone({ freqStart: 880, duration: 0.07, type: "sine", volume: 0.25 });
    playTone({ freqStart: 880, duration: 0.07, type: "sine", volume: 0.25, delay: 0.1 });
  },
};

// Spielt einen benannten, synthetisierten Effekt (siehe SFX oben). Unbekannte
// Namen werden still ignoriert. Der erste Aufruf erzeugt den AudioContext –
// Browser verlangen dafür meist eine vorherige Nutzerinteraktion, ein davor
// liegender Aufruf schlägt daher u.U. lautlos fehl (try/catch), statt die
// Runde/Aktion selbst zu stören.
export function playSfx(name) {
  if (!state.sfxEnabled) return;
  const fn = SFX[name];
  if (!fn) return;
  try {
    fn();
  } catch {
    // AudioContext evtl. noch nicht durch Nutzerinteraktion freigegeben –
    // Soundeffekte sind rein kosmetisch, ein Fehlschlag bleibt folgenlos.
  }
}
