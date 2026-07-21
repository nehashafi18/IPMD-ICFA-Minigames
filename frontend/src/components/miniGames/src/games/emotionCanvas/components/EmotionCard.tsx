import { motion } from 'framer-motion';
import type { EmotionDef } from '../emotionCanvasData';

interface Props {
  emotion: EmotionDef;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}

export default function EmotionCard({ emotion, selected, onSelect, compact }: Props) {
  if (compact) {
    return (
      <motion.button
        onClick={onSelect}
        className="relative flex flex-col items-center gap-1 rounded-2xl p-3 border-2 transition-all"
        style={{
          background: selected
            ? `linear-gradient(135deg, ${emotion.cardColor}, ${emotion.cardColorEnd})`
            : `linear-gradient(135deg, ${emotion.cardColor}22, ${emotion.cardColorEnd}22)`,
          borderColor: selected ? emotion.cardColor : 'rgba(255,255,255,0.12)',
          minWidth: 72,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-2xl leading-none">{emotion.emoji}</span>
        <span className="text-xs font-semibold truncate" style={{ color: selected ? '#fff' : 'rgba(255,255,255,0.7)' }}>
          {emotion.label}
        </span>
        {selected && (
          <motion.div
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs"
            style={{ background: emotion.cardColor }}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
          >
            ✓
          </motion.div>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onSelect}
      className="relative flex flex-col items-center gap-2 rounded-3xl p-4 border-2 text-center w-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{
        background: selected
          ? `linear-gradient(145deg, ${emotion.cardColor}, ${emotion.cardColorEnd})`
          : `linear-gradient(145deg, ${emotion.cardColor}18, ${emotion.cardColorEnd}18)`,
        borderColor: selected ? emotion.cardColor : 'rgba(255,255,255,0.1)',
        boxShadow: selected ? `0 0 20px ${emotion.cardColor}55` : 'none',
      }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      aria-pressed={selected}
      aria-label={`${emotion.label}: ${emotion.definition}`}
    >
      {selected && (
        <motion.div
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(255,255,255,0.9)', color: emotion.cardColorEnd }}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          ✓
        </motion.div>
      )}

      <span
        className="text-5xl leading-none"
        role="img"
        aria-hidden
        style={{ filter: selected ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' : 'none' }}
      >
        {emotion.emoji}
      </span>

      <span
        className="font-display font-bold text-lg leading-tight"
        style={{ color: selected ? '#fff' : 'rgba(255,255,255,0.85)' }}
      >
        {emotion.label}
      </span>
    </motion.button>
  );
}
