import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { SHOWCASE_IMAGES } from '../config/showcaseImages';
import { QuantumTunnelEngine } from '../three/QuantumTunnelEngine';

// ─── Timing — each title holds 12-13.5s so it can actually be read ─────────────

const TOTAL_MS  = 79_000;
const LAUNCH_AT = 63_000;
const FLASH_AT  = 77_000;

// ─── Narrative text ───────────────────────────────────────────────────────────

const NARRATIVE: Array<{ at: number; text: string | null }> = [
  { at:   800, text: 'Thank you for sharing your artwork.' },
  { at: 13300, text: 'Your creation is now entering a world of transformation.' },
  { at: 25800, text: 'While your masterpiece is being generated, explore the creativity of fellow artists.' },
  { at: 38300, text: 'These artworks were created by artists who shared their imagination with our community.' },
  { at: 50800, text: 'Stay tuned…' },
  { at: 63300, text: 'Your own artwork is about to become something extraordinary.' },
  { at: 76800, text: null },
];

type Phase = 'gallery' | 'launch' | 'flash';

// ─── Component ────────────────────────────────────────────────────────────────
//
// An infinite physical archive: the camera glides through a warmly-lit gallery
// corridor that slowly bends and changes wings. Hundreds of framed artworks and
// drifting paper fragments surround it, appearing suddenly, fading like a
// memory, or folding shut and reopening as a different piece — driven by
// QuantumTunnelEngine (Three.js). This component owns only the DOM overlay:
// cinematic title cards, status badge, and progress bar.

interface Props { onDone: () => void; }

export default function TransitionScreen({ onDone }: Props) {
  const prefersReduced = useReducedMotion();
  const storeReduced   = useAppStore(s => s.reducedMotion);
  const submittedUrl   = useAppStore(s => s.submittedImageUrl);
  const reduced        = storeReduced || !!prefersReduced;

  const [phase,  setPhase]  = useState<Phase>('gallery');
  const [curMsg, setCurMsg] = useState<string | null>(null);

  const doneRef   = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Archive corridor engine (Three.js) ──────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;

    const urls: string[] = [];
    if (submittedUrl) urls.push(submittedUrl);
    SHOWCASE_IMAGES.forEach(s => urls.push(s.src));
    if (!urls.length) return;

    const engine = new QuantumTunnelEngine({
      canvas,
      urls,
      totalMs: TOTAL_MS,
      launchAtMs: LAUNCH_AT,
      reducedMotion: reduced,
    });
    engine.start();

    return () => engine.dispose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedUrl, reduced]);

  // ── Narrative text ──────────────────────────────────────────────────────────

  useEffect(() => {
    const ts = NARRATIVE.map(({ at, text }) => setTimeout(() => setCurMsg(text), at));
    return () => ts.forEach(clearTimeout);
  }, []);

  // ── Phase timers ────────────────────────────────────────────────────────────

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('launch'), LAUNCH_AT);
    const t2 = setTimeout(() => setPhase('flash'),  FLASH_AT);
    const t3 = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onDone(); }
    }, TOTAL_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDone]);

  // ── Reduced-motion fallback ─────────────────────────────────────────────────

  if (reduced) {
    return (
      <div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 px-8 text-center"
        style={{ background: '#000000' }}
      >
        <p className="text-2xl font-semibold text-white">Thank you for sharing your artwork!</p>
        <p className="text-base" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 320 }}>
          We're transforming your image into a fine art masterpiece.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden select-none" style={{ background: '#000000' }}>

      {/* ── The archive corridor (WebGL) ──────────────────────────────────────
          Hundreds of framed artworks and paper fragments surrounding the
          camera in a warmly-lit, slowly bending gallery — see
          QuantumTunnelEngine for the full scene.
      ──────────────────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* ── Status badge ────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute z-20 top-5 left-0 right-0 flex justify-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <motion.div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(0,0,0,0.58)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(210,210,220,0.82)',
            letterSpacing: '0.08em',
            backdropFilter: 'blur(8px)',
          }}
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.span
            style={{ fontSize: 7, color: '#D8B978' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >●</motion.span>
          CREATING YOUR ARTWORK
        </motion.div>
      </motion.div>

      {/* ── Center vignette — keeps the cinematic title legible over a busy field ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 62% 42% at 50% 50%, rgba(0,0,0,0.5), transparent 72%)',
        }}
      />

      {/* ── Narrative text — cinematic title overlay, centered ─────────────────── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-10">
        <AnimatePresence mode="wait">
          {curMsg && (
            <motion.p
              key={curMsg}
              className="font-display"
              style={{
                color: 'rgba(255,255,255,0.97)',
                fontSize: 'clamp(1.5rem, 4.2vw, 2.9rem)',
                fontWeight: 600,
                lineHeight: 1.35,
                letterSpacing: '0.015em',
                textAlign: 'center',
                maxWidth: 820,
                textShadow: '0 4px 40px rgba(0,0,0,0.95), 0 2px 14px rgba(0,0,0,1)',
              }}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.03, y: -12 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            >
              {curMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute z-20 left-10 right-10"
        style={{ bottom: 20 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      >
        <div style={{
          height: 2, borderRadius: 9999, overflow: 'hidden',
          background: 'rgba(255,255,255,0.08)',
        }}>
          <motion.div
            style={{
              height: '100%', borderRadius: 9999,
              background: 'rgba(255,255,255,0.35)',
              transformOrigin: 'left',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: TOTAL_MS / 1000, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* ── Final fade to black ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'flash' && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: (TOTAL_MS - FLASH_AT) / 1000, ease: 'easeIn' }}
            style={{ background: '#000000' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
