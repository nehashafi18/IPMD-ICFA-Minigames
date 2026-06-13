import { motion } from 'framer-motion';
import { useAppStore, type GameId } from '../store/useAppStore';
import AmbientBackground from './AmbientBackground';

const GAMES = [
  {
    id: 'memory' as GameId,
    title: 'Symbol Search',
    emoji: '🔍',
    tagline: 'Remember a symbol, then find it among the cards',
    accent: '#9B6FD8',
  },
  {
    id: 'match3' as GameId,
    title: 'Art Match',
    emoji: '🎨',
    tagline: 'Swap tiles, chain combos, create art',
    accent: '#5BADD6',
  },
  {
    id: 'bubble' as GameId,
    title: 'Bubble Art',
    emoji: '🫧',
    tagline: 'Aim, shoot, watch bubbles bloom',
    accent: '#D6A83A',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20 } },
};

export default function HomeScreen() {
  const navigateTo = useAppStore((s) => s.navigateTo);
  const scores = useAppStore((s) => s.scores);
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const toggleSound = useAppStore((s) => s.toggleSound);

  return (
    <div className="min-h-dvh flex flex-col">
      <AmbientBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-end px-5 pt-6 pb-2">
        <button
          onClick={toggleSound}
          className="text-base opacity-40 hover:opacity-70 transition-opacity"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center px-5 pb-10">
        {/* Hero */}
        <motion.div
          className="text-center mt-4 mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <motion.div
            className="text-5xl mb-3"
            animate={{ rotate: [0, 4, -4, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎨
          </motion.div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2" style={{ color: '#3A2060' }}>
            Emotional Arts
          </h1>
          <p className="text-sm max-w-xs mx-auto" style={{ color: '#6B5880' }}>
            Three meditative mini games inspired by fine art and feeling
          </p>
        </motion.div>

        {/* Game Cards */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-sm"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {GAMES.map((game) => (
            <motion.button
              key={game.id}
              variants={cardVariants}
              onClick={() => navigateTo(game.id)}
              className="glass rounded-2xl p-5 text-left transition-all active:scale-[0.97] group border border-black/7 hover:border-black/15"
              whileHover={{ y: -2 }}
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${game.accent}18` }}
                >
                  {game.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-base" style={{ color: '#2A1F2E' }}>
                      {game.title}
                    </span>
                    {scores[game.id] > 0 && (
                      <span className="text-xs opacity-40">✦ {scores[game.id]}</span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: '#7A6888' }}>{game.tagline}</p>
                </div>
                <span className="opacity-25 group-hover:opacity-50 transition-opacity">→</span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <p className="mt-10 text-xs opacity-25 text-center">
          An emotional art therapy experience ✦
        </p>
      </main>
    </div>
  );
}
