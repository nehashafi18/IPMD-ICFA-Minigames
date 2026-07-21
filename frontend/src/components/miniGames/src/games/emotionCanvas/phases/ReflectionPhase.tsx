import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOTIONS, WHAT_HELPED_OPTIONS } from '../emotionCanvasData';
import EmotionCard from '../components/EmotionCard';
import type { EmotionAdapter } from '../systems/emotionAdapter';

interface Props {
  preEmotions: string[];
  adapter: EmotionAdapter;
  onDone: () => void;
  onBack: () => void;
  reducedMotion: boolean;
}

type Step = 'how-now' | 'what-helped' | 'reinforcement';

const POSITIVE_MESSAGES = [
  'You explored your feelings today.',
  'You paid attention to how you feel.',
  'You noticed something about yourself.',
  'You tried different ways to change your world.',
  'That took courage — checking in with yourself.',
];

export default function ReflectionPhase({ preEmotions, adapter, onDone, onBack, reducedMotion }: Props) {
  const [step, setStep] = useState<Step>('how-now');
  const [postEmotions, setPostEmotions] = useState<Set<string>>(new Set());
  const [whatHelped, setWhatHelped]     = useState<Set<string>>(new Set());
  const [message]     = useState(() =>
    POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)]
  );

  const togglePost   = (id: string) => setPostEmotions((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleHelped = (id: string) => setWhatHelped((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Detect emotional shift
  const shifted = [...postEmotions].some((id) => !preEmotions.includes(id)) || postEmotions.size !== preEmotions.length;
  const calmer  = postEmotions.has('calm') || postEmotions.has('happy') || postEmotions.has('curious');
  const summary = adapter.getSummary();

  return (
    <div className="fixed inset-0 z-30 flex flex-col" style={{ background: '#05080F' }}>
      {/* Exit button */}
      <button onClick={onBack}
        className="absolute top-5 left-5 z-20 text-sm opacity-40 hover:opacity-100 transition-opacity"
        style={{ color: '#fff' }}>
        ←
      </button>
      {/* Ambient bg */}
      {!reducedMotion && (
        <motion.div className="absolute inset-0 pointer-events-none"
          animate={{ background: calmer
            ? 'radial-gradient(ellipse at 50% 40%, rgba(0,188,212,0.1) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(155,111,216,0.1) 0%, transparent 70%)' }}
          transition={{ duration: 2 }}
        />
      )}

      <AnimatePresence mode="wait">

        {/* ── How do you feel now? ───────────────────────────────── */}
        {step === 'how-now' && (
          <motion.div key="how-now"
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45 }}
          >
            <div className="px-6 pt-8 pb-4 flex-shrink-0 text-center">
              <h2 className="font-display font-bold" style={{ color: '#FFFFFF', fontSize: 'clamp(1.6rem, 5vw, 2.5rem)' }}>
                How do you feel now?
              </h2>
              <p className="mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                You don't have to feel different — all feelings are okay
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-28">
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', paddingBottom: 20 }}>
                {EMOTIONS.map((emotion) => (
                  <EmotionCard
                    key={emotion.id}
                    emotion={emotion}
                    selected={postEmotions.has(emotion.id)}
                    onSelect={() => togglePost(emotion.id)}
                  />
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4"
              style={{ background: 'linear-gradient(to top, #05080F 60%, transparent)' }}>
              <motion.button
                onClick={() => setStep('what-helped')}
                className="w-full py-4 rounded-2xl font-bold text-white max-w-md mx-auto block"
                style={{ background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)', fontSize: '1.1rem' }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              >
                {postEmotions.size === 0 ? 'Skip →' : 'Next →'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Emotional shift transition ─────────────────────────── */}
        {step === 'what-helped' && shifted && calmer && !reducedMotion && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 3, times: [0, 0.4, 1] }}
          >
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <radialGradient id="shiftGrad">
                  <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <ellipse cx="50%" cy="50%" rx="60%" ry="55%" fill="url(#shiftGrad)" />
            </svg>
            <p className="font-display text-2xl font-semibold z-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Something shifted.
            </p>
          </motion.div>
        )}

        {/* ── What helped? ──────────────────────────────────────── */}
        {step === 'what-helped' && (
          <motion.div key="what-helped"
            className="flex-1 flex flex-col px-6 pt-8 pb-6 overflow-y-auto"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45 }}
          >
            <div className="text-center mb-8">
              <h2 className="font-display font-bold" style={{ color: '#FFFFFF', fontSize: 'clamp(1.6rem, 5vw, 2.5rem)' }}>
                What helped?
              </h2>
              <p className="mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Choose anything that felt good
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {WHAT_HELPED_OPTIONS.map((opt) => {
                const sel = whatHelped.has(opt.id);
                return (
                  <motion.button key={opt.id}
                    onClick={() => toggleHelped(opt.id)}
                    className="flex items-center gap-3 rounded-2xl p-4 border text-left"
                    style={{
                      background: sel ? 'rgba(155,111,216,0.25)' : 'rgba(255,255,255,0.04)',
                      borderColor: sel ? '#9B6FD8' : 'rgba(255,255,255,0.1)',
                    }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <span className="font-semibold" style={{ color: sel ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                      {opt.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={() => setStep('reinforcement')}
              className="w-full py-4 rounded-2xl font-bold text-white max-w-md mx-auto block"
              style={{ background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)', fontSize: '1.1rem' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              See my reflection →
            </motion.button>
          </motion.div>
        )}

        {/* ── Reinforcement ─────────────────────────────────────── */}
        {step === 'reinforcement' && (
          <motion.div key="reinforcement"
            className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-8"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Gentle sparkle */}
            {!reducedMotion && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 18 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      left: `${10 + (i * 37) % 80}%`,
                      top: `${5 + (i * 53) % 80}%`,
                      background: ['#CE93D8','#80DEEA','#FFD54F','#A5D6A7'][i % 4],
                    }}
                    animate={{ scale: [0, 1.8, 0], opacity: [0, 0.9, 0] }}
                    transition={{ duration: 2.5 + (i % 4) * 0.5, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
            )}

            {/* Star icon */}
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #9B6FD8, #00BCD4)' }}
              animate={reducedMotion ? {} : { scale: [1, 1.06, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-5xl">✦</span>
            </motion.div>

            {/* Main message */}
            <motion.h2
              className="font-display font-bold"
              style={{ color: '#FFFFFF', fontSize: 'clamp(1.5rem, 5vw, 2.4rem)', maxWidth: 480 }}
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {message}
            </motion.h2>

            {/* Activity summary */}
            <motion.p
              style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', maxWidth: 380 }}
              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              {summary}
            </motion.p>

            {/* Emotion shift note */}
            {shifted && (
              <motion.div
                className="rounded-2xl px-6 py-4 max-w-sm"
                style={{ background: 'rgba(0,188,212,0.12)', border: '1px solid rgba(0,188,212,0.25)' }}
                initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p className="text-sm" style={{ color: '#80DEEA' }}>
                  Your feelings changed while you were here. That's what feelings do — they shift and move.
                </p>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              className="flex gap-3 w-full max-w-sm"
              initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <button
                onClick={onDone}
                className="flex-1 py-4 rounded-2xl text-sm font-semibold border"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                Done
              </button>
              <motion.button
                onClick={() => { setStep('how-now'); setPostEmotions(new Set()); setWhatHelped(new Set()); }}
                className="flex-1 py-4 rounded-2xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)' }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              >
                Go again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
