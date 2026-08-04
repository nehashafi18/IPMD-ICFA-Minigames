import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAppStore, type GameId } from '../store/useAppStore';
import SpeakerIcon from './SpeakerIcon';
import { audioSettings, bgMusic } from '../systems/audioSystem';
import { SHOWCASE_IMAGES } from '../config/showcaseImages';
import { PortalPreviewEngine, type WorldGameId } from '../three/PortalPreviewEngine';

// ─── Four giant portals — a text-free "movie trailer" for each game ────────
//
// The real game screens can't have their HUD/instructions switched off (no
// prop for it, and we don't touch game source), so what's behind the glass
// here is a small, purpose-built, per-portal WebGL scene: the same core
// mechanic — cards flipping, pieces flowing, artwork glowing in sequence, a
// lens finding clues — using real icon/artwork assets, but reduced to pure
// motion and color with zero text, HUD, or button of any kind. Bright and
// warm inside, deliberately in contrast to the dark room around it. The
// actual game, unmodified, is what opens once you click through.
const STAGE_H = 1900;
const NOOP = () => {};

interface WorldGame {
  id: WorldGameId;
  intro: GameId;
  title: string;
  desc: string;
  glow: string;
}

const WORLD_GAMES: WorldGame[] = [
  {
    id: 'memory', intro: 'memory-intro' as GameId,
    title: 'Memory Match',
    desc: 'Remember the artwork. Find the matching card.',
    glow: '#E8977F',
  },
  {
    id: 'bubble', intro: 'bubble-intro' as GameId,
    title: 'Cascade',
    desc: 'Hit the falling target while avoiding the chaos you create.',
    glow: '#6FC4C9',
  },
  {
    id: 'artDetective', intro: 'artDetective' as GameId,
    title: 'Art Detective',
    desc: 'Investigate the artwork and uncover hidden clues.',
    glow: '#E0B34F',
  },
  {
    id: 'memoryGallery', intro: 'memoryGallery' as GameId,
    title: 'Memory Gallery',
    desc: 'Watch the sequence. Remember the order. Tap the cards correctly.',
    glow: '#A879E8',
  },
];

// ─── Living background — a dark, restrained gallery space ──────────────────
// Cinematic light rays, drifting fog, and a reflective floor — no sparkle,
// no glitter, no floating stars. Closer to a museum installation than a
// fairytale: light and haze doing the work, not particles.

function LivingBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base — charcoal, near-black, a museum room at night */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(170deg, #121016 0%, #15131c 30%, #0c0b10 62%, #050506 100%)',
        }}
      />

      {/* Faint architectural wash — barely-there gold/purple, not a rainbow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(224,179,79,0.06), transparent 65%),' +
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(140,110,220,0.07), transparent 65%)',
        }}
      />

      {/* Volumetric light rays — as if falling through a skylight above */}
      {[
        { l: '18%', w: 220, dur: 22, delay: 0 },
        { l: '48%', w: 280, dur: 26, delay: 5 },
        { l: '76%', w: 200, dur: 24, delay: 10 },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute top-0"
          style={{
            left: b.l, width: b.w, height: '120%',
            background: 'linear-gradient(180deg, rgba(240,230,210,0.10) 0%, rgba(240,230,210,0.02) 45%, transparent 80%)',
            filter: 'blur(6px)',
            transform: 'skewX(-6deg)',
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Fog — slow, neutral, atmospheric haze */}
      {[{ l: '15%', t: '35%', s: 520 }, { l: '68%', t: '50%', s: 460 }].map((f, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: f.l, top: f.t, width: f.s, height: f.s,
            background: 'radial-gradient(circle, rgba(180,180,195,0.08), transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{ x: [0, 50, 0, -40, 0], y: [0, -20, 0, 16, 0] }}
          transition={{ duration: 40 + i * 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Reflection — a polished dark floor, faintly catching the portal light */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '24%',
          background:
            'linear-gradient(0deg, rgba(90,90,110,0.14) 0%, rgba(20,18,26,0.08) 55%, transparent 100%)',
        }}
      />

      {/* Vignette — cinematic edge falloff */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)' }}
      />
    </div>
  );
}

// ─── Reduced-motion / WebGL-unavailable fallback ────────────────────────────

function ReducedFallback({ onSelect }: { onSelect: (g: WorldGame) => void }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-8"
      style={{ background: 'linear-gradient(165deg, #14101f 0%, #181425 40%, #06050a 100%)' }}
    >
      <h1 className="font-display text-3xl font-semibold text-center" style={{ color: '#f0e6da' }}>
        Choose an Experience
      </h1>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {WORLD_GAMES.map(g => (
          <button
            key={g.id}
            onClick={() => onSelect(g)}
            className="text-left rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${g.glow}66` }}
          >
            <div className="font-display font-semibold" style={{ color: '#f0e6da' }}>{g.title}</div>
            <div className="text-xs mt-1" style={{ color: 'rgba(240,230,218,0.65)' }}>{g.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── A single giant portal — its own live preview canvas ───────────────────

// Every game opens on its own onboarding carousel ("Next →" ... then a final
// "Play →" / "Start Game →" / "Enter the Manor →" step) before the real board
function Portal({
  game, onSelect,
}: { game: WorldGame; onSelect: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PortalPreviewEngine | null>(null);
  const [hovered, setHovered] = useState(false);
  const [entering, setEntering] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const urls = SHOWCASE_IMAGES.map(s => s.src);
    if (!urls.length) return;

    let engine: PortalPreviewEngine;
    try {
      engine = new PortalPreviewEngine({ canvas, id: game.id, urls });
    } catch {
      setFailed(true);
      return;
    }
    engineRef.current = engine;
    return () => { engine.dispose(); engineRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  useEffect(() => {
    engineRef.current?.setSpeed(hovered || entering ? 1.8 : 1);
  }, [hovered, entering]);

  function handleClick() {
    if (entering) return;
    setEntering(true);
    setTimeout(onSelect, 380);
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Enter ${game.title}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative rounded-[36px] overflow-hidden group cursor-pointer"
      style={{
        width: '24vw', minWidth: 230, maxWidth: 400,
        height: '74vh', minHeight: 460,
        border: `2px solid ${game.glow}77`,
        containerType: 'inline-size',
      }}
      initial={{ opacity: 0, y: 60, scale: 0.92, filter: 'blur(12px)' }}
      animate={{
        opacity: 1, y: 0, filter: 'blur(0px)',
        scale: entering ? 1.06 : hovered ? 1.04 : 1,
        boxShadow: hovered || entering
          ? `0 30px 80px rgba(0,0,0,0.55), 0 0 80px ${game.glow}aa, 0 0 0 3px ${game.glow}cc`
          : `0 14px 46px rgba(0,0,0,0.4), 0 0 30px ${game.glow}55, 0 0 0 2px ${game.glow}66`,
      }}
      transition={{
        opacity: { duration: 0.7, ease: 'easeOut' },
        y: { duration: 0.7, ease: 'easeOut' },
        filter: { duration: 0.7, ease: 'easeOut' },
        scale: { duration: 0.35, ease: 'easeOut' },
        boxShadow: { duration: 0.35, ease: 'easeOut' },
      }}
    >
      {/* Light spilling outward on hover */}
      <motion.div
        className="absolute pointer-events-none rounded-[50%]"
        style={{
          inset: -60, background: `radial-gradient(circle, ${game.glow}66, transparent 70%)`, zIndex: -1,
        }}
        animate={{ opacity: hovered || entering ? 1 : 0, scale: hovered || entering ? 1.15 : 0.9 }}
        transition={{ duration: 0.4 }}
      />

      {/* The live preview — bright and alive, filling almost the whole window */}
      {failed ? (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, #fff3e0, ${game.glow})` }}
        />
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      )}

      {/* Entry flash */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: game.glow, mixBlendMode: 'screen' }}
        animate={{ opacity: entering ? 0.55 : 0 }}
        transition={{ duration: 0.38 }}
      />

      {/* Label */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center px-4 pb-6 pt-16"
        style={{ background: 'linear-gradient(0deg, rgba(6,5,10,0.9) 0%, rgba(6,5,10,0.55) 55%, transparent 100%)' }}
      >
        <span
          className="font-display font-bold text-white drop-shadow"
          style={{ fontSize: 'clamp(1.7rem, 11.5cqw, 2.7rem)', lineHeight: 1.05, letterSpacing: '-0.01em' }}
        >
          {game.title}
        </span>
        <span
          className="mt-2 text-white/85 leading-snug"
          style={{ fontSize: 'clamp(0.95rem, 5.6cqw, 1.3rem)' }}
        >
          {game.desc}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigateTo    = useAppStore((s) => s.navigateTo);
  const soundEnabled  = useAppStore((s) => s.soundEnabled);
  const toggleSound   = useAppStore((s) => s.toggleSound);
  const storeReduced  = useAppStore((s) => s.reducedMotion);
  const prefersReduced = useReducedMotion();
  const reduced = storeReduced || !!prefersReduced;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [musicVol, setMusicVolState]    = useState(audioSettings.musicVol);
  const [sfxVol,   setSfxVolState]      = useState(audioSettings.sfxVol);

  function handleMusicVol(v: number) {
    setMusicVolState(v);
    audioSettings.setMusicVol(v);
  }
  function handleSfxVol(v: number) {
    setSfxVolState(v);
    audioSettings.setSfxVol(v);
  }
  function handleEnter(g: WorldGame) {
    navigateTo(g.intro);
  }

  if (reduced) {
    return <ReducedFallback onSelect={handleEnter} />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <LivingBackground />

      {/* Caption */}
      <motion.div
        className="absolute pointer-events-none text-center"
        style={{ zIndex: 5, top: '4%', left: '50%', translateX: '-50%' }}
        initial={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <p className="text-[11px] font-semibold" style={{ color: '#e0b34f', letterSpacing: '0.24em' }}>
          YOUR ARTWORK IS BEING CREATED
        </p>
        <h1
          className="font-display text-2xl sm:text-3xl font-semibold mt-1.5"
          style={{ color: '#f0e6da', textShadow: '0 2px 24px rgba(140,110,220,0.5)' }}
        >
          Play a Mini-Game While You Wait
        </h1>
      </motion.div>

      {/* Four giant portals */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 5, gap: '1vw', padding: '0 1.5vw' }}
      >
        {WORLD_GAMES.map((g) => (
          <Portal key={g.id} game={g} onSelect={() => handleEnter(g)} />
        ))}
      </div>

      {/* Audio settings */}
      <div className="absolute top-5 right-5" style={{ zIndex: 30 }}>
        <button
          onClick={() => { setSettingsOpen(s => !s); bgMusic.unlock(); }}
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Audio settings"
          style={{ color: '#f0e6da' }}
        >
          <SpeakerIcon muted={!soundEnabled} className="w-6 h-6" />
        </button>

        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-9 rounded-2xl p-4 flex flex-col gap-3"
              style={{
                background: 'rgba(18,14,26,0.94)',
                border: '1px solid rgba(168,121,232,0.28)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                minWidth: 210,
              }}
            >
              <button
                onClick={toggleSound}
                className="text-left text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
                style={{
                  color: soundEnabled ? '#f0e6da' : 'rgba(240,230,218,0.4)',
                  background: soundEnabled ? 'rgba(216,179,79,0.16)' : 'rgba(240,230,218,0.06)',
                }}
              >
                {soundEnabled ? '🔊  Sound On' : '🔇  Sound Off'}
              </button>

              <label className="flex flex-col gap-1.5">
                <span style={{ color: 'rgba(240,230,218,0.6)', fontSize: 11, letterSpacing: '0.05em' }}>MUSIC</span>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={musicVol}
                  onPointerDown={() => { bgMusic.unlock(); audioSettings.setMusicVol(musicVol); }}
                  onChange={e => handleMusicVol(parseFloat(e.target.value))}
                  style={{ accentColor: '#e0b34f', width: '100%' }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={{ color: 'rgba(240,230,218,0.6)', fontSize: 11, letterSpacing: '0.05em' }}>SOUND EFFECTS</span>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={sfxVol}
                  onChange={e => handleSfxVol(parseFloat(e.target.value))}
                  style={{ accentColor: '#e0b34f', width: '100%' }}
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Credit */}
      <div className="absolute bottom-3 left-4" style={{ zIndex: 5, color: 'rgba(240,230,218,0.4)', fontSize: 10 }}>
        Music by{' '}
        <a
          href="https://incompetech.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'rgba(240,230,218,0.55)', textDecoration: 'underline' }}
        >
          Kevin MacLeod
        </a>
        {' '}· CC BY 4.0
      </div>
    </div>
  );
}
