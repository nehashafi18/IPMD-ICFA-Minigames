import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore, type GameId } from '../store/useAppStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_MS       = 20_500;
const SLIDE_MS       = 5_000;
const MSG_MS         = 3_600;
const PARTICLE_COUNT = 42;

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

// All artwork paths — images that 404 are silently skipped via onError.
// Drop your showcase images into  frontend/public/showcase/  as 01.jpg … 17.jpg
const ALL_GALLERY: { src: string; caption: string }[] = [
  { src: '/showcase/01.jpg',                      caption: 'Creative Collage'   },
  { src: '/showcase/02.jpg',                      caption: 'Nature Journey'     },
  { src: '/showcase/03.jpg',                      caption: 'Leaf Garden'        },
  { src: '/showcase/04.jpg',                      caption: 'Floral House'       },
  { src: '/showcase/05.jpg',                      caption: 'Forest Magic'       },
  { src: '/showcase/06.jpg',                      caption: 'Ocean Waves'        },
  { src: '/showcase/07.jpg',                      caption: 'Sunset Mountains'   },
  { src: '/showcase/08.jpg',                      caption: 'Underwater World'   },
  { src: '/showcase/09.jpg',                      caption: 'Color Pyramid'      },
  { src: '/showcase/10.jpg',                      caption: 'Dragon Forest'      },
  { src: '/showcase/11.jpg',                      caption: 'Garden of Gems'     },
  { src: '/showcase/12.jpg',                      caption: 'Story World'        },
  { src: '/showcase/13.jpg',                      caption: 'Blue Mosaic'        },
  { src: '/showcase/14.jpg',                      caption: 'Star Constellations'},
  { src: '/showcase/15.jpg',                      caption: 'Desert Sunset'      },
  { src: '/showcase/16.jpg',                      caption: 'Enchanted Tunnel'   },
  { src: '/showcase/17.jpg',                      caption: 'Ancient Symbols'    },
  { src: '/games/art-styles/watercolor.png',      caption: 'Watercolor Dreams'  },
  { src: '/games/art-styles/oil-paint.png',       caption: 'Oil Painting'       },
  { src: '/games/art-styles/soft-pastel.png',     caption: 'Soft Pastel World'  },
  { src: '/games/art-styles/colored-pencil.png',  caption: 'Pencil Impressions' },
  { src: '/games/art-styles/ink-wash.png',        caption: 'Ink Wash Journey'   },
  { src: '/games/art-styles/cloud-softness.png',  caption: 'Cloud Softness'     },
  { src: '/games/art-styles/glitter.png',         caption: 'Glitter & Light'    },
  { src: '/games/art-styles/sparkles.png',        caption: 'Sparkle Magic'      },
  { src: '/games/transition/scene-1.png',         caption: 'Forest Dreams'      },
  { src: '/games/transition/scene-2.png',         caption: 'Ocean Discovery'    },
  { src: '/games/transition/scene-3.png',         caption: 'Celestial Voyage'   },
  { src: '/games/art-detective/gallery.png',      caption: 'Art Gallery'        },
  { src: '/games/art-detective/garden.png',       caption: 'Secret Garden'      },
  { src: '/games/art-detective/market.png',       caption: 'Busy Market'        },
  { src: '/games/art-detective/museum.png',       caption: 'Grand Museum'       },
  { src: '/games/memory/radiant-joy.png',         caption: 'Radiant Joy'        },
  { src: '/games/memory/gentle-hope.png',         caption: 'Gentle Hope'        },
  { src: '/games/memory/distant-wonder.png',      caption: 'Distant Wonder'     },
  { src: '/games/memory/warm-calm.png',           caption: 'Warm Calm'          },
  { src: '/games/memory/quiet-longing.png',       caption: 'Quiet Longing'      },
  { src: '/games/memory/tender-joy.png',          caption: 'Tender Joy'         },
  { src: '/games/memory/silent-wonder.png',       caption: 'Silent Wonder'      },
  { src: '/games/memory/drifting-hope.png',       caption: 'Drifting Hope'      },
  { src: '/games/memory/radiant-calm.png',        caption: 'Radiant Calm'       },
  { src: '/games/memory/gentle-memory.png',       caption: 'Gentle Memory'      },
  { src: '/games/memory/warm-joy.png',            caption: 'Warm Joy'           },
  { src: '/games/memory/distant-storm.png',       caption: 'Distant Storm'      },
  { src: '/games/memory/drifting-calm.png',       caption: 'Drifting Calm'      },
  { src: '/games/memory/radiant-sorrow.png',      caption: 'Radiant Sorrow'     },
  { src: '/games/memory/gentle-wonder.png',       caption: 'Gentle Wonder'      },
  { src: '/games/memory/quiet-storm.png',         caption: 'Quiet Storm'        },
];

// ─── Cinematic transition variants (cycle through 5 styles) ──────────────────

type SlideStyle = 'zoom' | 'right' | 'left' | 'bloom' | 'dissolve';
const SLIDE_STYLES: SlideStyle[] = ['zoom', 'right', 'left', 'bloom', 'dissolve'];

function slideVariants(style: SlideStyle) {
  const BASE_DUR = { duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] as const };
  const EXIT_DUR = { duration: 0.6,  ease: 'easeIn' as const };
  switch (style) {
    case 'zoom':     return {
      initial: { opacity: 0, scale: 1.18 },
      animate: { opacity: 1, scale: 1.07,  transition: { duration: 1.0,  ease: 'easeOut'   as const } },
      exit:    { opacity: 0, scale: 0.98,  transition: EXIT_DUR },
    };
    case 'right':    return {
      initial: { opacity: 0, x: '32%' },
      animate: { opacity: 1, x: 0,         transition: BASE_DUR },
      exit:    { opacity: 0, x: '-22%',    transition: EXIT_DUR },
    };
    case 'left':     return {
      initial: { opacity: 0, x: '-32%' },
      animate: { opacity: 1, x: 0,         transition: BASE_DUR },
      exit:    { opacity: 0, x: '22%',     transition: EXIT_DUR },
    };
    case 'bloom':    return {
      initial: { opacity: 0, scale: 0.86, filter: 'blur(14px)' },
      animate: { opacity: 1, scale: 1.07, filter: 'blur(0px)', transition: { duration: 1.05, ease: 'easeOut'   as const } },
      exit:    { opacity: 0, scale: 1.12, filter: 'blur(8px)',  transition: EXIT_DUR },
    };
    case 'dissolve': return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 1.1,  ease: 'easeInOut' as const } },
      exit:    { opacity: 0, transition: { duration: 0.85, ease: 'easeInOut' as const } },
    };
  }
}

// ─── Particle canvas ──────────────────────────────────────────────────────────

const PARTICLE_COLORS = [
  'rgba(255,255,255,',
  'rgba(255,215,90,',
  'rgba(190,148,255,',
  'rgba(255,185,210,',
  'rgba(140,220,255,',
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
    vx:       (Math.random() - 0.5) * 0.45,
    vy:       -(0.32 + Math.random() * 0.5),
    r:        0.9 + Math.random() * 2.4,
    alpha:    spread ? Math.random() * 0.55 : 0,
    alphaDir: 0.018 + Math.random() * 0.018,
    color:    PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    t:        Math.random() * 200,
  };
}

function ParticleCanvas({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
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

    let { width: w, height: h } = canvas;
    const ptcls: Ptcl[] = Array.from({ length: PARTICLE_COUNT }, (_, i) =>
      makePtcl(w, h, i < PARTICLE_COUNT / 2),
    );

    let rafId = 0;
    const tick = () => {
      w = canvas.width; h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < ptcls.length; i++) {
        const p = ptcls[i];
        p.t  += 1;
        p.x  += p.vx + Math.sin(p.t * 0.035) * 0.28;
        p.y  += p.vy;
        p.alpha += p.alphaDir;

        if (p.alpha >= 0.65) p.alphaDir = -Math.abs(p.alphaDir);
        if (p.alpha <= 0 || p.y < -10) { ptcls[i] = makePtcl(w, h); continue; }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`;
        ctx.shadowColor = `${p.color}0.7)`;
        ctx.shadowBlur = p.r * 4;
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
      style={{ zIndex: 5 }}
    />
  );
}

// ─── Game cards ───────────────────────────────────────────────────────────────

interface GameCard {
  id: GameId;
  title: string;
  desc: string;
  emoji: string;
  bg: string;
  accent: string;
  glow: string;
}

const GAME_CARDS: GameCard[] = [
  {
    id:     'memory-intro',
    title:  'Memory Match',
    desc:   'Flip & pair',
    emoji:  '🃏',
    bg:     'linear-gradient(135deg, #1a0a3e 0%, #2d1060 100%)',
    accent: 'rgba(155,111,216,0.85)',
    glow:   'rgba(155,111,216,0.4)',
  },
  {
    id:     'bubble-intro',
    title:  'Cascade',
    desc:   'Shoot & clear',
    emoji:  '🔴',
    bg:     'linear-gradient(135deg, #1a0808 0%, #3d1010 100%)',
    accent: 'rgba(255,90,90,0.85)',
    glow:   'rgba(255,80,80,0.35)',
  },
  {
    id:     'artDetective',
    title:  'Canvas Quest',
    desc:   'Find & discover',
    emoji:  '🔍',
    bg:     'linear-gradient(135deg, #0f1a08 0%, #1e3510 100%)',
    accent: 'rgba(130,200,80,0.85)',
    glow:   'rgba(120,200,70,0.35)',
  },
  {
    id:     'memoryGallery',
    title:  'Memory Manor',
    desc:   'Watch & recall',
    emoji:  '🏛️',
    bg:     'linear-gradient(135deg, #080f1a 0%, #101e35 100%)',
    accent: 'rgba(80,160,255,0.85)',
    glow:   'rgba(70,150,255,0.35)',
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { onDone: () => void; }

export default function TransitionScreen({ onDone }: Props) {
  const navigateTo        = useAppStore((s) => s.navigateTo);
  const prefersReduced    = useReducedMotion();
  const storeReduced      = useAppStore((s) => s.reducedMotion);
  const reduced           = storeReduced || !!prefersReduced;

  // ── State ──────────────────────────────────────────────────────────────────

  // Gallery: filter to images that loaded successfully
  const [gallery, setGallery]       = useState<{ src: string; caption: string }[]>([]);
  const [slideIdx, setSlideIdx]     = useState(0);
  const [slideStyle, setSlideStyle] = useState<SlideStyle>('zoom');
  const [msgIdx, setMsgIdx]         = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  const doneRef    = useRef(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // ── Preload images, keep only the ones that load ───────────────────────────

  useEffect(() => {
    let alive = true;
    const loaded: { src: string; caption: string; order: number }[] = [];

    ALL_GALLERY.forEach((item, i) => {
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        loaded.push({ ...item, order: i });
        loaded.sort((a, b) => a.order - b.order);
        setGallery(loaded.map(({ src, caption }) => ({ src, caption })));
        setLoadedCount(c => c + 1);
      };
      img.src = item.src;
    });

    return () => { alive = false; };
  }, []);

  // ── Auto-advance gallery slide every SLIDE_MS ─────────────────────────────

  useEffect(() => {
    if (gallery.length < 2) return;
    const t = setInterval(() => {
      setSlideIdx(i  => (i + 1) % gallery.length);
      setSlideStyle(s => {
        const next = SLIDE_STYLES[(SLIDE_STYLES.indexOf(s) + 1) % SLIDE_STYLES.length];
        return next;
      });
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [gallery.length]);

  // ── Rotate progress messages ───────────────────────────────────────────────

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % PROGRESS_MSGS.length), MSG_MS);
    return () => clearInterval(t);
  }, []);

  // ── Advance to home after TOTAL_MS ────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onDone(); }
    }, TOTAL_MS);
    return () => clearTimeout(t);
  }, [onDone]);

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
        <p className="text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Enjoy a minigame while you wait
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
          {GAME_CARDS.map(g => (
            <button
              key={g.id}
              onClick={() => { if (!doneRef.current) { doneRef.current = true; navigateTo(g.id); } }}
              className="rounded-xl py-3 text-center text-sm font-semibold"
              style={{ background: g.bg, color: '#fff' }}
            >
              {g.emoji} {g.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const current = gallery[slideIdx] ?? null;
  const variants = slideVariants(slideStyle);

  // ── Full immersive layout ──────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d1035 0%, #05080F 65%)' }}
    >
      {/* ── Ambient background glow ────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(100,60,200,0.22) 0%, transparent 70%)',
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-shrink-0 text-center pt-4 pb-1 px-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <motion.div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-0.5"
          style={{
            background: 'rgba(155,111,216,0.18)',
            border:     '1px solid rgba(155,111,216,0.3)',
            color:      'rgba(200,170,255,0.9)',
            letterSpacing: '0.07em',
          }}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span style={{ fontSize: 8 }}>●</span>
          CREATING YOUR ARTWORK
        </motion.div>
      </motion.div>

      {/* ── Gallery hero ───────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-shrink-0 mx-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        style={{ height: 'min(46vh, 320px)' }}
      >
        <div
          ref={galleryRef}
          className="relative w-full h-full rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)' }}
        >
          {/* Image with cinematic transition */}
          <AnimatePresence mode="sync">
            {current && (
              <motion.div
                key={current.src}
                className="absolute inset-0"
                initial={variants.initial}
                animate={variants.animate}
                exit={variants.exit}
                style={{ willChange: 'transform, opacity' }}
              >
                <img
                  src={current.src}
                  alt={current.caption}
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={() => {
                    // Remove broken images from gallery
                    setGallery(g => g.filter(item => item.src !== current.src));
                  }}
                />
                {/* Gradient overlays */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(3,5,16,0.82) 0%, rgba(3,5,16,0.1) 45%, rgba(3,5,16,0.25) 100%)',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Placeholder while images load */}
          {gallery.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0d1035, #1a0a3e)' }}
            >
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{ fontSize: 48, filter: 'blur(0px)' }}
              >
                🎨
              </motion.div>
            </div>
          )}

          {/* Particle layer */}
          <ParticleCanvas containerRef={galleryRef} />

          {/* Caption badge */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={`cap-${current.caption}`}
                className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-full"
                style={{
                  background:    'rgba(0,0,0,0.52)',
                  backdropFilter:'blur(8px)',
                  border:        '1px solid rgba(255,255,255,0.14)',
                }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } }}
                exit={{    opacity: 0, y: 4, transition: { duration: 0.3 } }}
              >
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.04em' }}>
                  ✦ {current.caption}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slide dot indicators */}
          {gallery.length > 1 && (
            <div className="absolute bottom-3 right-3 z-10 flex gap-1">
              {Array.from({ length: Math.min(gallery.length, 7) }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:      i === slideIdx % 7 ? 16 : 5,
                    height:     5,
                    background: i === slideIdx % 7
                      ? 'rgba(255,255,255,0.9)'
                      : 'rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Progress message ────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-shrink-0 text-center px-6 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            className="text-base font-semibold"
            style={{ color: 'rgba(255,255,255,0.92)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            exit={{    opacity: 0, y: -5, transition: { duration: 0.35 } }}
          >
            {PROGRESS_MSGS[msgIdx]}
          </motion.p>
        </AnimatePresence>

        <motion.p
          className="text-xs mt-1"
          style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: '0.03em' }}
          animate={{ opacity: [0.38, 0.55, 0.38] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✨ Thousands of unique masterpieces crafted — yours is next
        </motion.p>
      </motion.div>

      {/* ── "Play while you wait" label ─────────────────────────────────────── */}
      <motion.p
        className="relative z-10 flex-shrink-0 text-center text-xs font-semibold mt-3 mb-1.5 px-4"
        style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      >
        Play while you wait
      </motion.p>

      {/* ── Game cards ──────────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-1 grid grid-cols-2 gap-2 px-3 pb-3"
        style={{ minHeight: 0, maxHeight: 200 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.0 }}
      >
        {GAME_CARDS.map((card, i) => (
          <GameCardButton
            key={card.id}
            card={card}
            delayMultiplier={i}
            onClick={() => {
              if (!doneRef.current) { doneRef.current = true; navigateTo(card.id); }
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Game card button ─────────────────────────────────────────────────────────

function GameCardButton({
  card,
  delayMultiplier,
  onClick,
}: {
  card: GameCard;
  delayMultiplier: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="relative rounded-xl overflow-hidden text-left w-full h-full flex flex-col justify-end p-2.5"
      style={{
        background:  card.bg,
        border:      `1px solid rgba(255,255,255,0.09)`,
        boxShadow:   `0 4px 20px ${card.glow}`,
        minHeight:   72,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 1.1 + delayMultiplier * 0.06 }}
      whileHover={{ scale: 1.03, boxShadow: `0 6px 28px ${card.glow}` }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Glow blob */}
      <div
        className="absolute top-0 right-0 w-12 h-12 rounded-full pointer-events-none"
        style={{
          background:  `radial-gradient(circle, ${card.accent} 0%, transparent 70%)`,
          transform:   'translate(30%, -30%)',
          opacity:     0.6,
          filter:      'blur(8px)',
        }}
      />

      {/* Emoji */}
      <div className="absolute top-2 right-2.5 text-lg leading-none pointer-events-none" style={{ opacity: 0.85 }}>
        {card.emoji}
      </div>

      {/* Text */}
      <span className="block text-sm font-bold leading-tight" style={{ color: '#FFFFFF' }}>
        {card.title}
      </span>
      <span className="block text-xs mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.52)' }}>
        {card.desc}
      </span>
    </motion.button>
  );
}
