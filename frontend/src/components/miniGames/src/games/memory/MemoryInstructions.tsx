import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { emojiUrl } from './twemoji';

interface Step {
  emoji: string;
  label: string;
  color: string;
}

const STEPS: Step[] = [
  { emoji: '👁️', label: 'Watch the cards', color: '#7B4FC8' },
  { emoji: '🧠', label: 'Remember where', color: '#9B6FD8' },
  { emoji: '🃏', label: 'Cards flip over', color: '#B06ED8' },
  { emoji: '👆', label: 'Find it!', color: '#C87FD8' },
];

function EmojiImg({ emoji, size }: { emoji: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span style={{ fontSize: size }}>{emoji}</span>;
  return (
    <img
      src={emojiUrl(emoji)}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

interface Props {
  onPlay: () => void;
}

export default function MemoryInstructions({ onPlay }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const current = STEPS[step];

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(240,234,226,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        className="flex flex-col items-center gap-8 rounded-3xl p-10"
        style={{
          width: '70vw',
          maxWidth: 600,
          background: 'rgba(255,255,255,0.80)',
          boxShadow: '0 12px 60px rgba(80,40,130,0.12)',
        }}
        initial={{ scale: 0.88, y: 28 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22 }}
      >
        {/* Animated icon + label */}
        <div className="flex flex-col items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center gap-3"
            >
              <EmojiImg emoji={current.emoji} size={96} />
              <span
                className="font-semibold text-2xl"
                style={{ color: current.color }}
              >
                {current.label}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex gap-2.5">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: i === step ? 24 : 8,
                background: i === step ? '#9B6FD8' : 'rgba(0,0,0,0.12)',
              }}
              style={{ height: 8 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Mini demo grid */}
        <div
          className="grid gap-2 rounded-2xl p-3"
          style={{
            gridTemplateColumns: 'repeat(3,1fr)',
            background: 'rgba(155,111,216,0.06)',
            width: 180,
          }}
        >
          {['🦁','🌸','🎮','🍓','🦊','🎸','🐬','🌻','🚀'].map((e, i) => (
            <motion.div
              key={e}
              className="flex items-center justify-center rounded-xl"
              style={{
                aspectRatio: '1',
                background: step < 2 ? 'rgba(155,111,216,0.12)' : 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(155,111,216,0.2)',
              }}
              animate={{ opacity: step < 2 ? 1 : i === 4 ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence mode="wait">
                {step < 2 ? (
                  <motion.span
                    key="visible"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: 22 }}
                  >
                    {e}
                  </motion.span>
                ) : step === 2 ? (
                  <motion.div
                    key="hidden"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="rounded-full"
                    style={{ width: 10, height: 10, background: '#9B6FD8', opacity: 0.2 }}
                  />
                ) : (
                  <motion.div
                    key="find"
                    initial={{ scale: 0 }}
                    animate={{ scale: i === 4 ? 1.1 : 1 }}
                    exit={{ scale: 0 }}
                    className="rounded-full"
                    style={{
                      width: 10, height: 10,
                      background: i === 4 ? '#9B6FD8' : 'rgba(0,0,0,0.12)',
                      opacity: i === 4 ? 0.9 : 0.2,
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={onPlay}
          className="w-full py-4 rounded-xl font-semibold text-white text-lg"
          style={{
            maxWidth: 300,
            background: 'linear-gradient(135deg,#9B6FD8,#7B4FC8)',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Play ✦
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
