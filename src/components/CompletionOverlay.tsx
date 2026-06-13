import { motion } from 'framer-motion';

interface Props {
  title: string;
  subtitle?: string;
  score?: number;
  onReplay: () => void;
  onHome: () => void;
}

export default function CompletionOverlay({ title, subtitle, score, onReplay, onHome }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(240, 235, 228, 0.88)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        className="glass rounded-3xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4"
        style={{ boxShadow: '0 8px 40px rgba(100,60,160,0.12)' }}
        initial={{ scale: 0.75, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        <motion.div
          className="text-6xl"
          animate={{ rotate: [0, 10, -8, 4, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          🎨
        </motion.div>

        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold mb-2" style={{ color: '#3A2060' }}>
            {title}
          </h2>
          {subtitle && <p className="text-sm opacity-60">{subtitle}</p>}
        </div>

        {score !== undefined && (
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest mb-1 opacity-40">Score</div>
            <div className="text-4xl font-bold font-display" style={{ color: '#7B4FC8' }}>{score}</div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={onReplay}
            className="flex-1 py-3 rounded-xl glass border border-black/10 font-semibold text-sm hover:border-black/20 transition-all active:scale-95"
          >
            Play Again
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)' }}
          >
            Home
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
