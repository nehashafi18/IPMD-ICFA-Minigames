import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOTIONS } from '../emotionCanvasData';
import EmotionCard from '../components/EmotionCard';
import BodyMap from '../components/BodyMap';

interface Props {
  onComplete: (emotions: string[], bodyZones: string[]) => void;
  onBack: () => void;
  reducedMotion: boolean;
}

type Step = 'emotions' | 'body';

export default function CheckInPhase({ onComplete, onBack, reducedMotion }: Props) {
  const [step,      setStep]      = useState<Step>('emotions');
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [bodyZones, setBodyZones] = useState<Set<string>>(new Set());

  const toggleEmotion = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleBody = useCallback((id: string) => {
    setBodyZones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleContinue = () => {
    if (step === 'emotions' && selected.size > 0) { setStep('body'); return; }
    if (step === 'body') { onComplete([...selected], [...bodyZones]); }
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col" style={{ background: '#05080F' }}>

      {/* Ambient blobs */}
      {!reducedMotion && (
        <>
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{ width: 600, height: 600, top: '-15%', left: '-10%',
              background: 'radial-gradient(circle, rgba(155,111,216,0.12) 0%, transparent 70%)',
              filter: 'blur(70px)' }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div className="absolute rounded-full pointer-events-none"
            style={{ width: 500, height: 500, bottom: '-10%', right: '-8%',
              background: 'radial-gradient(circle, rgba(128,222,234,0.10) 0%, transparent 70%)',
              filter: 'blur(70px)' }}
            animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      <AnimatePresence mode="wait">

        {/* ── EMOTION SELECTION — fills entire screen ─────────────────── */}
        {step === 'emotions' && (
          <motion.div key="emotions"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Minimal top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <button onClick={onBack}
                className="text-sm opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: '#fff' }}>
                ←
              </button>
              <p className="font-display font-semibold text-center flex-1"
                style={{ color: '#FFFFFF', fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>
                How are you feeling?
              </p>
              <div style={{ width: 24 }} /> {/* spacer */}
            </div>

            {/* Emotion grid — full remaining height, scrollable */}
            <div className="flex-1 overflow-y-auto px-3" style={{ minHeight: 0 }}>
              <div className="grid gap-2.5 pb-24" style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              }}>
                {EMOTIONS.map((emotion) => (
                  <EmotionCard
                    key={emotion.id}
                    emotion={emotion}
                    selected={selected.has(emotion.id)}
                    onSelect={() => toggleEmotion(emotion.id)}
                  />
                ))}
              </div>
            </div>

            {/* Continue button — floating at bottom, only active when something selected */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-8"
              style={{ background: 'linear-gradient(to top, #05080F 55%, transparent)' }}>
              <motion.button
                onClick={handleContinue}
                disabled={selected.size === 0}
                className="w-full py-4 rounded-2xl font-bold text-white"
                style={{
                  fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
                  background: selected.size > 0
                    ? 'linear-gradient(135deg, #9B6FD8, #7B4FC8)'
                    : 'rgba(255,255,255,0.07)',
                  border: selected.size > 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  opacity: selected.size === 0 ? 0.5 : 1,
                  transition: 'all 0.3s',
                }}
                whileHover={selected.size > 0 ? { scale: 1.02 } : {}}
                whileTap={selected.size > 0 ? { scale: 0.97 } : {}}
              >
                {selected.size === 0 ? 'Choose a feeling' : `Continue →`}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── BODY MAP — fills entire screen ──────────────────────────── */}
        {step === 'body' && (
          <motion.div key="body"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
          >
            {/* Minimal top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <button onClick={() => setStep('emotions')}
                className="text-sm opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: '#fff' }}>
                ←
              </button>
              <p className="font-display font-semibold text-center flex-1"
                style={{ color: '#FFFFFF', fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>
                Where do you feel it?
              </p>
              <div style={{ width: 24 }} />
            </div>

            {/* Body map — full remaining height */}
            <div className="flex-1 overflow-y-auto px-4" style={{ minHeight: 0 }}>
              <BodyMap selected={bodyZones} onToggle={toggleBody} />
            </div>

            <div className="px-5 pb-6 pt-4 flex-shrink-0"
              style={{ background: 'linear-gradient(to top, #05080F 55%, transparent)' }}>
              <motion.button
                onClick={handleContinue}
                className="w-full py-4 rounded-2xl font-bold text-white"
                style={{
                  fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
                  background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)',
                }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              >
                {bodyZones.size === 0 ? 'Skip →' : 'Create my world →'}
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
