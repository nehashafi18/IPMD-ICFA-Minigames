import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { TRANSITION_BACKDROPS } from '../systems/gameArt';

interface Props {
  onDone: () => void;
}

// Scene 1 carries the most text, so it stays on screen longer to read comfortably.
const SCENE_DURATIONS = [5500, 9500, 5500];
const TOTAL_MS = SCENE_DURATIONS.reduce((a, b) => a + b, 0);

const SCENES = [
  {
    headline: 'Your creation is coming to life',
    body: '',
  },
  {
    headline: '',
    body:
      'Thank you for sharing your ideas and emotions with us. Your artwork is being carefully created and may take a little time. While we prepare it, enjoy a few interactive experiences designed for relaxation and exploration.',
  },
  {
    headline: '',
    body: 'Just one more step before your final artwork appears.',
  },
];

export default function TransitionScreen({ onDone }: Props) {
  const storeReducedMotion = useAppStore((s) => s.reducedMotion);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = storeReducedMotion || !!prefersReducedMotion;

  const [scene, setScene] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(() => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      }, TOTAL_MS);
      return () => clearTimeout(t);
    }
    if (scene >= SCENES.length - 1) {
      const t = setTimeout(() => {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
      }, SCENE_DURATIONS[scene]);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setScene((s) => s + 1), SCENE_DURATIONS[scene]);
    return () => clearTimeout(t);
  }, [scene, reducedMotion, onDone]);

  if (reducedMotion) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center px-8 text-center gap-7" style={{ background: '#05080F' }}>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold" style={{ color: '#FFFFFF', width: '70vw' }}>
          Your creation is coming to life
        </h1>
        <p className="font-display text-4xl sm:text-5xl font-semibold" style={{ color: 'rgba(255,255,255,0.92)', width: '70vw' }}>
          {SCENES[1].body}
        </p>
        <p className="font-display text-4xl sm:text-5xl font-semibold" style={{ color: 'rgba(255,255,255,0.85)', width: '70vw' }}>
          {SCENES[2].body}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden" style={{ background: '#05080F' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={scene}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <motion.img
            src={TRANSITION_BACKDROPS[scene]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: SCENE_DURATIONS[scene] / 1000 + 0.8, ease: 'linear' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(3,5,10,0.45) 0%, rgba(3,5,10,0.65) 70%, rgba(3,5,10,0.85) 100%)' }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center gap-7">
        <AnimatePresence mode="wait">
          {scene === 0 && (
            <motion.h1
              key="headline"
              className="font-display text-4xl sm:text-5xl font-semibold"
              style={{ color: '#FFFFFF', width: '70vw' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8 }}
            >
              {SCENES[0].headline}
            </motion.h1>
          )}

          {scene === 1 && (
            <motion.p
              key="body"
              className="font-display text-4xl sm:text-5xl font-semibold leading-tight"
              style={{ color: 'rgba(255,255,255,0.92)', width: '70vw' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8 }}
            >
              {SCENES[1].body}
            </motion.p>
          )}

          {scene === 2 && (
            <motion.p
              key="cards"
              className="font-display text-4xl sm:text-5xl font-semibold leading-tight"
              style={{ color: 'rgba(255,255,255,0.85)', width: '70vw' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.8 }}
            >
              {SCENES[2].body}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
