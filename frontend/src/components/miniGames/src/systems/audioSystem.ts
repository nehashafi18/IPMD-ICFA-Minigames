// AudioManager — single-source-of-truth for all minigame audio
//
// BGM  : HTMLAudioElement — one instance per track, never duplicated
//        Kevin MacLeod (incompetech.com) · CC BY 4.0
//          menu.mp3    = "Gymnopedie No 1"   (calm piano — menu / transition / home)
//          game.mp3    = "Chipper Doodle v2" (fast chiptune — active gameplay)
//          waiting.mp3 = "Sneaky Snitch"     (bouncy staccato — answer / thinking phase)
// SFX  : Web Audio API — synthesized oscillators, no files
// Prefs: musicVol + sfxVol persisted to localStorage

// ── Preferences ───────────────────────────────────────────────────────────────

const PREF_KEY = 'mg_audio_prefs';
interface Prefs { musicVol: number; sfxVol: number; }

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return { musicVol: 0.8, sfxVol: 0.8, ...JSON.parse(raw) as Partial<Prefs> };
  } catch { /* storage unavailable */ }
  return { musicVol: 0.8, sfxVol: 0.8 };
}
function savePrefs(): void {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* ok */ }
}

const prefs = loadPrefs();

// ── Sound Effects (Web Audio API) ─────────────────────────────────────────────

let sfxCtx: AudioContext | null = null;

function getSfxCtx(): AudioContext {
  if (!sfxCtx) sfxCtx = new AudioContext();
  if (sfxCtx.state === 'suspended') sfxCtx.resume();
  return sfxCtx;
}

function playTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  gainPeak: number,
  detune = 0,
): void {
  try {
    const ac = getSfxCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    osc.detune.setValueAtTime(detune, ac.currentTime);
    const peak = gainPeak * prefs.sfxVol;
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration + 0.05);
  } catch { /* AudioContext not yet unlocked */ }
}

export const sounds = {
  pop():      void { playTone(880, 'sine', 0.18, 0.15); playTone(1100, 'sine', 0.12, 0.08, 5); },
  flip():     void { playTone(440, 'sine', 0.12, 0.08); },
  reveal():   void { playTone(660, 'triangle', 0.25, 0.1); playTone(880, 'sine', 0.2, 0.07, 3); },
  shoot():    void { playTone(300, 'sawtooth', 0.1, 0.06); playTone(400, 'sine', 0.12, 0.05, -5); },
  match():    void { [523.25, 659.25, 783.99].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.22, 0.12), i * 80)); },
  chime():    void { [1046.5, 1318.5].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.4, 0.09), i * 120)); },
  sparkle():  void { for (let i = 0; i < 5; i++) setTimeout(() => playTone(1200 + Math.random() * 800, 'sine', 0.15, 0.06), i * 40); },
  complete(): void { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.5, 0.1), i * 100)); },
  correct():  void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.38, 0.16), i * 70));
    setTimeout(() => { playTone(130.81, 'sine', 0.6, 0.07); playTone(196.00, 'sine', 0.6, 0.06); }, 0);
  },
  wrong(): void {
    playTone(311.13, 'sawtooth', 0.22, 0.12);
    setTimeout(() => playTone(261.63, 'sawtooth', 0.22, 0.10), 130);
    setTimeout(() => playTone(220.00, 'sawtooth', 0.30, 0.09), 260);
    playTone(80, 'sine', 0.25, 0.14);
  },
};

// ── Background Music (HTMLAudioElement) ───────────────────────────────────────

export type MusicMode = 'intro' | 'game' | 'waiting';

// One Audio element per track — created once at module load, never duplicated.
const BGM: Record<MusicMode, HTMLAudioElement> = {
  intro:   new Audio('/music/menu.mp3'),
  game:    new Audio('/music/game.mp3'),
  waiting: new Audio('/music/waiting.mp3'),
};

(Object.values(BGM) as HTMLAudioElement[]).forEach(t => {
  t.loop    = true;
  t.preload = 'auto';
  t.volume  = prefs.musicVol;
});

// `current` is the one track that is (or should be) playing.
// No other track may play while current is set — enforced by stopOthers().
let current: MusicMode | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
// True once the browser's autoplay policy has been satisfied by a user gesture.
let interacted = false;
// Prevents registering duplicate unlock listeners when play() fails more than once.
let unlockPending = false;

function clearFade(): void {
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
}

// Pause every track except `keep`. Does NOT reset currentTime.
function stopOthers(keep: MusicMode): void {
  (Object.keys(BGM) as MusicMode[]).forEach(m => {
    if (m !== keep) BGM[m].pause();
  });
}

// Attempt to start a track. Falls back to muted autoplay when the browser
// blocks unmuted play, then registers a one-time gesture listener to unmute.
function startTrack(mode: MusicMode): void {
  const audio = BGM[mode];
  audio.muted  = false;
  audio.volume = prefs.musicVol;

  const promise = audio.play();
  if (!promise) return;

  promise
    .then(() => { interacted = true; })
    .catch(() => {
      // Browser blocked unmuted play — run muted so position advances from frame 1.
      audio.muted = true;
      audio.play().catch(() => {});

      // Register unlock listeners only once, not on every failed play() call.
      if (interacted || unlockPending) return;
      unlockPending = true;

      const handler = () => {
        unlockPending = false;
        interacted    = true;
        if (current) {
          BGM[current].muted  = false;
          BGM[current].volume = prefs.musicVol;
          if (BGM[current].paused) BGM[current].play().catch(() => {});
        }
        (['click', 'keydown', 'touchstart', 'pointerdown'] as const).forEach(ev =>
          document.removeEventListener(ev, handler, { capture: true } as AddEventListenerOptions),
        );
      };

      (['click', 'keydown', 'touchstart', 'pointerdown'] as const).forEach(ev =>
        document.addEventListener(ev, handler, { capture: true }),
      );
    });
}

export const bgMusic = {
  // ── Primary API ──────────────────────────────────────────────────────────

  /** Play a music track. Stops any other track first. No-ops if already playing. */
  playMusic(mode: MusicMode = 'intro'): void {
    if (current === mode && !BGM[mode].paused) return;
    clearFade();
    stopOthers(mode);
    current = mode;
    if (BGM[mode].paused) startTrack(mode);
  },

  /** Stop all music and clear the active track. */
  stopMusic(): void {
    clearFade();
    current = null;
    (Object.values(BGM) as HTMLAudioElement[]).forEach(t => t.pause());
  },

  /** Smoothly fade out the current track over `durationMs` milliseconds. */
  fadeOutMusic(durationMs = 800): void {
    if (!current || BGM[current].paused) { this.stopMusic(); return; }
    clearFade();
    const track    = BGM[current];
    const startVol = track.volume;
    const steps    = Math.max(1, Math.round(durationMs / 50));
    const decrement = startVol / steps;
    fadeTimer = setInterval(() => {
      track.volume = Math.max(0, track.volume - decrement);
      if (track.volume <= 0) {
        this.stopMusic();
      }
    }, 50);
  },

  /** Set BGM volume (0–1). Also unmutes the current track if it was blocked. */
  setMusicVolume(v: number): void {
    prefs.musicVol = Math.max(0, Math.min(1, v));
    (Object.values(BGM) as HTMLAudioElement[]).forEach(t => { t.volume = prefs.musicVol; });
    if (current) {
      BGM[current].muted = false;
      if (BGM[current].paused) BGM[current].play().catch(() => {});
    }
    interacted = true;
    savePrefs();
  },

  /** Toggle BGM volume between 0 and the saved preference. */
  toggleMute(): void {
    const isMuted = current ? BGM[current].volume === 0 : false;
    (Object.values(BGM) as HTMLAudioElement[]).forEach(t => {
      t.volume = isMuted ? prefs.musicVol : 0;
    });
    if (isMuted && current && BGM[current].paused) {
      BGM[current].play().catch(() => {});
    }
  },

  // ── Backward-compatible aliases used by existing components ──────────────

  start(mode: MusicMode = 'intro'): void { this.playMusic(mode); },
  stop():                             void { this.stopMusic(); },
  setMode(mode: MusicMode):           void { this.playMusic(mode); },

  /** Call from any user-gesture handler (click/tap) to unlock muted autoplay. */
  unlock(): void {
    interacted = true;
    if (!current) return;
    BGM[current].muted  = false;
    BGM[current].volume = prefs.musicVol;
    if (BGM[current].paused) BGM[current].play().catch(() => {});
  },

  /** Temporarily lower BGM volume during a victory/defeat jingle. */
  duck(durationMs = 1600): void {
    if (!current) return;
    const t = BGM[current];
    t.volume = Math.max(0, prefs.musicVol * 0.2);
    setTimeout(() => { t.volume = prefs.musicVol; }, durationMs);
  },
};

// ── Audio Settings (volume controls for the UI) ───────────────────────────────

export const audioSettings = {
  get musicVol(): number { return prefs.musicVol; },
  get sfxVol():   number { return prefs.sfxVol; },

  setMusicVol(v: number): void {
    bgMusic.setMusicVolume(v);
  },

  setSfxVol(v: number): void {
    prefs.sfxVol = Math.max(0, Math.min(1, v));
    savePrefs();
  },
};
