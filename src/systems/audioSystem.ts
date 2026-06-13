// Web Audio API — procedural soft sound effects, no external files needed

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  gainPeak: number,
  detune = 0,
): void {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    osc.detune.setValueAtTime(detune, ac.currentTime);

    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration + 0.05);
  } catch {
    // AudioContext not allowed yet — user hasn't interacted
  }
}

export const sounds = {
  pop(): void {
    playTone(880, 'sine', 0.18, 0.15);
    playTone(1100, 'sine', 0.12, 0.08, 5);
  },

  match(): void {
    [523.25, 659.25, 783.99].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.22, 0.12), i * 80);
    });
  },

  chime(): void {
    [1046.5, 1318.5].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.4, 0.09), i * 120);
    });
  },

  sparkle(): void {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(1200 + Math.random() * 800, 'sine', 0.15, 0.06), i * 40);
    }
  },

  flip(): void {
    playTone(440, 'sine', 0.12, 0.08);
  },

  wrong(): void {
    playTone(350, 'sine', 0.12, 0.08);
    setTimeout(() => playTone(270, 'sine', 0.18, 0.07), 110);
  },

  reveal(): void {
    playTone(660, 'triangle', 0.25, 0.1);
    playTone(880, 'sine', 0.2, 0.07, 3);
  },

  complete(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.5, 0.1), i * 100);
    });
  },

  shoot(): void {
    playTone(300, 'sawtooth', 0.1, 0.06);
    playTone(400, 'sine', 0.12, 0.05, -5);
  },
};
