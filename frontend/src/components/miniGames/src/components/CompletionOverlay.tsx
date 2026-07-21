import { motion } from 'framer-motion';
import { ART_STYLE_IMAGES } from '../systems/gameArt';

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
      style={{ background: 'rgba(3, 5, 10, 0.82)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        className="glass rounded-3xl p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4"
        style={{ boxShadow: '0 8px 40px rgba(100,60,160,0.12)' }}
        initial={{ scale: 0.75, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        <motion.div
          className="w-20 h-20 rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(140,90,180,0.25)' }}
          animate={{ rotate: [0, 6, -5, 2, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <img src={ART_STYLE_IMAGES.glitter} alt="" className="w-full h-full object-cover" />
        </motion.div>

        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold mb-2" style={{ color: '#FFFFFF' }}>
            {title}
          </h2>
          {subtitle && <p className="text-sm" style={{ color: '#9FD8FF' }}>{subtitle}</p>}
        </div>

        {score !== undefined && (
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9FD8FF' }}>Score</div>
            <div className="text-4xl font-bold font-display" style={{ color: '#9FD8FF' }}>{score}</div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={onReplay}
            className="flex-1 py-3 rounded-xl glass border border-white/15 font-semibold text-sm hover:border-white/30 transition-all active:scale-95"
            style={{ color: '#FFFFFF' }}
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
