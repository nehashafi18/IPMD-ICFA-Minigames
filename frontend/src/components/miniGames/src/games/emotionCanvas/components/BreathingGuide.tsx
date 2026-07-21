import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest';

const CYCLE: { phase: Phase; label: string; duration: number; color: string }[] = [
  { phase: 'inhale',  label: 'Breathe in',  duration: 4000, color: '#80DEEA' },
  { phase: 'hold',    label: 'Hold',        duration: 4000, color: '#CE93D8' },
  { phase: 'exhale',  label: 'Breathe out', duration: 6000, color: '#A5D6A7' },
  { phase: 'rest',    label: 'Rest',        duration: 2000, color: '#90CAF9' },
];

interface Props { onClose: () => void; }

export default function BreathingGuide({ onClose }: Props) {
  const [cycleIdx, setCycleIdx] = useState(0);
  const [count, setCount] = useState(0);

  const current = CYCLE[cycleIdx];

  const advance = useCallback(() => {
    setCycleIdx((i) => {
      const next = (i + 1) % CYCLE.length;
      if (next === 0) setCount((c) => c + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(advance, current.duration);
    return () => clearTimeout(t);
  }, [cycleIdx, current.duration, advance]);

  const scale = current.phase === 'inhale' ? 1.55
    : current.phase === 'hold' ? 1.55
    : current.phase === 'exhale' ? 1.0
    : 1.0;

  const dur = current.duration / 1000;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(3,5,16,0.92)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Cycle count */}
      {count > 0 && (
        <p className="absolute top-8 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cycle {count}
        </p>
      )}

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {/* Outer pulse rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: 240, height: 240,
              borderColor: current.color + '44',
            }}
            animate={{ scale: [1, 1.3 + i * 0.1], opacity: [0.5, 0] }}
            transition={{ duration: dur * 0.8, repeat: Infinity, delay: i * (dur * 0.15), ease: 'easeOut' }}
          />
        ))}

        {/* Main circle */}
        <motion.div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: 140, height: 140,
            background: `radial-gradient(circle, ${current.color}88 0%, ${current.color}33 60%, transparent 100%)`,
            border: `2px solid ${current.color}88`,
          }}
          animate={{ scale }}
          transition={{ duration: dur, ease: current.phase === 'inhale' ? 'easeIn' : current.phase === 'exhale' ? 'easeOut' : 'linear' }}
        />

        {/* Label */}
        <div className="relative text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={cycleIdx}
              className="font-display text-3xl font-semibold"
              style={{ color: current.color }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4 }}
            >
              {current.label}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {dur}s
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-3 mt-10">
        {CYCLE.map((step, i) => (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === cycleIdx ? 28 : 8,
              height: 8,
              background: i === cycleIdx ? current.color : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      <p className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Breathe with the circle
      </p>

      <button
        onClick={onClose}
        className="mt-10 px-8 py-3 rounded-2xl text-sm font-semibold"
        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        Done
      </button>
    </motion.div>
  );
}
