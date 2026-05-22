import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  score: number;
  best?: number;
  label?: string;
}

export default function ScoreBoard({ score, best, label = 'Score' }: Props) {
  return (
    <div className="flex items-center gap-6 glass rounded-2xl px-6 py-3 text-center">
      <div>
        <div className="text-xs opacity-50 uppercase tracking-wider mb-1">{label}</div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={score}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            className="text-2xl font-bold font-display text-glow"
          >
            {score}
          </motion.div>
        </AnimatePresence>
      </div>
      {best !== undefined && (
        <div>
          <div className="text-xs opacity-50 uppercase tracking-wider mb-1">Best</div>
          <div className="text-2xl font-bold font-display opacity-60">{best}</div>
        </div>
      )}
    </div>
  );
}
