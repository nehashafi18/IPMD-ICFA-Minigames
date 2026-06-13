import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { emojiUrl } from './twemoji';

const DEMO_EMOJIS = ['🌹', '🎸', '🐯', '🍎', '🌊', '🚀', '🦊', '🎂', '🐧'];
const DEMO_COLORS = [
  '#ff9a9e', '#ffd700', '#e07b39', '#a8d8ea',
  '#4db8e8',
  '#e040fb', '#fad0c4', '#c9b1d0', '#6b6b8a',
];
const TARGET = 4;
const SLIDE_MS = 2600;

const STEPS = [
  { icon: '👁️', label: 'Watch' },
  { icon: '🔍', label: 'Find it' },
  { icon: '🌑', label: 'Remember' },
  { icon: '👆', label: 'Tap!' },
];

interface Props { onPlay: () => void }

export default function MemoryInstructions({ onPlay }: Props) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSlide((s) => (s + 1) % 4), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(240,234,226,0.93)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        className="glass rounded-3xl p-8 flex flex-col items-center gap-6"
        style={{
          width: '70vw',
          height: '70vh',
          boxShadow: '0 8px 48px rgba(80,40,130,0.13)',
        }}
        initial={{ scale: 0.88, y: 28 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Animated graphic panel */}
        <div
          className="w-full relative rounded-2xl overflow-hidden flex-1 min-h-0"
          style={{
            background: 'rgba(155,111,216,0.07)',
            border: '1px solid rgba(155,111,216,0.14)',
          }}
        >
          <AnimatePresence mode="wait">
            <SlideGraphic key={slide} slide={slide} />
          </AnimatePresence>
        </div>

        {/* Step label */}
        <AnimatePresence mode="wait">
          <motion.p
            key={slide}
            className="text-3xl font-bold select-none"
            style={{ color: '#3A2060' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24 }}
          >
            {STEPS[slide].icon} {STEPS[slide].label}
          </motion.p>
        </AnimatePresence>

        {/* Step dots */}
        <div className="flex gap-3 items-center">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === slide ? 32 : 12,
                background: i === slide ? '#9B6FD8' : 'rgba(155,111,216,0.22)',
              }}
              style={{ height: 12 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={onPlay}
          className="w-full py-5 rounded-2xl font-bold text-white text-xl"
          style={{ background: 'linear-gradient(135deg,#9B6FD8,#7B4FC8)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          Let's Play ✦
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function SlideGraphic({ slide }: { slide: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.28 }}
    >
      {slide === 0 && <SlideSymbol />}
      {slide === 1 && <MiniGrid showEmojis />}
      {slide === 2 && <MiniGrid showEmojis={false} />}
      {slide === 3 && <MiniGrid showEmojis={false} tap />}
    </motion.div>
  );
}

function SlideSymbol() {
  return (
    <motion.div
      className="rounded-3xl flex flex-col items-center justify-center gap-3 px-14 py-7"
      style={{ background: 'rgba(155,111,216,0.12)', border: '2px solid rgba(155,111,216,0.28)' }}
      animate={{
        boxShadow: [
          '0 0 12px rgba(155,111,216,0.2)',
          '0 0 40px rgba(155,111,216,0.6)',
          '0 0 12px rgba(155,111,216,0.2)',
        ],
      }}
      transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.img
        src={emojiUrl('🌊')}
        alt="Wave"
        draggable={false}
        style={{ width: 96, height: 96 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="text-xl font-bold select-none" style={{ color: '#3A2060' }}>Wave</span>
    </motion.div>
  );
}

function MiniGrid({ showEmojis = true, tap = false }: { showEmojis?: boolean; tap?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DEMO_EMOJIS.map((emoji, i) => {
        const isTarget = i === TARGET;
        const highlight = isTarget && (showEmojis || tap);
        return (
          <motion.div
            key={i}
            className="w-20 h-20 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: highlight ? 'rgba(77,184,232,0.22)' : `${DEMO_COLORS[i]}22`,
              border: highlight ? '2px solid #4db8e8' : `1.5px solid ${DEMO_COLORS[i]}55`,
            }}
            animate={
              isTarget && tap
                ? { boxShadow: ['0 0 4px rgba(77,184,232,0.2)', '0 0 24px rgba(77,184,232,0.8)', '0 0 4px rgba(77,184,232,0.2)'] }
                : {}
            }
            initial={{ scale: 0.55, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{
              delay: i * 0.04,
              type: 'spring',
              damping: 18,
              boxShadow: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {showEmojis && (
              <img src={emojiUrl(emoji)} alt="" draggable={false} style={{ width: 36, height: 36, objectFit: 'contain' }} />
            )}
            {tap && isTarget && (
              <>
                <img src={emojiUrl(emoji)} alt="" draggable={false} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: 22, height: 22, background: 'rgba(77,184,232,0.45)' }}
                  animate={{ scale: [0.5, 3.2], opacity: [0.8, 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.7 }}
                />
                <motion.span
                  className="absolute text-sm pointer-events-none"
                  style={{ top: 2, right: 3 }}
                  animate={{ opacity: [0, 1, 0], y: [0, -12] }}
                  transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.7, delay: 0.35 }}
                >
                  ✨
                </motion.span>
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
