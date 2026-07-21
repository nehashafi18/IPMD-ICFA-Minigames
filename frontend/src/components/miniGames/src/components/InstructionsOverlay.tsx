import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { ART_STYLE_IMAGES, type ArtStyleId } from '../systems/gameArt';

type GameType = 'match3' | 'bubble' | 'artDetective';

const DEMO_STYLES: ArtStyleId[] = ['watercolor', 'sparkles', 'soft-pastel'];

const PHRASES: Record<GameType, string[]> = {
  match3:       ['Swap two tiles', 'Match 3 in a row', 'Bigger combos score more'],
  bubble:       ['Aim at the red ball', 'Click to shoot', 'Hit it before it falls'],
  artDetective: ['Search the scene', 'Tap a hidden object', 'Find all objects before time runs out'],
};

interface Props {
  game: GameType;
  onPlay: () => void;
}

/* ── Match-3 demo ──────────────────────────────────────────────────────────── */
function Match3Demo({ step }: { step: number }) {
  const images = DEMO_STYLES.map((id) => ART_STYLE_IMAGES[id]);
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6">
      {images.map((src, i) => (
        <motion.div
          key={i}
          className="rounded-3xl overflow-hidden"
          style={{
            width: 'min(28vw, 160px)',
            height: 'min(28vw, 160px)',
            boxShadow: step === 2
              ? '0 0 40px rgba(155,111,216,0.9), 0 0 80px rgba(155,111,216,0.4)'
              : step === 1 && i === 1
              ? '0 0 32px rgba(159,216,255,0.8)'
              : '0 4px 20px rgba(0,0,0,0.35)',
          }}
          animate={{
            scale: step === 2 ? [1, 1.12, 1] : step === 1 && i === 1 ? 1.08 : 1,
            y:     step === 1 && i === 1 ? -12 : 0,
            rotate: step === 2 ? [0, -3, 3, 0] : 0,
          }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        >
          <img src={src} alt="" className="w-full h-full object-cover" />
        </motion.div>
      ))}
    </div>
  );
}

/* ── Bubble-Shooter demo ────────────────────────────────────────────────────── */
function BubbleDemo() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{
        width: 'min(70vw, 320px)',
        height: 'min(80vw, 400px)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {[{ left: '12%', delay: 0.4, dur: 2.7 }, { left: '68%', delay: 1.0, dur: 2.9 }].map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 52, height: 52, left: b.left,
            background: 'radial-gradient(circle at 35% 32%, #90AAFF, #1840FF 60%, #000D66)',
            boxShadow: '0 0 18px rgba(48,96,255,0.55)',
          }}
          animate={{ y: ['0%', '420%'] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 68, height: 68, left: '50%', marginLeft: -34,
          background: 'radial-gradient(circle at 35% 32%, #FF9090, #FF1818 55%, #8B0000)',
          boxShadow: '0 0 32px rgba(255,30,30,0.8)',
        }}
        animate={{ y: ['0%', '380%'] }}
        transition={{ duration: 2.0, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute"
        style={{
          left: '50%', bottom: 36, width: 2, height: '62%',
          transformOrigin: 'bottom center', transform: 'translateX(-50%)',
          background: 'repeating-linear-gradient(to top, rgba(255,180,180,0.5) 0px, rgba(255,180,180,0.5) 6px, transparent 6px, transparent 12px)',
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 40, height: 40, left: '50%', bottom: 10, marginLeft: -20,
          background: 'radial-gradient(circle at 35% 35%, #FF9090, #CC2222)',
          boxShadow: '0 0 18px rgba(255,60,60,0.65)',
        }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 16, height: 16, left: '50%', marginLeft: -8,
          background: 'radial-gradient(circle at 35% 35%, #fff, #FF4040)',
          boxShadow: '0 0 12px rgba(255,80,80,0.9)',
        }}
        animate={{ bottom: ['9%', '92%', '9%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', times: [0, 0.08, 0.92, 1] }}
      />
    </div>
  );
}

/* ── Art-Detective demo ─────────────────────────────────────────────────────── */
// 5-second loop: cursor scans → arrives at TARGET → ring expands → burst → found
const DET_TARGET = { left: '63%', top: '40%' };
const DET_OBJECTS = [
  { left: '22%', top: '62%' },
  DET_TARGET,
  { left: '80%', top: '68%' },
];

function DetectiveDemo() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{ width: 'min(82vw, 420px)', height: 'min(56vw, 260px)' }}
    >
      {/* Scene background */}
      <img
        src={ART_STYLE_IMAGES['oil-paint']}
        alt=""
        className="w-full h-full object-cover"
        style={{ filter: 'saturate(0.45) brightness(0.55)' }}
      />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(5,8,15,0.75) 100%)',
      }} />

      {/* Hidden object dots — ambient pulse */}
      {DET_OBJECTS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: pos.left, top: pos.top,
            width: 10, height: 10, marginLeft: -5, marginTop: -5,
            background: 'rgba(255,210,70,0.95)',
            boxShadow: '0 0 10px rgba(255,190,40,0.85)',
          }}
          animate={{
            opacity: i === 1
              ? [0.8, 0.8, 0.8, 0, 0, 0.8]
              : [0.5, 0.9, 0.5],
            scale: i === 1 ? 1 : [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: i === 1 ? 5 : 2.2,
            times: i === 1 ? [0, 0.6, 0.62, 0.64, 0.99, 1] : undefined,
            delay: i * 0.7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Touch indicator — scans then arrives at target */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 26, height: 26, marginLeft: -13, marginTop: -13,
          background: 'rgba(255,255,255,0.2)',
          border: '2px solid rgba(255,255,255,0.75)',
        }}
        animate={{
          left: ['14%', '52%', '34%', DET_TARGET.left, '80%', '26%', '14%'],
          top:  ['28%', '68%', '28%', DET_TARGET.top,  '70%', '50%', '28%'],
          scale: [1, 1, 1, 1.25, 1, 1, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.2, 0.4, 0.6, 0.75, 0.9, 1],
        }}
      />

      {/* Find ring — expands when cursor hits target (t = 3.0s) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: DET_TARGET.left, top: DET_TARGET.top,
          width: 46, height: 46, marginLeft: -23, marginTop: -23,
          border: '2.5px solid #FFD43B',
        }}
        animate={{ scale: [0.3, 1.1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.85, delay: 3.0, repeat: Infinity, repeatDelay: 4.15 }}
      />

      {/* Burst on tap */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: DET_TARGET.left, top: DET_TARGET.top,
          width: 64, height: 64, marginLeft: -32, marginTop: -32,
          background: 'radial-gradient(circle, rgba(255,220,60,0.9) 0%, rgba(255,180,30,0.3) 55%, transparent 70%)',
        }}
        animate={{ scale: [0, 1.7], opacity: [0.85, 0] }}
        transition={{ duration: 0.5, delay: 3.75, repeat: Infinity, repeatDelay: 4.5 }}
      />

      {/* "Found" label */}
      <motion.p
        className="absolute text-xs font-semibold"
        style={{
          left: DET_TARGET.left, top: DET_TARGET.top,
          transform: 'translate(-50%, -220%)',
          color: '#FFD43B',
          textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          letterSpacing: '0.05em',
        }}
        animate={{ y: [6, 0, 0, -4], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.95, delay: 3.75, repeat: Infinity, repeatDelay: 4.05 }}
      >
        Found!
      </motion.p>
    </div>
  );
}

export default function InstructionsOverlay({ game, onPlay }: Props) {
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const phrases = PHRASES[game];
  const [phraseIdx, setPhraseIdx] = useState(0);

  const isLast = phraseIdx === phrases.length - 1;

  const advance = () => {
    if (isLast) onPlay();
    else setPhraseIdx((i) => i + 1);
  };

  const DemoComponent = game === 'match3'
    ? () => <Match3Demo step={phraseIdx} />
    : game === 'artDetective'
    ? DetectiveDemo
    : BubbleDemo;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: '#05080F' }}
    >
      {/* Visual demo */}
      <DemoComponent />

      {/* Phrase + dots + button — grouped together */}
      <div className="flex flex-col items-center gap-5" style={{ maxWidth: 440, width: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIdx}
            className="text-center font-display font-semibold"
            style={{
              color: '#FFFFFF',
              fontSize: 'clamp(1.6rem, 5.5vw, 2.4rem)',
              textShadow: '0 2px 16px rgba(0,0,0,0.6)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.4 }}
          >
            {phrases[phraseIdx]}
          </motion.p>
        </AnimatePresence>

        {/* Progress dots */}
        {!reducedMotion && (
          <div className="flex gap-2.5">
            {phrases.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 8, height: 8,
                  background: i === phraseIdx ? '#9FD8FF' : 'rgba(159,216,255,0.22)',
                }}
                animate={{ scale: i === phraseIdx ? 1.35 : 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        )}

        {/* Next / Start button — sits immediately below text */}
        <motion.button
          onClick={advance}
          className="w-full py-4 rounded-2xl font-semibold text-white"
          style={{
            fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
            background: isLast
              ? 'linear-gradient(135deg, #9B6FD8, #7B4FC8)'
              : 'rgba(255,255,255,0.08)',
            border: isLast ? 'none' : '1px solid rgba(255,255,255,0.14)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          layout
        >
          {isLast ? 'Start Game' : 'Next →'}
        </motion.button>
      </div>
    </motion.div>
  );
}
