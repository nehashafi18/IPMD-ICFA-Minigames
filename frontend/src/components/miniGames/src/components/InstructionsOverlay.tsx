import { motion } from 'framer-motion';

type GameType = 'memory' | 'match3' | 'bubble';

interface Step { icon: string; text: string; }

const INSTRUCTIONS: Record<GameType, { title: string; emoji: string; steps: Step[] }> = {
  memory: {
    title: 'Memory Match',
    emoji: '🎴',
    steps: [
      { icon: '👁️', text: 'All cards start face down — you cannot see the icons' },
      { icon: '👆', text: 'Tap any card to flip it and reveal its icon' },
      { icon: '🧠', text: 'Tap a second card — remember what you saw!' },
      { icon: '✨', text: 'Matching pairs stay revealed; mismatches flip back' },
      { icon: '🎯', text: 'Find all pairs to complete the board' },
    ],
  },
  match3: {
    title: 'Art Match',
    emoji: '🎨',
    steps: [
      { icon: '🖱️', text: 'Click a tile to select it (it will glow)' },
      { icon: '↔️', text: 'Click an adjacent tile to swap the two' },
      { icon: '⌨️', text: 'Or use Arrow Keys to move cursor, then Enter / Space to swap' },
      { icon: '💥', text: 'Match 3+ identical tiles to clear them' },
      { icon: '⚡', text: 'Match 4 → Line Blast  •  Match 5 → Color Bomb  •  Match 6+ → Super Bomb' },
      { icon: '🔗', text: 'Cleared tiles fall down — chain combos for bigger scores' },
    ],
  },
  bubble: {
    title: 'Bubble Art',
    emoji: '🫧',
    steps: [
      { icon: '🎯', text: 'Move your mouse (or finger) to aim the cannon' },
      { icon: '🖱️', text: 'Click or tap to shoot a bubble upward' },
      { icon: '💥', text: 'Connect 3+ bubbles of the same art style to pop them' },
      { icon: '🔗', text: 'Large connected groups all pop together — chain reactions occur!' },
      { icon: '🌊', text: 'Bubbles left floating after a pop fall away automatically' },
      { icon: '🏆', text: 'Clear the entire board to win' },
    ],
  },
};

interface Props {
  game: GameType;
  onPlay: () => void;
}

export default function InstructionsOverlay({ game, onPlay }: Props) {
  const info = INSTRUCTIONS[game];

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(240, 234, 226, 0.90)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        className="glass rounded-3xl p-8 w-full max-w-sm flex flex-col gap-5"
        style={{ boxShadow: '0 8px 48px rgba(80,40,130,0.10)' }}
        initial={{ scale: 0.85, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Title */}
        <div className="text-center">
          <div className="text-4xl mb-2">{info.emoji}</div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: '#3A2060' }}>
            How to Play
          </h2>
          <p className="text-sm mt-0.5" style={{ color: '#7A6888' }}>{info.title}</p>
        </div>

        {/* Steps */}
        <ul className="flex flex-col gap-3">
          {info.steps.map((step, i) => (
            <motion.li
              key={i}
              className="flex items-start gap-3 text-sm"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i, type: 'spring', damping: 22 }}
            >
              <span className="text-base flex-shrink-0 w-6 text-center">{step.icon}</span>
              <span style={{ color: '#3A2A4A' }}>{step.text}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <motion.button
          onClick={onPlay}
          className="w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #9B6FD8, #7B4FC8)' }}
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Let's Play ✦
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
