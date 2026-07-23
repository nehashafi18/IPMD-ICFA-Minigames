import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound }    from '../../hooks/useSound';
import { useAppStore } from '../../store/useAppStore';
import ArtDetectiveInstructions from './ArtDetectiveInstructions';
import { STATIC_SCENES, type SceneData, type HiddenItem } from './staticSceneData';

interface Props { onBack: () => void; }
type Phase = 'level-intro' | 'playing' | 'level-complete' | 'game-complete';
interface Ripple { id: number; imgX: number; imgY: number; correct: boolean; t: number; }

// ── Layout constants ──────────────────────────────────────────────────────────
const PANEL_W   = 200;
const ICON_SZ   = 120;
const RIPPLE_MS = 260;

// ── Letterbox: fit image inside canvas preserving aspect ratio ────────────────
function lb(cW: number, cH: number, iW: number, iH: number) {
  const ar = iW / iH;
  if (cW / cH >= ar) {
    const dH = cH, dW = cH * ar;
    return { dX: (cW - dW) / 2, dY: 0, dW, dH };
  }
  const dW = cW, dH = cW / ar;
  return { dX: 0, dY: (cH - dH) / 2, dW, dH };
}

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ── SVG primitives ────────────────────────────────────────────────────────────
function BackArrow() {
  return (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none"
      stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 4 7 10 13 16" />
    </svg>
  );
}

function HintLamp({ dim }: { dim: boolean }) {
  const c = dim ? 'rgba(255,255,255,0.15)' : '#9B6FD8';
  return (
    <svg viewBox="0 0 22 22" width="18" height="18" fill="none"
      stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="9" r="5"/>
      <path d="M8 14.5h6M9 17h4"/>
      <path d="M11 2v1.5M4.5 4.5l1 1M17.5 4.5l-1 1M2 10h1.5M19 10h-1.5"/>
    </svg>
  );
}

function Tick({ sz = 11, color = '#fff' }: { sz?: number; color?: string }) {
  return (
    <svg viewBox="0 0 16 16" width={sz} height={sz} fill="none"
      stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 4 6.5 11.5 3 8"/>
    </svg>
  );
}

// ── Side panel ────────────────────────────────────────────────────────────────
function ItemPanel({ items, found }: { items: HiddenItem[]; found: Set<string> }) {
  const nFound = found.size;
  const nTotal = items.length;

  return (
    <div style={{
      width: PANEL_W, minWidth: PANEL_W, height: '100%', flexShrink: 0,
      background: '#05080F',
      borderRight: '1px solid rgba(155,111,216,0.12)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Quicksand, sans-serif',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 12px 10px',
        borderBottom: '1px solid rgba(155,111,216,0.10)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 24, letterSpacing: 3, textTransform: 'uppercase',
          color: 'rgba(155,111,216,0.55)', fontWeight: 700, textAlign: 'center',
          marginBottom: 10,
        }}>
          Find
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 7 }}>
          {items.map((it) => {
            const done = found.has(it.id);
            return (
              <div key={it.id} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: done ? '#5AC870' : 'rgba(155,111,216,0.12)',
                border: `1.5px solid ${done ? '#5AC870' : 'rgba(155,111,216,0.22)'}`,
                transition: 'background 0.35s, border-color 0.35s',
                boxShadow: done ? '0 0 6px rgba(90,200,112,0.5)' : 'none',
              }}/>
            );
          })}
        </div>

        <div style={{
          textAlign: 'center', fontSize: 28,
          color: nFound === nTotal ? 'rgba(90,200,112,0.75)' : 'rgba(155,111,216,0.45)',
          transition: 'color 0.35s',
        }}>
          {nFound} / {nTotal} found
        </div>
      </div>

      {/* ── Item list ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px 10px',
        display: 'flex', flexDirection: 'column', gap: 9,
      }}>
        {items.map((item, i) => {
          const done = found.has(item.id);
          return (
            <div key={item.id} style={{
              borderRadius: 12,
              background: done ? 'rgba(90,200,112,0.07)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${done ? 'rgba(90,200,112,0.25)' : 'rgba(155,111,216,0.10)'}`,
              padding: '10px 8px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              position: 'relative',
              transition: 'background 0.35s, border-color 0.35s',
            }}>

              {/* Number badge */}
              <div style={{
                position: 'absolute', top: 7, left: 8,
                width: 18, height: 18, borderRadius: '50%',
                background: done ? '#5AC870' : 'rgba(155,111,216,0.10)',
                border: `1px solid ${done ? '#5AC870' : 'rgba(155,111,216,0.22)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.35s',
              }}>
                {done
                  ? <Tick sz={9} />
                  : <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(155,111,216,0.5)', lineHeight: 1 }}>{i + 1}</span>
                }
              </div>

              {/* Icon — same SVG asset drawn on canvas */}
              <div style={{
                width: ICON_SZ, height: ICON_SZ,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                opacity: done ? 0.55 : 1,
                transition: 'opacity 0.35s',
              }}>
                <img
                  src={item.assetSrc}
                  alt={item.label}
                  draggable={false}
                  style={{ width: ICON_SZ - 8, height: ICON_SZ - 8, objectFit: 'contain' }}
                />

                {done && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 10,
                    background: 'rgba(10,30,12,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#5AC870',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(90,200,112,0.45)',
                    }}>
                      <Tick sz={14} />
                    </div>
                  </div>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: 22, fontWeight: 700, lineHeight: 1.2,
                textAlign: 'center', maxWidth: '100%',
                color: done ? 'rgba(90,200,112,0.8)' : 'rgba(255,240,200,0.85)',
                transition: 'color 0.35s',
              }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({
  onBack, timeLeft, total, onHint, hintUsed, sceneTitle,
}: {
  onBack: () => void; timeLeft: number; total: number;
  onHint: () => void; hintUsed: boolean; sceneTitle: string;
}) {
  const pct = Math.max(0, timeLeft / total);
  const tColor = pct > 0.5 ? '#5AC870' : pct > 0.25 ? '#FFA726' : '#EF5350';

  return (
    <div style={{
      flexShrink: 0,
      background: '#050810',
      borderBottom: '1px solid rgba(155,111,216,0.09)',
      fontFamily: 'Quicksand, sans-serif',
    }}>
      {/* Main row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '14px 16px', gap: 14,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 6px', display: 'flex', flexShrink: 0,
        }}>
          <BackArrow />
        </button>

        {/* Scene title */}
        <span style={{
          flex: 1, minWidth: 0,
          fontSize: 28, fontWeight: 600, letterSpacing: 0.3,
          color: 'rgba(155,111,216,0.45)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {sceneTitle}
        </span>

        {/* Timer */}
        <span style={{
          fontSize: 28, fontWeight: 700, color: tColor,
          fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5,
          flexShrink: 0, transition: 'color 0.5s',
        }}>
          {fmt(timeLeft)}
        </span>

        {/* Hint button */}
        <button onClick={onHint} disabled={hintUsed} style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 12px', borderRadius: 8,
          fontSize: 28, fontWeight: 600,
          background: hintUsed ? 'transparent' : 'rgba(155,111,216,0.09)',
          border: `1px solid ${hintUsed ? 'rgba(255,255,255,0.05)' : 'rgba(155,111,216,0.28)'}`,
          color: hintUsed ? 'rgba(255,255,255,0.14)' : '#9B6FD8',
          cursor: hintUsed ? 'default' : 'pointer',
          transition: 'opacity 0.3s',
        }}>
          <HintLamp dim={hintUsed} />
          Hint
        </button>
      </div>

      {/* Timer bar — full width */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{
          height: '100%', background: tColor,
          width: `${pct * 100}%`,
          transition: 'width 1s linear, background 0.5s',
        }}/>
      </div>
    </div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────
export default function ArtDetectiveGame({ onBack }: Props) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [levelIdx,    setLevelIdx]    = useState(0);
  const [phase,       setPhase]       = useState<Phase>('level-intro');
  const [found,       setFound]       = useState<Set<string>>(new Set());
  const [ripples,     setRipples]     = useState<Ripple[]>([]);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintUsed,    setHintUsed]    = useState(false);
  const [wrongCount,  setWrongCount]  = useState(0);
  const [totalScore,  setTotalScore]  = useState(0);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const imgRef         = useRef<HTMLImageElement | null>(null);
  const objImgMapRef   = useRef<Map<string, HTMLImageElement>>(new Map());
  // Ambient color sampled from the background at each item's position.
  // Used to tint objects toward scene lighting so they feel painted in.
  const ambientRef     = useRef<Map<string, { r: number; g: number; b: number }>>(new Map());
  // Pre-generated warm-grain noise tile drawn as a painterly texture overlay.
  const grainRef       = useRef<HTMLCanvasElement | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const rippleIdRef    = useRef(0);
  const rafRef         = useRef<number | null>(null);

  // Live refs so draw() never captures stale state
  const foundRef     = useRef(found);
  const hintRef      = useRef(hintVisible);
  const ripplesRef   = useRef(ripples);
  foundRef.current   = found;
  hintRef.current    = hintVisible;
  ripplesRef.current = ripples;

  const { play }    = useSound();
  const updateScore = useAppStore((s) => s.updateScore);
  const scene: SceneData = STATIC_SCENES[levelIdx];

  // ── Painterly grain tile — generated once on mount ───────────────────────
  // 512×512 warm-noise bitmap, drawn at low opacity in overlay blend mode
  // over the scene to give a subtle hand-painted texture feel.
  useEffect(() => {
    const W = 512, H = 512;
    const gc = document.createElement('canvas');
    gc.width = W; gc.height = H;
    const gctx = gc.getContext('2d')!;
    const data = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < data.length; i += 4) {
      const lum = 92 + Math.round(Math.random() * 64); // 92–156, centred below overlay neutral
      data[i]   = lum;                                  // R — warm bias
      data[i+1] = Math.round(lum * 0.91);              // G
      data[i+2] = Math.round(lum * 0.77);              // B — warm bias
      data[i+3] = Math.round(60 + Math.random() * 80); // alpha 60–140 — visible through overlay blend
    }
    gctx.putImageData(new ImageData(data, W, H), 0, 0);
    grainRef.current = gc;
  }, []);

  // ── Background image load + ambient color sampling ────────────────────────
  useEffect(() => {
    imgRef.current = null;
    ambientRef.current = new Map();
    setLoadTimedOut(false);
    const timeout = setTimeout(() => {
      if (!imgRef.current) setLoadTimedOut(true);
    }, 8000);
    const img = new Image();
    img.src = `${scene.imageSrc}?t=${Date.now()}`;
    img.onload = () => {
      clearTimeout(timeout);
      imgRef.current = img;

      // Sample the background colour at each item's location so draw() can tint
      // each object toward the scene's local lighting temperature.
      const sampleW = Math.min(img.naturalWidth,  512);
      const sampleH = Math.min(img.naturalHeight, 512);
      const tmp  = document.createElement('canvas');
      tmp.width  = sampleW;
      tmp.height = sampleH;
      const tc   = tmp.getContext('2d')!;
      tc.drawImage(img, 0, 0, sampleW, sampleH);
      const scX = sampleW / scene.imageW;
      const scY = sampleH / scene.imageH;

      const map = new Map<string, { r: number; g: number; b: number }>();
      for (const item of scene.items) {
        const r  = Math.max(4, Math.round(Math.max(item.w, item.h) * 0.45 * scX));
        const x1 = Math.max(0, Math.min(Math.round(item.cx * scX) - r, sampleW - 1));
        const y1 = Math.max(0, Math.min(Math.round(item.cy * scY) - r, sampleH - 1));
        const sw = Math.min(r * 2, sampleW  - x1);
        const sh = Math.min(r * 2, sampleH - y1);
        if (sw < 1 || sh < 1) { map.set(item.id, { r: 150, g: 122, b: 85 }); continue; }
        const px = tc.getImageData(x1, y1, sw, sh);
        let sr = 0, sg = 0, sb = 0;
        const n = px.data.length / 4;
        for (let i = 0; i < px.data.length; i += 4) {
          sr += px.data[i]; sg += px.data[i + 1]; sb += px.data[i + 2];
        }
        map.set(item.id, { r: sr / n, g: sg / n, b: sb / n });
      }
      ambientRef.current = map;
      scheduleDraw();
    };
    img.onerror = () => { clearTimeout(timeout); setLoadTimedOut(true); };
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIdx]);

  // ── Object asset loading ──────────────────────────────────────────────────
  // Each item's assetSrc is loaded once and cached. The same HTMLImageElement
  // is drawn on the canvas and displayed in the sidebar — pixel-identical.
  useEffect(() => {
    const map = objImgMapRef.current;
    for (const item of scene.items) {
      if (map.has(item.assetSrc)) continue;
      const img = new Image();
      img.onload  = () => { map.set(item.assetSrc, img); scheduleDraw(); };
      img.src = item.assetSrc;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sync canvas backing store to physical pixels on every draw.
    // ResizeObserver fires async, so cached images can load before it runs.
    // Without this, canvas stays at its HTML default 300×150 and gets CSS-upscaled.
    const dpr   = window.devicePixelRatio || 1;
    const physW = Math.round(canvas.offsetWidth  * dpr);
    const physH = Math.round(canvas.offsetHeight * dpr);
    if (physW > 0 && physH > 0 && (canvas.width !== physW || canvas.height !== physH)) {
      canvas.width  = physW;
      canvas.height = physH;
    }

    const CW = canvas.width, CH = canvas.height;
    const { imageW: IW, imageH: IH } = scene;
    const { dX, dY, dW, dH } = lb(CW, CH, IW, IH);

    // image pixel → canvas pixel helpers
    const ix = (v: number) => dX + (v / IW) * dW;
    const iy = (v: number) => dY + (v / IH) * dH;
    const ir = (r: number) => r * (dW / IW);

    // Background
    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = '#05080F';
    ctx.fillRect(0, 0, CW, CH);

    // ── Scene background image (letterboxed, with per-scene style filter) ──
    if (imgRef.current) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgRef.current, dX, dY, dW, dH);
      ctx.restore();

      // Vignette — applied after filter so it isn't tinted
      const vcx = dX + dW / 2, vcy = dY + dH / 2;
      const vg = ctx.createRadialGradient(vcx, vcy, Math.min(dW, dH) * 0.22, vcx, vcy, Math.max(dW, dH) * 0.76);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(4,6,15,0.48)');
      ctx.save(); ctx.fillStyle = vg; ctx.fillRect(dX, dY, dW, dH); ctx.restore();

      // Painterly grain overlay — subtle warm noise tiled across the scene area
      const grain = grainRef.current;
      if (grain) {
        const GW = grain.width, GH = grain.height;
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.10;
        for (let gx = dX; gx < dX + dW; gx += GW) {
          for (let gy = dY; gy < dY + dH; gy += GH) {
            const tw = Math.min(GW, (dX + dW) - gx);
            const th = Math.min(GH, (dY + dH) - gy);
            ctx.drawImage(grain, 0, 0, tw, th, gx, gy, tw, th);
          }
        }
        ctx.restore();
      }
    }

    // ── Hidden objects — placed programmatically, visually harmonised ────
    //
    // Each object is drawn in three passes:
    //   1. Contact shadow  — blurred ellipse grounded at the object's base
    //   2. Object image    — with ctx.filter tuned to local ambient colour:
    //                        sepia shifts hue warm, saturate de-vectors,
    //                        brightness matches scene luminance, blur
    //                        softens SVG edges to painterly sharpness
    //   3. Ambient bleed   — a faint colour tint using source-atop on a
    //                        temp canvas, so only the object pixels are tinted
    //
    // The sidebar <img> renders the raw SVG at full fidelity.
    // ctx.filter is ONLY applied to the canvas draw, never to the asset file.
    for (const item of scene.items) {
      if (foundRef.current.has(item.id)) continue;
      const oImg = objImgMapRef.current.get(item.assetSrc);
      if (!oImg) continue;

      const canvasCX = ix(item.cx);
      const canvasCY = iy(item.cy);
      const canvasW  = (item.w / IW) * dW;
      const canvasH  = (item.h / IH) * dH;

      // Local scene colour at this item's position
      const amb = ambientRef.current.get(item.id) ?? { r: 150, g: 122, b: 85 };
      const warmShift   = Math.max(0, Math.min(1, (amb.r - amb.b) / 160));
      const sceneBright = Math.min(1, (amb.r + amb.g + amb.b) / (3 * 200));

      // ── Pass 1: contact shadow ──────────────────────────────────────────
      {
        const sBlur = Math.max(3, Math.round(canvasH * 0.22));
        ctx.save();
        ctx.translate(canvasCX, canvasCY);
        ctx.rotate(item.rotation * Math.PI / 180);
        ctx.filter = `blur(${sBlur}px)`;
        ctx.globalAlpha = 0.28 + warmShift * 0.10;
        ctx.fillStyle = `rgb(${Math.round(amb.r * 0.15)},${Math.round(amb.g * 0.10)},${Math.round(amb.b * 0.07)})`;
        ctx.beginPath();
        ctx.ellipse(canvasW * 0.04, canvasH * 0.41, canvasW * 0.42, canvasH * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── Pass 2: draw object — no CSS filter, SD assets are already on-style ──
      {
        ctx.save();
        ctx.translate(canvasCX, canvasCY);
        ctx.rotate(item.rotation * Math.PI / 180);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(oImg, -canvasW / 2, -canvasH / 2, canvasW, canvasH);
        ctx.restore();
      }

    }

    // ── Found overlays ────────────────────────────────────────────────────
    for (const item of scene.items) {
      if (!foundRef.current.has(item.id)) continue;
      const cx = ix(item.cx), cy = iy(item.cy);
      const cr = ir(Math.max(item.w, item.h) / 2);

      ctx.save();
      ctx.fillStyle = 'rgba(90,200,112,0.14)';
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#5AC870';
      ctx.lineWidth   = Math.max(2.5, CW * 0.003);
      ctx.shadowColor = 'rgba(90,200,112,0.45)';
      ctx.shadowBlur  = 10;
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      const br = cr * 0.30;
      ctx.save();
      ctx.fillStyle   = '#5AC870';
      ctx.shadowColor = 'rgba(90,200,112,0.55)';
      ctx.shadowBlur  = 8;
      ctx.beginPath(); ctx.arc(cx, cy, br, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      const ts = br * 0.55;
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = Math.max(1.5, br * 0.32);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - ts, cy + ts * 0.04);
      ctx.lineTo(cx - ts * 0.1, cy + ts * 0.74);
      ctx.lineTo(cx + ts, cy - ts * 0.74);
      ctx.stroke();
      ctx.restore();
    }

    // ── Hint overlay ──────────────────────────────────────────────────────
    if (hintRef.current) {
      for (const item of scene.items) {
        if (foundRef.current.has(item.id)) continue;
        const cx = ix(item.cx), cy = iy(item.cy);
        const cr = ir(Math.max(item.w, item.h) / 2);
        const sr = cr * 2.6;

        const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
        sg.addColorStop(0, 'rgba(155,111,216,0.24)');
        sg.addColorStop(0.5, 'rgba(155,111,216,0.08)');
        sg.addColorStop(1, 'rgba(155,111,216,0)');
        ctx.save();
        ctx.fillStyle = sg;
        ctx.fillRect(cx - sr, cy - sr, sr * 2, sr * 2);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = 'rgba(155,111,216,0.88)';
        ctx.lineWidth   = Math.max(1.5, CW * 0.0025);
        ctx.setLineDash([6, 4]);
        ctx.shadowColor = 'rgba(155,111,216,0.4)';
        ctx.shadowBlur  = 8;
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }

    // ── Ripples ───────────────────────────────────────────────────────────
    const now = Date.now();
    let needsFrame = false;

    for (const rp of ripplesRef.current) {
      const age = now - rp.t;
      if (age >= RIPPLE_MS) continue;
      needsFrame = true;
      const prog  = age / RIPPLE_MS;
      const alpha = (1 - prog) * (rp.correct ? 0.75 : 0.65);
      const maxR  = Math.min(CW, CH) * (rp.correct ? 0.095 : 0.07);
      const cx    = dX + (rp.imgX / IW) * dW;
      const cy    = dY + (rp.imgY / IH) * dH;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = rp.correct ? '#5AC870' : '#EF5350';
      ctx.lineWidth   = rp.correct ? Math.max(2, CW * 0.004) : Math.max(1.5, CW * 0.003);
      ctx.shadowColor = rp.correct ? 'rgba(90,200,112,0.4)' : 'rgba(239,83,80,0.4)';
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, maxR * prog), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (needsFrame) rafRef.current = requestAnimationFrame(draw);
  }, [scene]);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => { scheduleDraw(); }, [scheduleDraw]);

  // DPR-aware canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.round(canvas.offsetWidth  * dpr);
      canvas.height = Math.round(canvas.offsetHeight * dpr);
      scheduleDraw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [scheduleDraw]);

  useEffect(() => { scheduleDraw(); }, [found, hintVisible, scheduleDraw]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    setFound(new Set()); setRipples([]); setWrongCount(0);
    setHintVisible(false); setHintUsed(false);
  }, [levelIdx]);

  const beginLevel = useCallback(() => {
    setFound(new Set()); setRipples([]); setWrongCount(0);
    setHintVisible(false); setHintUsed(false);
    setPhase('playing');
    setTimeLeft(scene.timeSeconds);
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0; }
        return t - 1;
      });
    }, 1000);
  }, [scene, stopTimer]);

  const startGame = useCallback(() => {
    setLevelIdx(0); setTotalScore(0); setPhase('level-intro'); setShowInstructions(false);
  }, []);

  const goNextLevel = useCallback(() => {
    stopTimer();
    const next = levelIdx + 1;
    if (next >= STATIC_SCENES.length) setPhase('game-complete');
    else { setLevelIdx(next); setPhase('level-intro'); }
  }, [levelIdx, stopTimer]);

  const restart = useCallback(() => {
    stopTimer(); setLevelIdx(0); setTotalScore(0); setPhase('level-intro');
  }, [stopTimer]);

  const showHint = useCallback(() => {
    setHintVisible(true); setHintUsed(true);
    play('flip');
    setTimeout(() => setHintVisible(false), 3800);
  }, [play]);

  // ── Click / hit detection ─────────────────────────────────────────────────
  // Circular hit zone with radius = max(w, h) / 2 — handles rotation naturally.
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // CSS-to-physical pixel conversion
    const cpx = ((e.clientX - rect.left) / rect.width)  * canvas.width;
    const cpy = ((e.clientY - rect.top)  / rect.height) * canvas.height;

    // Letterbox region
    const { dX, dY, dW, dH } = lb(canvas.width, canvas.height, scene.imageW, scene.imageH);

    // Ignore clicks on the dark letterbox bars
    if (cpx < dX || cpx > dX + dW || cpy < dY || cpy > dY + dH) return;

    // Physical canvas pixels → image pixels
    const imgX = ((cpx - dX) / dW) * scene.imageW;
    const imgY = ((cpy - dY) / dH) * scene.imageH;

    const rId = ++rippleIdRef.current;

    let hit: HiddenItem | null = null;
    for (const item of scene.items) {
      if (found.has(item.id)) continue;
      const dist = Math.sqrt((imgX - item.cx) ** 2 + (imgY - item.cy) ** 2);
      if (dist < Math.max(item.w, item.h) / 2) { hit = item; break; }
    }

    if (hit) {
      play('chime');
      const next = new Set(found); next.add(hit.id);
      setFound(next);
      setRipples((r) => [...r, { id: rId, imgX, imgY, correct: true, t: Date.now() }]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== rId)), RIPPLE_MS + 16);

      if (next.size >= scene.items.length) {
        stopTimer();
        const ns = totalScore + 100 + Math.max(0, timeLeft) * 2;
        setTotalScore(ns);
        updateScore('artDetective' as never, ns);
        play('sparkle');
        setTimeout(() => setPhase('level-complete'), 480);
      }
    } else {
      setWrongCount((c) => c + 1);
      play('flip');
      setRipples((r) => [...r, { id: rId, imgX, imgY, correct: false, t: Date.now() }]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== rId)), RIPPLE_MS + 16);
    }
  }, [phase, scene, found, play, stopTimer, timeLeft, totalScore, updateScore]);

  // ── Instructions screen ───────────────────────────────────────────────────
  if (showInstructions) return <ArtDetectiveInstructions onPlay={startGame} />;

  // ── Level intro ───────────────────────────────────────────────────────────
  if (phase === 'level-intro') {
    return (
      <motion.div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center"
        style={{ background: '#05080F', padding: '0 20px', gap: 0 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

        {/* Level + difficulty row */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <div style={{
            padding: '5px 14px', borderRadius: 20,
            border: '1px solid rgba(155,111,216,0.16)', background: 'rgba(155,111,216,0.05)',
            fontSize: 17, letterSpacing: 2.5, textTransform: 'uppercase' as const,
            color: 'rgba(155,111,216,0.48)', fontWeight: 700,
          }}>
            Level {scene.levelNum} · {STATIC_SCENES.length}
          </div>
          <div style={{
            padding: '5px 13px', borderRadius: 20,
            border: '1px solid rgba(90,200,112,0.18)', background: 'rgba(90,200,112,0.06)',
            fontSize: 17, letterSpacing: 2, textTransform: 'uppercase' as const,
            color: 'rgba(90,200,112,0.55)', fontWeight: 700,
          }}>
            {scene.difficultyLabel}
          </div>
        </motion.div>

        {/* Scene title */}
        <motion.h2
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{
            color: '#FFFFFF', fontSize: 28, fontWeight: 700, margin: '0 0 10px',
            textAlign: 'center', lineHeight: 1.2,
          }}>
          {scene.title}
        </motion.h2>

        {/* Difficulty note */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          style={{
            fontSize: 17, color: 'rgba(200,200,255,0.45)',
            margin: '0 0 28px', textAlign: 'center',
            maxWidth: 300, lineHeight: 1.55,
          }}>
          {scene.difficultyNote}
        </motion.p>

        {/* Find-these label */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          style={{
            fontSize: 18, letterSpacing: 3, textTransform: 'uppercase' as const,
            color: 'rgba(155,111,216,0.3)', fontWeight: 700,
            marginBottom: 16,
          }}>
          Find these
        </motion.div>

        {/* Item cards — same asset file shown here and drawn on canvas */}
        <div style={{
          display: 'flex', gap: 14, alignItems: 'flex-start',
          flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: 28,
        }}>
          {scene.items.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.24 + i * 0.11, type: 'spring', damping: 18, stiffness: 230 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                padding: '12px', borderRadius: 16,
                border: '1.5px solid rgba(155,111,216,0.17)',
                background: 'rgba(155,111,216,0.05)',
                position: 'relative',
              }}>
                {/* Item number */}
                <div style={{
                  position: 'absolute', top: -8, right: -8,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#05080F', border: '1px solid rgba(155,111,216,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: 'rgba(155,111,216,0.5)',
                }}>
                  {i + 1}
                </div>
                <img
                  src={item.assetSrc}
                  alt={item.label}
                  draggable={false}
                  style={{ width: 82, height: 82, objectFit: 'contain', display: 'block' }}
                />
              </div>
              <span style={{
                fontSize: 17, fontWeight: 600,
                color: 'rgba(255,255,255,0.60)', textAlign: 'center',
              }}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Tap instruction */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.72 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
            padding: '7px 16px', borderRadius: 20,
            border: '1px solid rgba(155,111,216,0.09)',
            background: 'rgba(155,111,216,0.03)',
          }}>
          <motion.div
            animate={{ scale: [1, 0.86, 1] }}
            transition={{ duration: 0.45, delay: 1.1, repeat: 0 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
              stroke="rgba(155,111,216,0.45)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 12V7a3 3 0 0 1 6 0v5"/><path d="M6 14v2a6 6 0 0 0 12 0v-2"/>
            </svg>
          </motion.div>
          <span style={{ fontSize: 22, color: 'rgba(155,111,216,0.38)', letterSpacing: 0.4 }}>
            Tap anywhere in the scene to find them
          </span>
        </motion.div>

        {/* Begin button */}
        <motion.button onClick={beginLevel}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{
            padding: '14px 52px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)',
            color: '#FFFFFF', fontSize: 18, fontWeight: 700, letterSpacing: 0.4,
            boxShadow: '0 6px 24px rgba(155,111,216,0.28)',
            marginBottom: 14,
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 8px 28px rgba(155,111,216,0.38)' }}
          whileTap={{ scale: 0.96 }}>
          Begin
        </motion.button>

        <button onClick={onBack} style={{
          color: 'rgba(155,111,216,0.22)', fontSize: 22,
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <svg viewBox="0 0 16 16" width="10" height="10" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="10 3 5 8 10 13"/>
          </svg>
          Back
        </button>
      </motion.div>
    );
  }

  // ── Game complete ─────────────────────────────────────────────────────────
  if (phase === 'game-complete') {
    return (
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ background: 'rgba(5,8,15,0.95)', backdropFilter: 'blur(14px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div
          initial={{ scale: 0.82, y: 24 }} animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 18 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            padding: '40px 32px', borderRadius: 26, maxWidth: 300, width: '90%', textAlign: 'center',
            background: 'rgba(155,111,216,0.04)', border: '1px solid rgba(155,111,216,0.14)',
          }}>

          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(155,111,216,0.09)', border: '1.5px solid rgba(155,111,216,0.24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 28 28" width="24" height="24" fill="none"
              stroke="rgba(155,111,216,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3l2.8 7.2H23l-5.6 4 2 7.6L14 18l-5.4 3.8 2-7.6L5 10.2h6.2Z"/>
            </svg>
          </div>

          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 700, margin: '0 0 4px' }}>All Found!</h2>
            <p style={{ fontSize: 22, color: 'rgba(155,111,216,0.38)', margin: 0, letterSpacing: 0.5 }}>
              {STATIC_SCENES.length} scenes complete
            </p>
          </div>

          <div>
            <p style={{ fontSize: 17, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(155,111,216,0.36)', margin: '0 0 6px', fontWeight: 700 }}>
              Final Score
            </p>
            <p style={{ fontSize: 58, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1 }}>
              {totalScore}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button onClick={restart} style={{
              flex: 1, padding: '13px', borderRadius: 12, fontWeight: 600, fontSize: 18,
              background: 'rgba(155,111,216,0.07)', border: '1px solid rgba(155,111,216,0.16)',
              color: '#FFFFFF', cursor: 'pointer',
            }}>
              Play Again
            </button>
            <button onClick={onBack} style={{
              flex: 1, padding: '13px', borderRadius: 12, fontWeight: 600, fontSize: 18,
              background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)', border: 'none',
              color: '#FFFFFF', cursor: 'pointer',
            }}>
              Home
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── Playing screen ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-30 flex flex-col" style={{ background: '#05080F' }}>

      {/* Top bar — full width */}
      <TopBar
        onBack={onBack}
        timeLeft={timeLeft}
        total={scene.timeSeconds}
        onHint={showHint}
        hintUsed={hintUsed}
        sceneTitle={scene.title}
      />

      {/* Bottom: left panel + canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>

        {/* Left panel */}
        <ItemPanel items={scene.items} found={found} />

        {/* Scene canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
            onClick={handleClick}
          />

          {/* Load-timeout fallback */}
          <AnimatePresence>
            {loadTimedOut && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 20,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
                  background: 'rgba(5,8,15,0.9)', backdropFilter: 'blur(8px)',
                }}>
                <p style={{ color: 'rgba(155,111,216,0.7)', fontSize: 16, textAlign: 'center', maxWidth: 260 }}>
                  Scene failed to load
                </p>
                <button
                  onClick={onBack}
                  style={{
                    padding: '12px 36px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)',
                    color: '#FFFFFF', fontSize: 16, fontWeight: 700,
                  }}>
                  Back to Menu
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint text banner */}
          <AnimatePresence>
            {hintVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                  padding: '9px 20px', borderRadius: 12,
                  background: 'rgba(155,111,216,0.09)', border: '1px solid rgba(155,111,216,0.26)',
                  color: '#9B6FD8', backdropFilter: 'blur(8px)',
                  fontSize: 17, fontWeight: 500,
                  maxWidth: '80%', textAlign: 'center', pointerEvents: 'none',
                  lineHeight: 1.4,
                }}>
                {scene.hint}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Level complete overlay */}
      <AnimatePresence>
        {phase === 'level-complete' && (
          <motion.div
            style={{
              position: 'absolute', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(4,6,15,0.90)', backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={{ scale: 0.84, y: 20 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 19 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                padding: '36px 28px', borderRadius: 24, maxWidth: 290, width: '90%', textAlign: 'center',
                background: 'rgba(155,111,216,0.04)', border: '1px solid rgba(155,111,216,0.14)',
              }}>

              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(90,200,112,0.12)', border: '1.5px solid rgba(90,200,112,0.32)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Tick sz={22} color="#5AC870" />
              </div>

              <div>
                <p style={{ fontSize: 17, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(155,111,216,0.4)', margin: '0 0 6px', fontWeight: 700 }}>
                  Level {scene.levelNum} clear
                </p>
                <h2 style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 700, margin: 0 }}>{scene.title}</h2>
              </div>

              {wrongCount > 0 && (
                <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.20)', margin: 0 }}>
                  {wrongCount} wrong tap{wrongCount > 1 ? 's' : ''}
                </p>
              )}

              <p style={{ fontSize: 50, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1 }}>
                {totalScore}
              </p>

              <motion.button onClick={goNextLevel}
                style={{
                  width: '100%', padding: '14px', borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)',
                  color: '#FFFFFF', fontSize: 22, fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(155,111,216,0.25)',
                }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {levelIdx < STATIC_SCENES.length - 1 ? 'Next Level' : 'Finish'}
              </motion.button>

              <button onClick={onBack} style={{
                color: 'rgba(155,111,216,0.22)', fontSize: 22,
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Exit
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
