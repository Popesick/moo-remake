// Soundeffekt-Infrastruktur (ROADMAP v0.21, Synthese seit ROADMAP v0.31,
// Nutzerwunsch): statt echter Audio-Dateien (Lizenzfrage ungeklärt, siehe
// ROADMAP-Backlog) werden kurze, perkussive Effekte zur Laufzeit per Web
// Audio API aus Oszillatoren/Rauschen synthetisiert – kein Datei-Download,
// kein Lizenzrisiko. Hintergrundmusik ist bewusst NICHT umgesetzt: ein
// befriedigender Musik-Track lässt sich so nicht sinnvoll erzeugen, nur
// kurze Effekte. playMusic/stopMusic bleiben als No-Ops bestehen, damit
// js/main.js unverändert bleibt und die Musik-Regler in den Einstellungen
// (ROADMAP v0.21) weiterhin funktionieren, ohne etwas abzuspielen.
let audioCtx = null;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

const state = {
  musicEnabled: true,
  musicVolume: 0.6,
  sfxEnabled: true,
  sfxVolume: 0.8,
};

export function initAudio(settings) {
  state.musicEnabled = settings.musicEnabled ?? true;
  state.musicVolume = settings.musicVolume ?? 0.6;
  state.sfxEnabled = settings.sfxEnabled ?? true;
  state.sfxVolume = settings.sfxVolume ?? 0.8;
}

export function setMusicEnabled(enabled) {
  state.musicEnabled = enabled;
}

export function setSfxEnabled(enabled) {
  state.sfxEnabled = enabled;
}

export function setMusicVolume(volume) {
  state.musicVolume = volume;
}

export function setSfxVolume(volume) {
  state.sfxVolume = volume;
}

export function playMusic() {}
export function stopMusic() {}

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
