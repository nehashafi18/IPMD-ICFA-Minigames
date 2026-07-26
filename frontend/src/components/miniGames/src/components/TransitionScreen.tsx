import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore, type GameId } from '../store/useAppStore';
import { SHOWCASE_IMAGES } from '../config/showcaseImages';

// ─── Timing ───────────────────────────────────────────────────────────────────

const TOTAL_MS    = 20_500;
const SLIDE_MS    = 5_000;
const MSG_MS      = 3_600;
const FADE_OUT_MS = 700;   // final black-fade duration before onDone

// ─── Progress messages ────────────────────────────────────────────────────────

const PROGRESS_MSGS = [
  'Adding magical details…',
  'Finding hidden patterns…',
  'Painting tiny brushstrokes…',
  'Mixing your perfect colors…',
  'Crafting your masterpiece…',
  'Weaving layers of texture…',
  'Every detail matters…',
  'Creating something uniquely yours…',
  'Almost there…',
  'Bringing your vision to life…',
  'Choosing just the right hues…',
  'Something special is taking shape…',
];

// ─── Cinematic slide transitions ─────────────────────────────────────────────

type SlideStyle = 'paintBloom' | 'inkDrip' | 'lightFlare' | 'cinematicDissolve' | 'cornerSweep';
const SLIDE_STYLES: SlideStyle[] = [
  'paintBloom', 'inkDrip', 'lightFlare', 'cinematicDissolve', 'cornerSweep',
];

// Fixed bloom origins for paintBloom — one per slide position (cycles).
const BLOOM_ORIGINS: [number, number][] = [
  [38, 55], [62, 42], [45, 65], [55, 35], [40, 52],
];

function slideVariants(style: SlideStyle, slideIdx: number) {
  const [bx, by] = BLOOM_ORIGINS[slideIdx % 5];
  const EXIT_FADE = { duration: 0.5, ease: 'easeIn' as const };

  switch (style) {
    // Radial paint spread from a point
    case 'paintBloom': return {
      initial: {
        opacity: 1,
        clipPath: `circle(0% at ${bx}% ${by}%)`,
        filter: 'brightness(1.4)',
      },
      animate: {
        opacity: 1,
        clipPath: `circle(160% at ${bx}% ${by}%)`,
        filter: 'brightness(1)',
        transition: { duration: 1.2, ease: [0.35, 0.0, 0.15, 1.0] as const },
      },
      exit: { opacity: 0, filter: 'brightness(1.5)', transition: EXIT_FADE },
    };

    // Ink drips down from top edge (slight organic curve)
    case 'inkDrip': return {
      initial: {
        opacity: 1,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 50% 2%, 0% 0%)',
      },
      animate: {
        opacity: 1,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 103%, 0% 100%)',
        transition: { duration: 1.05, ease: [0.4, 0.0, 0.2, 1.0] as const },
      },
      exit: { opacity: 0, transition: EXIT_FADE },
    };

    // Burst from a bright overexposed flash into clarity
    case 'lightFlare': return {
      initial: {
        opacity: 0,
        filter: 'brightness(3) blur(18px)',
        scale: 1.08,
      },
      animate: {
        opacity: 1,
        filter: 'brightness(1) blur(0px)',
        scale: 1.02,
        transition: { duration: 1.1, ease: 'easeOut' as const },
      },
      exit: {
        opacity: 0,
        filter: 'brightness(2.5) blur(6px)',
        transition: { duration: 0.4, ease: 'easeIn' as const },
      },
    };

    // Classic cinematic cross-dissolve
    case 'cinematicDissolve': return {
      initial: { opacity: 0, scale: 1.05 },
      animate: {
        opacity: 1,
        scale: 1.02,
        transition: { duration: 1.3, ease: 'easeInOut' as const },
      },
      exit: {
        opacity: 0,
        scale: 0.98,
        transition: { duration: 0.7, ease: 'easeIn' as const },
      },
    };

    // Diagonal sweep from top-left corner
    case 'cornerSweep': return {
      initial: {
        opacity: 1,
        clipPath: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)',
      },
      animate: {
        opacity: 1,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        transition: { duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] as const },
      },
      exit: { opacity: 0, transition: EXIT_FADE },
    };
  }
}

// ─── Particle canvas ──────────────────────────────────────────────────────────

const PARTICLE_COLORS = [
  'rgba(255,255,255,',
  'rgba(255,210,90,',
  'rgba(180,140,255,',
];

interface Ptcl {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number; alphaDir: number;
  color: string;
  t: number;
}

function makePtcl(w: number, h: number, spread = false): Ptcl {
  return {
    x:        Math.random() * w,
    y:        spread ? Math.random() * h : h + 10,
    vx:       (Math.random() - 0.5) * 0.3,
    vy:       -(0.18 + Math.random() * 0.3),
    r:        0.6 + Math.random() * 1.5,
    alpha:    spread ? Math.random() * 0.38 : 0,
    alphaDir: 0.01 + Math.random() * 0.01,
    color:    PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    t:        Math.random() * 200,
  };
}

function ParticleCanvas({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      canvas.width  = width;
      canvas.height = height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);

    const COUNT = 24;
    let { width: w, height: h } = canvas;
    const ptcls: Ptcl[] = Array.from({ length: COUNT }, (_, i) =>
      makePtcl(w, h, i < COUNT / 2),
    );

    let rafId = 0;
    const tick = () => {
      w = canvas.width; h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < ptcls.length; i++) {
        const p = ptcls[i];
        p.t  += 1;
        p.x  += p.vx + Math.sin(p.t * 0.03) * 0.22;
        p.y  += p.vy;
        p.alpha += p.alphaDir;

        if (p.alpha >= 0.42) p.alphaDir = -Math.abs(p.alphaDir);
        if (p.alpha <= 0 || p.y < -10) { ptcls[i] = makePtcl(w, h); continue; }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`;
        ctx.shadowColor = `${p.color}0.5)`;
        ctx.shadowBlur = p.r * 3.5;
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 4 }}
    />
  );
}

// ─── Loading state (no showcase images available) ────────────────────────────

function LoadingArtworkState() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ background: 'linear-gradient(135deg, #06070e 0%, #0b0d1c 100%)' }}
    >
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: 38, lineHeight: 1 }}
      >
        🎨
      </motion.div>
      <motion.p
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-xs font-medium"
        style={{
          color:         'rgba(255,255,255,0.38)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Preparing gallery
      </motion.p>
    </div>
  );
}

// ─── Game cards ───────────────────────────────────────────────────────────────

interface GameCard {
  id: GameId;
  title: string;
  desc: string;
  emoji: string;
  glowColor: string;
}

const GAME_CARDS: GameCard[] = [
  { id: 'memory-intro', title: 'Memory Match',  desc: 'Flip & pair',     emoji: '🃏', glowColor: 'rgba(155,111,216,' },
  { id: 'bubble-intro', title: 'Cascade',        desc: 'Shoot & clear',   emoji: '🔴', glowColor: 'rgba(255,80,80,'   },
  { id: 'artDetective', title: 'Canvas Quest',   desc: 'Find & discover', emoji: '🔍', glowColor: 'rgba(100,200,80,'  },
  { id: 'memoryGallery', title: 'Memory Manor',  desc: 'Watch & recall',  emoji: '🏛️', glowColor: 'rgba(70,150,255,'  },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { onDone: () => void; }

export default function TransitionScreen({ onDone }: Props) {
  const navigateTo     = useAppStore((s) => s.navigateTo);
  const prefersReduced = useReducedMotion();
  const storeReduced   = useAppStore((s) => s.reducedMotion);
  const reduced        = storeReduced || !!prefersReduced;

  // Gallery: only images from SHOWCASE_IMAGES that actually loaded
  const [gallery, setGallery]       = useState<typeof SHOWCASE_IMAGES>([]);
  const [slideIdx, setSlideIdx]     = useState(0);
  const [slideStyle, setSlideStyle] = useState<SlideStyle>('paintBloom');
  const [msgIdx, setMsgIdx]         = useState(0);
  const [finalizing, setFinalizing] = useState(false);

  const doneRef    = useRef(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // ── Preload SHOWCASE_IMAGES — only use ones that successfully load ──────────

  useEffect(() => {
    let alive = true;
    const loaded: (typeof SHOWCASE_IMAGES[number] & { order: number })[] = [];

    SHOWCASE_IMAGES.forEach((item, i) => {
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        loaded.push({ ...item, order: i });
        loaded.sort((a, b) => a.order - b.order);
        setGallery(loaded.map(({ src, caption }) => ({ src, caption })));
      };
      img.src = item.src;
    });

    return () => { alive = false; };
  }, []);

  // ── Advance slide every SLIDE_MS ───────────────────────────────────────────

  useEffect(() => {
    if (gallery.length < 2) return;
    const t = setInterval(() => {
      setSlideIdx(i  => (i + 1) % gallery.length);
      setSlideStyle(s => {
        const idx  = SLIDE_STYLES.indexOf(s);
        return SLIDE_STYLES[(idx + 1) % SLIDE_STYLES.length];
      });
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [gallery.length]);

  // ── Rotate progress messages ───────────────────────────────────────────────

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % PROGRESS_MSGS.length), MSG_MS);
    return () => clearInterval(t);
  }, []);

  // ── Final cinematic fade-out then onDone ───────────────────────────────────

  useEffect(() => {
    const fadeStart = setTimeout(() => {
      if (!doneRef.current) setFinalizing(true);
    }, TOTAL_MS - FADE_OUT_MS);

    const navigate = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onDone(); }
    }, TOTAL_MS);

    return () => { clearTimeout(fadeStart); clearTimeout(navigate); };
  }, [onDone]);

  // ── Navigate immediately when a game card is tapped ───────────────────────

  function handleGameNav(id: GameId) {
    if (!doneRef.current) { doneRef.current = true; navigateTo(id); }
  }

  // ── Reduced-motion path ────────────────────────────────────────────────────

  if (reduced) {
    return (
      <div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 px-8 text-center"
        style={{ background: '#05080F' }}
      >
        <p className="text-2xl font-semibold" style={{ color: '#fff' }}>
          Your artwork is being created
        </p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Enjoy a minigame while you wait
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
          {GAME_CARDS.map(g => (
            <button
              key={g.id}
              onClick={() => handleGameNav(g.id)}
              className="rounded-xl py-3 text-center text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {g.emoji} {g.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const current  = gallery[slideIdx] ?? null;
  const variants = slideVariants(slideStyle, slideIdx);

  // ── Full cinematic layout ──────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden select-none"
      style={{ background: '#040507' }}
    >
      {/* ── Ambient background gradient ────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 70% at 50% 10%, #0a0b18 0%, #040507 55%)',
        }}
      />

      {/* ── Slowly drifting ambient orbs ───────────────────────────────────── */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{
          x: [0, 30, 10, 0],
          y: [0, -20, 15, 0],
          opacity: [0.05, 0.09, 0.06, 0.05],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '55%', height: '40%',
          top: '-8%', right: '-5%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,210,100,1) 0%, transparent 68%)',
          filter: 'blur(72px)',
        }}
      />
      <motion.div
        className="absolute pointer-events-none"
        animate={{
          x: [0, -25, 8, 0],
          y: [0, 18, -12, 0],
          opacity: [0.06, 0.1, 0.05, 0.06],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{
          width: '50%', height: '45%',
          bottom: '15%', left: '-8%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(80,130,255,1) 0%, transparent 68%)',
          filter: 'blur(80px)',
        }}
      />

      {/* ── Header badge ───────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-shrink-0 flex justify-center pt-4 pb-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <motion.div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background:    'rgba(255,255,255,0.05)',
            border:        '1px solid rgba(255,255,255,0.13)',
            color:         'rgba(200,200,210,0.85)',
            letterSpacing: '0.08em',
            backdropFilter: 'blur(8px)',
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ fontSize: 7, color: '#9B9FFF' }}
          >
            ●
          </motion.span>
          CREATING YOUR ARTWORK
        </motion.div>
      </motion.div>

      {/* ── Gallery showcase ───────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-shrink-0 flex justify-center mt-2 px-4"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{ height: 'min(48vh, 300px)' }}
      >
        {/* Soft glow halo behind the card */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(100,80,200,0.35) 0%, transparent 70%)',
            filter: 'blur(16px)',
          }}
        />

        {/* The gallery card */}
        <div
          ref={galleryRef}
          className="relative h-full rounded-2xl overflow-hidden"
          style={{
            width: '86%',
            boxShadow: [
              '0 2px 6px rgba(0,0,0,0.5)',
              '0 8px 24px rgba(0,0,0,0.5)',
              '0 30px 60px rgba(0,0,0,0.55)',
              '0 0 0 1px rgba(255,255,255,0.08)',
            ].join(', '),
          }}
        >
          {/* Loading state when no showcase images are available */}
          {gallery.length === 0 && <LoadingArtworkState />}

          {/* Cinematic image carousel */}
          <AnimatePresence mode="sync">
            {current && (
              <motion.div
                key={current.src}
                className="absolute inset-0"
                initial={variants.initial}
                animate={variants.animate}
                exit={variants.exit}
                style={{ willChange: 'transform, opacity, clip-path, filter' }}
              >
                <img
                  src={current.src}
                  alt={current.caption}
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={() => {
                    setGallery(g => g.filter(item => item.src !== current.src));
                  }}
                />
                {/* Bottom-heavy gradient vignette */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(4,5,7,0.78) 0%, rgba(4,5,7,0.08) 42%, rgba(4,5,7,0.18) 100%)',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Particle overlay */}
          <ParticleCanvas containerRef={galleryRef} />

          {/* Caption badge */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={`cap-${current.caption}`}
                className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-full"
                style={{
                  background:    'rgba(0,0,0,0.48)',
                  backdropFilter: 'blur(10px)',
                  border:        '1px solid rgba(255,255,255,0.12)',
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.45 } }}
                exit={{    opacity: 0, y: 4, transition: { duration: 0.25 } }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '0.03em' }}
                >
                  ✦ {current.caption}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dot indicators */}
          {gallery.length > 1 && (
            <div className="absolute bottom-3 right-3 z-10 flex gap-1 items-center">
              {Array.from({ length: Math.min(gallery.length, 7) }, (_, i) => {
                const active = i === slideIdx % 7;
                return (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width:      active ? 14 : 4,
                      height:     4,
                      background: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)',
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Progress message ────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-shrink-0 text-center px-8 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.55 }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            className="text-base font-semibold"
            style={{ color: 'rgba(255,255,255,0.9)' }}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.45 } }}
            exit={{    opacity: 0, y: -6, transition: { duration: 0.3 } }}
          >
            {PROGRESS_MSGS[msgIdx]}
          </motion.p>
        </AnimatePresence>

        <motion.p
          className="text-xs mt-1.5"
          style={{ color: 'rgba(255,255,255,0.32)', letterSpacing: '0.02em' }}
          animate={{ opacity: [0.32, 0.48, 0.32] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✨ Thousands of unique masterpieces crafted — yours is next
        </motion.p>
      </motion.div>

      {/* ── "Play while you wait" divider ──────────────────────────────────── */}
      <motion.p
        className="relative z-10 flex-shrink-0 text-center text-xs font-semibold mt-3 mb-1.5"
        style={{
          color:         'rgba(255,255,255,0.35)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        Play while you wait
      </motion.p>

      {/* ── Game cards ──────────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-1 grid grid-cols-2 gap-2 px-6 pb-4"
        style={{ minHeight: 0, maxHeight: 180 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.05 }}
      >
        {GAME_CARDS.map((card, i) => (
          <motion.button
            key={card.id}
            onClick={() => handleGameNav(card.id)}
            className="relative flex items-center gap-2.5 px-3 rounded-xl overflow-hidden text-left"
            style={{
              background:    'rgba(255,255,255,0.04)',
              border:        '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              minHeight:     66,
              boxShadow:     `0 2px 12px ${card.glowColor}0.08)`,
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 1.15 + i * 0.05 }}
            whileHover={{
              background:    'rgba(255,255,255,0.08)',
              boxShadow:     `0 4px 20px ${card.glowColor}0.2)`,
              borderColor:   'rgba(255,255,255,0.2)',
              scale:         1.02,
              transition:    { duration: 0.15 },
            }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Subtle accent glow in corner */}
            <div
              className="absolute top-0 right-0 pointer-events-none"
              style={{
                width:      36,
                height:     36,
                background: `radial-gradient(circle, ${card.glowColor}0.5) 0%, transparent 70%)`,
                transform:  'translate(30%, -30%)',
                filter:     'blur(6px)',
              }}
            />

            {/* Emoji icon */}
            <span className="flex-shrink-0 text-xl leading-none" style={{ opacity: 0.9 }}>
              {card.emoji}
            </span>

            {/* Text */}
            <span className="flex flex-col min-w-0">
              <span
                className="text-sm font-bold leading-tight truncate"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                {card.title}
              </span>
              <span
                className="text-xs leading-tight mt-0.5"
                style={{ color: 'rgba(255,255,255,0.42)' }}
              >
                {card.desc}
              </span>
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* ── Final cinematic fade-out overlay ───────────────────────────────── */}
      <AnimatePresence>
        {finalizing && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: FADE_OUT_MS / 1000, ease: 'easeIn' }}
            style={{ background: '#040507' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
