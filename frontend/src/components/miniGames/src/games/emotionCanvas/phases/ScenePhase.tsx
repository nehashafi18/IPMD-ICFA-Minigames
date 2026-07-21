import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SceneCanvas, { type SceneOverrides } from '../components/SceneCanvas';
import ToolPanel from '../components/ToolPanel';
import BreathingGuide from '../components/BreathingGuide';
import { EmotionAdapter, type InteractionType } from '../systems/emotionAdapter';
import { AudioEngine } from '../systems/audioEngine';
import type { EmotionDef, SoundId } from '../emotionCanvasData';

const DEFAULT_OVERRIDES: SceneOverrides = {
  brightness: 100,
  saturation: 110,
  hueShift: 0,
  particleSpeedMult: 1.0,
  windX: 0,
  elements: new Set(),
};

interface AIBubble { text: string; emoji: string; key: number; }

interface Props {
  primaryEmotion: EmotionDef;
  onDone: (adapter: EmotionAdapter) => void;
  onBack: () => void;
  reducedMotion: boolean;
}

export default function ScenePhase({ primaryEmotion, onDone, onBack, reducedMotion }: Props) {
  const [overrides, setOverrides] = useState<SceneOverrides>(DEFAULT_OVERRIDES);
  const [activeSound, setActiveSound] = useState<SoundId | null>(
    primaryEmotion.defaultSound as SoundId | null
  );
  const [aiBubble, setAIBubble] = useState<AIBubble | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const adapterRef  = useRef(new EmotionAdapter());
  const audioRef    = useRef(new AudioEngine());
  const bubbleIdRef = useRef(0);

  // Auto-start default sound
  useEffect(() => {
    if (primaryEmotion.defaultSound) {
      audioRef.current.play(primaryEmotion.defaultSound as SoundId);
    }
    return () => { audioRef.current.stop(); };
  }, [primaryEmotion.defaultSound]);

  // Show "explore" prompt after a beat
  useEffect(() => {
    const t = setTimeout(() => setShowTools(true), 1800);
    return () => clearTimeout(t);
  }, []);

  const handleSound = useCallback((id: SoundId | null) => {
    setActiveSound(id);
    if (id) audioRef.current.play(id);
    else audioRef.current.stop();
  }, []);

  const handleInteraction = useCallback((type: InteractionType) => {
    const msg = adapterRef.current.record(type);
    if (msg) {
      const key = ++bubbleIdRef.current;
      setAIBubble({ ...msg, key });
      setTimeout(() => setAIBubble((b) => b?.key === key ? null : b), 4500);
    }
  }, []);

  const handleChange = useCallback((patch: Partial<SceneOverrides>) => {
    setOverrides((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex flex-col">
      {/* Living scene — fills most of the screen */}
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <SceneCanvas
          emotion={primaryEmotion}
          overrides={overrides}
          reducedMotion={reducedMotion}
        />

        {/* Header HUD */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-5 pb-4"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)' }}>
          <button onClick={onBack}
            className="text-sm opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: '#fff' }}>
            ←
          </button>
          <p className="font-display font-semibold text-xl" style={{ color: '#fff' }}>
            {primaryEmotion.label}
          </p>
          <motion.button
            onClick={() => onDone(adapterRef.current)}
            className="py-2 px-5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            Reflect →
          </motion.button>
        </div>

        {/* Explore prompt (initial) */}
        <AnimatePresence>
          {showTools && (
            <motion.div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-display font-semibold px-4"
                style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(1rem, 3.5vw, 1.5rem)', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                Can you change how your world feels?
              </p>
              <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Use the tools below
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI message bubble */}
        <AnimatePresence>
          {aiBubble && (
            <motion.div
              key={aiBubble.key}
              className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-2xl px-5 py-3 max-w-xs text-center"
              style={{
                background: 'rgba(3,5,16,0.82)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              initial={{ opacity: 0, y: -12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <span className="text-2xl flex-shrink-0">{aiBubble.emoji}</span>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {aiBubble.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tool panel */}
      <ToolPanel
        overrides={overrides}
        onChange={handleChange}
        activeSound={activeSound}
        onSound={handleSound}
        onInteraction={handleInteraction}
        onBreathing={() => setShowBreathing(true)}
      />

      {/* Breathing guide overlay */}
      <AnimatePresence>
        {showBreathing && (
          <BreathingGuide onClose={() => setShowBreathing(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
