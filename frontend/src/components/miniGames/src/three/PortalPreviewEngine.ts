import { MEMORY_IMAGES } from '../systems/gameArt';

// ─── A single portal's live gameplay preview — pure motion, zero text ──────
//
// A "movie trailer" for the game behind the door: the real core mechanic,
// recognizable at a glance, with no instructions, HUD, score, or label of
// any kind inside the frame — that clutter can't be switched off in the
// real game screens, so this is a small, purpose-built, text-free scene per
// portal instead. Bright and warm inside, in deliberate contrast to the
// dark room around it. Actual gameplay (once you click in) is the real,
// unmodified game — this is only what you see through the glass first.
//
// Plain Canvas 2D, not WebGL: these are flat animated compositions (cards,
// circles, framed icons, a lens) with no need for a 3D pipeline, and a 2D
// context is essentially always available — no GPU context to lose.

export type WorldGameId = 'memory' | 'bubble' | 'artDetective' | 'memoryGallery';

// Bright, warm, alive — the deliberate opposite of the dark room outside.
const PALETTES: Record<WorldGameId, [string, string]> = {
  memory:        ['#fff0e6', '#f3a888'],
  bubble:        ['#e3fbf6', '#7fd8d0'],
  artDetective:  ['#fff6d9', '#f0c465'],
  memoryGallery: ['#f6ecff', '#c39cf0'],
};

const MEMORY_KEYS = ['cat', 'strawberry', 'star'] as const;
const GALLERY_KEYS = ['flower', 'moon', 'heart', 'leaf'] as const;

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number): void {
  const iw = img.naturalWidth || 1, ih = img.naturalHeight || 1;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale, sh = h / scale;
  const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export interface PortalPreviewOptions {
  canvas: HTMLCanvasElement;
  id: WorldGameId;
  urls: string[];
}

export class PortalPreviewEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private id: WorldGameId;
  private urls: string[];

  private artwork: (HTMLImageElement | null)[] = [];
  private icons: Record<string, HTMLImageElement | null> = {};
  private draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void = () => {};

  private dpr = Math.min(window.devicePixelRatio || 1, 2);
  private ro: ResizeObserver | null = null;
  private rafId = 0;
  private disposed = false;
  private startT = 0;
  private speedMul = 1;

  constructor(opts: PortalPreviewOptions) {
    this.canvas = opts.canvas;
    this.id = opts.id;
    this.urls = opts.urls;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;

    this.loadIcons();
    this.loadArtwork();

    if (this.id === 'memory') this.draw = this.buildMemory();
    else if (this.id === 'bubble') this.draw = this.buildCascade();
    else if (this.id === 'artDetective') this.draw = this.buildDetective();
    else this.draw = this.buildGallery();

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
    this.startT = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  setSpeed(mul: number): void { this.speedMul = mul; }

  private loadIcons(): void {
    for (const key of [...MEMORY_KEYS, ...GALLERY_KEYS]) {
      this.icons[key] = null;
      const img = new Image();
      img.onload = () => { this.icons[key] = img; };
      img.src = MEMORY_IMAGES[key];
    }
  }

  private loadArtwork(): void {
    this.artwork = new Array(this.urls.length).fill(null);
    this.urls.forEach((url, i) => {
      const img = new Image();
      img.onload = () => { this.artwork[i] = img; };
      img.src = url;
    });
  }

  // ── Memory Match — cards flip in pairs, glow softly when matched ─────────
  private buildMemory(): (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void {
    const order = [0, 0, 1, 1, 2, 2].sort(() => Math.random() - 0.5);
    const roles: (0 | 1)[] = [];
    const seen: Record<number, number> = {};
    for (const pairIdx of order) {
      roles.push((seen[pairIdx] ?? 0) as 0 | 1);
      seen[pairIdx] = (seen[pairIdx] ?? 0) + 1;
    }
    const PAIR_DUR = 3;

    return (ctx, w, h, t) => {
      const cols = 3, rows = 2, gap = w * 0.035;
      const cw = (w * 0.92 - gap * (cols - 1)) / cols;
      const ch = (h * 0.88 - gap * (rows - 1)) / rows;
      const originX = (w - (cw * cols + gap * (cols - 1))) / 2;
      const originY = (h - (ch * rows + gap * (rows - 1))) / 2;

      const total = t % (PAIR_DUR * 3);
      const activePair = Math.floor(total / PAIR_DUR);
      const lt = total % PAIR_DUR;

      for (let i = 0; i < 6; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const x = originX + col * (cw + gap), y = originY + row * (ch + gap);
        const cx = x + cw / 2, cy = y + ch / 2;
        const pairIdx = order[i], role = roles[i];
        const active = pairIdx === activePair;

        let scaleX = 1, showFace = false, glow = 0;
        if (active) {
          const openAt = role === 0 ? 0 : 0.3;
          const closeAt = role === 0 ? 1.8 : 2.1;
          if (lt < openAt) { scaleX = 1; showFace = false; }
          else if (lt < openAt + 0.3) {
            const p = (lt - openAt) / 0.3;
            scaleX = Math.abs(Math.cos(p * Math.PI / 2 + Math.PI / 2));
            showFace = p > 0.5;
          } else if (lt < closeAt) {
            scaleX = 1; showFace = true;
            if (lt > closeAt - 0.35) glow = (lt - (closeAt - 0.35)) / 0.35;
          } else if (lt < closeAt + 0.3) {
            const p = (lt - closeAt) / 0.3;
            scaleX = Math.abs(Math.cos(p * Math.PI / 2));
            showFace = p < 0.5;
          } else { scaleX = 1; showFace = false; }
        }

        ctx.save();
        if (glow > 0) {
          ctx.save();
          ctx.globalAlpha = glow * 0.7;
          ctx.shadowColor = '#fff3b0';
          ctx.shadowBlur = 28;
          roundRectPath(ctx, x - 6, y - 6, cw + 12, ch + 12, 18);
          ctx.fillStyle = '#fff3b0';
          ctx.fill();
          ctx.restore();
        }
        ctx.translate(cx, cy);
        ctx.scale(Math.max(scaleX, 0.03), 1 + glow * 0.04);
        ctx.translate(-cx, -cy);
        roundRectPath(ctx, x, y, cw, ch, 16);
        ctx.clip();
        if (showFace) {
          const key = MEMORY_KEYS[pairIdx];
          const icon = this.icons[key];
          ctx.fillStyle = '#fffaf2';
          ctx.fillRect(x, y, cw, ch);
          if (icon) drawImageCover(ctx, icon, x + cw * 0.06, y + ch * 0.06, cw * 0.88, ch * 0.88);
        } else {
          ctx.fillStyle = '#ffb37a';
          ctx.fillRect(x, y, cw, ch);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 3;
          for (let d = -ch; d < cw; d += 18) {
            ctx.beginPath();
            ctx.moveTo(x + d, y + ch);
            ctx.lineTo(x + d + ch, y);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    };
  }

  // ── Cascade — vivid pieces flowing/falling and interacting, pure motion ──
  // ── Cascade — the actual mechanic: ONE red ball falls continuously; the
  // scene starts calm with nothing else on screen. A blue projectile is
  // fired up at it — on impact the red ball shrinks (still falling) and
  // solid blue balls burst outward FROM the impact point. Blue balls only
  // ever exist after a hit, never fade, and accumulate as clutter each round.
  private buildCascade(): (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void {
    const FALL_DUR = 7.2;    // time for the red ball to cross the whole field
    const FIRE_INTERVAL = 1.6;
    const FLIGHT = 0.4;
    const EMERGE_DUR = 0.45; // burst-outward time right after impact
    const MAX_HITS = Math.floor(FALL_DUR / FIRE_INTERVAL);

    type BlueSpec = { hit: number; angle: number; reach: number; driftX: number; driftY: number; bob: number; size: number };
    const blues: BlueSpec[] = [];
    for (let hit = 0; hit < MAX_HITS; hit++) {
      const count = 2 + hit; // more distractions released with each successive hit
      for (let i = 0; i < count; i++) {
        blues.push({
          hit,
          angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
          reach: 1.6 + Math.random() * 0.8,
          driftX: (Math.random() - 0.5) * 0.04,
          driftY: 0.02 + Math.random() * 0.04,
          bob: Math.random() * 10,
          size: 0.8 + Math.random() * 0.35,
        });
      }
    }

    return (ctx, w, h, t) => {
      const R = Math.min(w, h) * 0.14;
      const turretY = h - R * 0.9;
      const lt = t % FALL_DUR;

      // Red ball falls the whole height continuously — it never stops.
      const redX = w / 2 + Math.sin(lt * 0.5) * w * 0.12;
      const redY = -R * 1.5 + (h + R * 3) * (lt / FALL_DUR);
      const hitsSoFar = Math.min(MAX_HITS, Math.floor(lt / FIRE_INTERVAL) +
        (lt % FIRE_INTERVAL >= FLIGHT ? 1 : 0));
      const redR = R * Math.max(0.28, 1 - hitsSoFar * 0.13);

      // Blue balls: none exist until the first hit. Each burst emerges from
      // the exact impact point and travels outward on a clear trajectory,
      // then settles into a slow drift — solid, opaque, never fading.
      for (const b of blues) {
        if (b.hit >= hitsSoFar) continue;
        const hitTime = b.hit * FIRE_INTERVAL + FLIGHT;
        const spawnX = w / 2 + Math.sin(hitTime * 0.5) * w * 0.12;
        const spawnY = -R * 1.5 + (h + R * 3) * (hitTime / FALL_DUR);
        const elapsed = lt - hitTime;
        const emergeP = Math.min(1, elapsed / EMERGE_DUR);
        const eased = 1 - Math.pow(1 - emergeP, 3);
        const settled = Math.max(0, elapsed - EMERGE_DUR);
        const dist = R * b.reach * eased + b.driftX * w * 2 * settled;
        const bx = spawnX + Math.cos(b.angle) * dist + Math.sin(elapsed * 1.2 + b.bob) * R * 0.1;
        const by = spawnY + Math.sin(b.angle) * dist + b.driftY * h * settled;
        const br = R * 0.26 * b.size * (0.4 + 0.6 * eased);

        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fillStyle = '#2e9dff';
        ctx.fill();
        ctx.lineWidth = Math.max(1.5, br * 0.12);
        ctx.strokeStyle = '#1568c9';
        ctx.stroke();
        // Solid specular highlight so the ball reads as a physical object.
        ctx.beginPath();
        ctx.ellipse(bx - br * 0.32, by - br * 0.32, br * 0.32, br * 0.2, -0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
        ctx.restore();
      }

      // Turret at the bottom, aimed up at the red ball's current position.
      const angle = Math.atan2(redY - turretY, redX - w / 2);
      ctx.save();
      ctx.translate(w / 2, turretY);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.55);
      ctx.lineTo(R * 0.38, R * 0.38);
      ctx.lineTo(-R * 0.38, R * 0.38);
      ctx.closePath();
      ctx.fillStyle = '#4fa8ff';
      ctx.shadowColor = '#4fa8ff';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();

      // In-flight projectile + a brief impact flash (the red ball itself
      // never pops — only a quick, fading ring marks the moment of contact).
      const withinShot = lt % FIRE_INTERVAL;
      if (withinShot < FLIGHT) {
        const p = withinShot / FLIGHT;
        const bx = w / 2 + (redX - w / 2) * p, by = turretY + (redY - turretY) * p;
        const pr = R * 0.18;
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, pr, 0, Math.PI * 2);
        ctx.fillStyle = '#2e9dff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1568c9';
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(bx - pr * 0.32, by - pr * 0.32, pr * 0.32, pr * 0.2, -0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
        ctx.restore();
      } else if (withinShot < FLIGHT + 0.25) {
        const p = (withinShot - FLIGHT) / 0.25;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(redX, redY, redR * (1 + p * 0.5), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // The red ball, always falling, drawn on top.
      ctx.save();
      ctx.shadowColor = '#ff4d4d';
      ctx.shadowBlur = 26;
      ctx.beginPath();
      ctx.arc(redX, redY, redR, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(redX - redR * 0.3, redY - redR * 0.3, redR * 0.1, redX, redY, redR);
      grad.addColorStop(0, '#ff8a80');
      grad.addColorStop(1, '#ff3b3b');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };
  }

  // ── Memory Gallery — artwork glows to life in sequence, pure light cues ──
  private buildGallery(): (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void {
    const seq = [0, 2, 1, 3];
    const WATCH_STEP = 0.85, GAP = 1.2;
    const cycle = seq.length * WATCH_STEP + GAP;

    return (ctx, w, h, t) => {
      // A 2×2 grid — a 1×4 row went absurdly tall/thin in this portrait portal.
      const N = 4, cols = 2, rows = 2, gap = w * 0.06;
      const cw = (w * 0.86 - gap * (cols - 1)) / cols;
      const ch = Math.min(cw * 1.25, (h * 0.82 - gap * (rows - 1)) / rows);
      const gridW = cw * cols + gap * (cols - 1);
      const gridH = ch * rows + gap * (rows - 1);
      const originX = (w - gridW) / 2;
      const originY = (h - gridH) / 2;

      const lt = t % cycle;
      const step = Math.floor(lt / WATCH_STEP);
      const within = (lt % WATCH_STEP) / WATCH_STEP;

      for (let i = 0; i < N; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const isActive = step < seq.length && seq[step] === i;
        const focus = isActive ? Math.sin(within * Math.PI) : 0;
        const x = originX + col * (cw + gap);
        const y = originY + row * (ch + gap) - focus * 10;
        const s = 1 + focus * 0.1;
        const cx = x + cw / 2, cy = y + ch / 2;

        ctx.save();
        if (focus > 0.02) {
          ctx.save();
          ctx.globalAlpha = focus * 0.75;
          ctx.shadowColor = '#ffe9a8';
          ctx.shadowBlur = 36;
          roundRectPath(ctx, x - 14, y - 14, cw + 28, ch + 28, 22);
          ctx.fillStyle = '#ffe9a8';
          ctx.fill();
          ctx.restore();
        }
        ctx.translate(cx, cy);
        ctx.scale(s, s);
        ctx.translate(-cx, -cy);
        roundRectPath(ctx, x, y, cw, ch, 18);
        ctx.fillStyle = '#f3e6ff';
        ctx.fill();
        const key = GALLERY_KEYS[i];
        const icon = this.icons[key];
        const pad = cw * 0.08;
        ctx.save();
        roundRectPath(ctx, x + pad, y + pad, cw - pad * 2, ch - pad * 2, 12);
        ctx.clip();
        if (icon) drawImageCover(ctx, icon, x + pad, y + pad, cw - pad * 2, ch - pad * 2);
        ctx.restore();
        ctx.restore();
      }
    };
  }

  // ── Art Detective — lens roams the artwork, clues glow when found ────────
  private buildDetective(): (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void {
    const artIdx = Math.floor(Math.random() * Math.max(1, this.urls.length));
    const clueSpecs = [
      { fx: -0.28, fy: -0.28, at: 1.4 }, { fx: 0.3, fy: 0.15, at: 4.6 }, { fx: -0.16, fy: 0.3, at: 7.3 },
    ];
    const CYCLE = 9;

    return (ctx, w, h, t) => {
      const artW = w * 0.86, artH = h * 0.86;
      const ax = (w - artW) / 2, ay = (h - artH) / 2;
      const cx = w / 2, cy = h / 2;

      ctx.save();
      roundRectPath(ctx, ax, ay, artW, artH, 20);
      ctx.clip();
      const img = this.artwork[artIdx];
      if (img) drawImageCover(ctx, img, ax, ay, artW, artH);
      else { ctx.fillStyle = '#f0c465'; ctx.fillRect(ax, ay, artW, artH); }
      ctx.restore();

      const lt = t % CYCLE;
      for (const clue of clueSpecs) {
        const dt = Math.abs(lt - clue.at);
        const env = dt < 0.6 ? (1 - dt / 0.6) : 0;
        if (env <= 0.01) continue;
        const x = cx + clue.fx * w, y = cy + clue.fy * h;
        ctx.save();
        ctx.globalAlpha = env * 0.95;
        ctx.strokeStyle = '#5fe08a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x, y, 22 + env * 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const lensR = Math.min(w, h) * 0.16;
      const lx = cx + Math.sin(lt * 0.9) * w * 0.3;
      const ly = cy + Math.sin(lt * 0.6 + 1.1) * h * 0.32;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      roundRectPath(ctx, lensR * 0.55, lensR * 0.85, lensR * 0.32, lensR * 1.3, lensR * 0.16);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(lx, ly);
      ctx.beginPath();
      ctx.arc(0, 0, lensR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fill();
      ctx.lineWidth = lensR * 0.16;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    };
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.ro?.disconnect();
  }

  private tick = (now: number): void => {
    if (this.disposed) return;
    const t = ((now - this.startT) / 1000) * this.speedMul;

    const w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const [top, bottom] = PALETTES[this.id];
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.draw(ctx, w, h, t);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
