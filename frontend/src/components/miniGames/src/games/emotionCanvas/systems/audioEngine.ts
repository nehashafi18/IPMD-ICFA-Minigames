import type { SoundId } from '../emotionCanvasData';

interface ActiveNodes {
  source?: AudioNode;
  gain: GainNode;
  extra?: AudioNode[];
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private active: ActiveNodes | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as never)['webkitAudioContext'])();
    return this.ctx;
  }

  private makeWhiteNoise(ctx: AudioContext): ScriptProcessorNode {
    const node = ctx.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = (e) => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;
    };
    return node;
  }

  private fadeIn(gain: GainNode, target = 0.15, duration = 1.5) {
    const ctx = this.getCtx();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + duration);
  }

  private fadeOut(gain: GainNode, duration = 1.2): Promise<void> {
    const ctx = this.getCtx();
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    return new Promise((r) => setTimeout(r, duration * 1000 + 100));
  }

  async stop() {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
    if (!this.active) return;
    const { gain, source, extra } = this.active;
    await this.fadeOut(gain);
    try {
      source && (source as OscillatorNode).stop?.();
      extra?.forEach((n) => (n as OscillatorNode).stop?.());
    } catch { /* already stopped */ }
    this.active = null;
  }

  async play(id: SoundId) {
    await this.stop();
    const ctx = this.getCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    this.active = { gain: masterGain };

    switch (id) {
      case 'rain': {
        const noise = this.makeWhiteNoise(ctx);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 1200; lp.Q.value = 0.7;
        noise.connect(lp); lp.connect(masterGain);
        this.active.source = noise;
        this.fadeIn(masterGain, 0.18);
        break;
      }
      case 'ocean': {
        const noise = this.makeWhiteNoise(ctx);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 800; lp.Q.value = 1.0;
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.12; lfoGain.gain.value = 400;
        lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
        lfo.start();
        noise.connect(lp); lp.connect(masterGain);
        this.active.source = noise;
        this.active.extra = [lfo];
        this.fadeIn(masterGain, 0.15);
        break;
      }
      case 'forest': {
        // Layered high-frequency chirp oscillators
        const chirps: OscillatorNode[] = [];
        const scheduleChirp = () => {
          if (!this.active) return;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.frequency.value = 2400 + Math.random() * 1800;
          osc.type = 'sine';
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
          osc.connect(g); g.connect(masterGain);
          osc.start(); osc.stop(ctx.currentTime + 0.1);
        };
        const id2 = setInterval(scheduleChirp, 280 + Math.random() * 400) as never;
        const noise = this.makeWhiteNoise(ctx);
        const lp = ctx.createBiquadFilter();
        lp.type = 'bandpass'; lp.frequency.value = 3500; lp.Q.value = 0.5;
        noise.connect(lp); lp.connect(masterGain);
        this.active.source = noise;
        this.active.extra = chirps;
        // store interval ref so stop() can clear it
        this.heartbeatTimer = id2;
        this.fadeIn(masterGain, 0.08);
        break;
      }
      case 'wind': {
        const noise = this.makeWhiteNoise(ctx);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.4;
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.frequency.value = 0.08; lfoG.gain.value = 300;
        lfo.connect(lfoG); lfoG.connect(bp.frequency);
        lfo.start();
        noise.connect(bp); bp.connect(masterGain);
        this.active.source = noise; this.active.extra = [lfo];
        this.fadeIn(masterGain, 0.12);
        break;
      }
      case 'calm': {
        // Gentle major chord: C3 E3 G3
        const freqs = [130.81, 164.81, 196.00, 261.63];
        const oscs = freqs.map((f) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = f;
          g.gain.value = 0.04;
          osc.connect(g); g.connect(masterGain);
          osc.start();
          return osc;
        });
        this.active.extra = oscs;
        this.fadeIn(masterGain, 0.6, 2.0);
        break;
      }
      case 'energetic': {
        const freqs = [261.63, 329.63, 392.00, 523.25];
        const oscs = freqs.map((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = i % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.value = f;
          g.gain.value = 0.035;
          osc.connect(g); g.connect(masterGain);
          osc.start();
          return osc;
        });
        this.active.extra = oscs;
        this.fadeIn(masterGain, 0.12, 1.5);
        break;
      }
      case 'heartbeat': {
        const beat = () => {
          if (!this.active) return;
          [[80, 0.05], [90, 0.22]].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, ctx.currentTime + delay);
            g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.04);
            g.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 0.2);
            osc.connect(g); g.connect(masterGain);
            osc.start(); osc.stop(ctx.currentTime + delay + 0.3);
          });
        };
        beat();
        this.heartbeatTimer = setInterval(beat, 850);
        this.active.gain.gain.value = 1;
        break;
      }
    }
  }

  setVolume(v: number) {
    if (this.active) this.active.gain.gain.value = Math.max(0, Math.min(1, v));
  }

  dispose() {
    this.stop();
    this.ctx?.close();
  }
}
