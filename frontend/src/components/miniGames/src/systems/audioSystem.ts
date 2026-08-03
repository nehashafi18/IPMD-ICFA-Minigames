// AudioManager — single-source-of-truth for all minigame audio
//
// BGM  : HTMLAudioElement — one instance per track, never duplicated
//          transition-page.mp3  = background music for the transition page
//          door-of-wonders.mp3  = background music for the minigame selection page
//          memory-match.mp3     = background music for the Memory Match instructions + gameplay
//          Cascade Bloom.mp3    = background music for the Cascade instructions + gameplay
//          Hidden Brushstrokes.mp3 = background music for Art Detective
//          Sunlit Memory Gallery.mp3 = background music for Memory Gallery
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

export type MusicMode = 'transition' | 'home' | 'memory-match' | 'cascade' | 'artDetective' | 'memoryGallery';

// One Audio element per track — created once at module load, never duplicated.
const BGM: Record<MusicMode, HTMLAudioElement> = {
  transition:    new Audio('/music/transition-page.mp3'),
  home:          new Audio('/music/door-of-wonders.mp3'),
  'memory-match': new Audio('/music/memory-match.mp3'),
  cascade:        new Audio('/music/Cascade%20Bloom.mp3'),
  artDetective:   new Audio('/music/Hidden%20Brushstrokes.mp3'),
  memoryGallery:  new Audio('/music/Sunlit%20Memory%20Gallery.mp3'),
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

function clearFade(): void {
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
}

// Always-on safety net: the very first gesture anywhere in the app (click, key,
// tap) unmutes and resumes whatever track is current. This is a no-op if audio
// is already playing unmuted — but it's essential because some browsers (Safari
// in particular) can silently ignore a JS-driven `.muted = false` on an element
// that was never started from a real gesture, leaving music playing-but-silent
// with no further signal that anything is wrong. Attaching this unconditionally,
// rather than only after both autoplay attempts fail, closes that gap.
let globalUnlockAttached = false;
function attachGlobalUnlock(): void {
  if (globalUnlockAttached || typeof document === 'undefined') return;
  globalUnlockAttached = true;
  const handler = () => {
    if (current) {
      const t = BGM[current];
      t.muted  = false;
      t.volume = prefs.musicVol;
      if (t.paused) t.play().catch(() => {});
    }
  };
  (['click', 'keydown', 'touchstart', 'pointerdown'] as const).forEach(ev =>
    document.addEventListener(ev, handler, { capture: true }),
  );
}
attachGlobalUnlock();

// Pause every track except `keep`. Does NOT reset currentTime.
function stopOthers(keep: MusicMode): void {
  (Object.keys(BGM) as MusicMode[]).forEach(m => {
    if (m !== keep) BGM[m].pause();
  });
}

// Start a track muted first — muted autoplay is allowed by every major browser
// with zero prior interaction — then unmute the instant it's playing. Trying
// unmuted first is skipped: on a fresh session it is essentially guaranteed to
// be rejected, and that failed round-trip only delays getting audio into the
// "playing" state. Chrome honors the immediate unmute with no gesture needed,
// so music is genuinely audible with zero clicks there. Safari's policy is
// stricter: it can silently keep a track muted unless the unmute happens
// inside a real user-gesture handler, which no page load ever is — in that
// case the track plays silently until attachGlobalUnlock() catches the
// user's first tap/click/keypress anywhere and unmutes it then.
function startTrack(mode: MusicMode): void {
  const audio = BGM[mode];
  audio.volume = prefs.musicVol;
  audio.muted  = true;

  const promise = audio.play();
  if (!promise) { audio.muted = false; return; } // legacy sync-play browsers

  promise
    .then(() => {
      audio.muted  = false;
      audio.volume = prefs.musicVol;
    })
    .catch(() => {
      // Even muted play was blocked (very restrictive browser / iframe).
      // The always-on global gesture listener (attachGlobalUnlock) will
      // start it on the user's first click/tap/keypress anywhere.
    });
}

export const bgMusic = {
  // ── Primary API ──────────────────────────────────────────────────────────

  /** Play a music track. Stops any other track first. No-ops if already playing. */
  playMusic(mode: MusicMode = 'transition'): void {
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

  start(mode: MusicMode = 'transition'): void { this.playMusic(mode); },
  stop():                             void { this.stopMusic(); },
  setMode(mode: MusicMode):           void { this.playMusic(mode); },

  /** Call from any user-gesture handler (click/tap) to unlock muted autoplay. */
  unlock(): void {
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
