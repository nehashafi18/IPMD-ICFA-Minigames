import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export type GameIntroVariant = 'memory' | 'match3' | 'bubble' | 'artDetective';

interface Props {
  variant: GameIntroVariant;
  onDone: () => void;
}

const INTRO_MS = 2200;

const TEXT: Record<GameIntroVariant, string> = {
  memory: '',
  match3: '',
  bubble: '',
  artDetective: '',
};

export default function GameIntro({ variant, onDone }: Props) {
  const doneRef = useRef(false);

  useEffect(() => {
    const advanceTimer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, INTRO_MS);
    return () => clearTimeout(advanceTimer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6" style={{ background: '#05080F' }}>
      {TEXT[variant] && (
        <motion.p
          className="font-display text-2xl sm:text-3xl font-semibold text-center"
          style={{ color: '#FFFFFF', width: '70vw' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {TEXT[variant]}
        </motion.p>
      )}
    </div>
  );
}
