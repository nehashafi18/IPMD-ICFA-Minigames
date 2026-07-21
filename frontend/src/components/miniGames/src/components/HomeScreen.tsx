import { motion } from 'framer-motion';
import { useAppStore, type GameId } from '../store/useAppStore';
import AmbientBackground from './AmbientBackground';
import SpeakerIcon from './SpeakerIcon';
import { ART_STYLE_IMAGES } from '../systems/gameArt';

const GAMES = [
  {
    id:    'memory'           as GameId,
    intro: 'memory-intro'    as GameId,
    title: 'Memory Match',
    desc:  'Uncover hidden pairs from memory — one flip at a time',
    image: ART_STYLE_IMAGES['soft-pastel'],
  },
  {
    id:    'bubble'           as GameId,
    intro: 'bubble-intro'    as GameId,
    title: 'Cascade',
    desc:  'Keep the board clear before the cascade overtakes you',
    image: ART_STYLE_IMAGES['cloud-softness'],
  },
  {
    id:    'artDetective'     as GameId,
    intro: 'artDetective'    as GameId,
    title: 'Canvas Quest',
    desc:  'Search painted scenes for hidden objects before time runs out',
    image: ART_STYLE_IMAGES['soft-pastel'],
    accent: 'linear-gradient(90deg, rgba(200,168,76,0.7) 0%, rgba(139,105,20,0.4) 55%, rgba(200,168,76,0.05) 100%)',
  },
  {
    id:    'memoryGallery'    as GameId,
    intro: 'memoryGallery'   as GameId,
    title: 'Memory Manor',
    desc:  'Watch objects glow in sequence, then recall them in perfect order',
    image: ART_STYLE_IMAGES['oil-paint'],
    accent: 'linear-gradient(90deg, rgba(155,114,232,0.7) 0%, rgba(80,50,150,0.4) 55%, rgba(155,114,232,0.05) 100%)',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 22 } },
};

export default function HomeScreen() {
  const navigateTo   = useAppStore((s) => s.navigateTo);
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const toggleSound  = useAppStore((s) => s.toggleSound);

  return (
    <div className="min-h-dvh h-dvh flex flex-col">
      <AmbientBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-end px-6 pt-5 pb-2 flex-shrink-0">
        <button
          onClick={toggleSound}
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          style={{ color: '#FFFFFF' }}
        >
          <SpeakerIcon muted={!soundEnabled} className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center px-3 pb-6" style={{ minHeight: 0 }}>
        {/* Heading */}
        <motion.div
          className="text-center mt-1 mb-5 flex-shrink-0 w-full"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2 text-glow" style={{ color: '#FFFFFF' }}>
            Choose an Experience
          </h1>
          <p className="text-base sm:text-lg w-full px-2" style={{ color: '#FFFFFF' }}>
            Three games to enjoy while your artwork comes together
          </p>
        </motion.div>

        {/* Game Cards — single column */}
        <motion.div
          className="flex flex-col gap-3 flex-1 w-full"
          style={{ minHeight: 0 }}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {GAMES.map((game) => (
            <motion.button
              key={game.id}
              variants={cardVariants}
              onClick={() => navigateTo(game.intro)}
              className="relative w-full rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97] group border border-white/10 hover:border-white/25 flex-1"
              whileHover={{ y: -2 }}
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minHeight: 0 }}
            >
              {/* Background image */}
              <img
                src={game.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: game.accent
                    ?? 'linear-gradient(180deg, rgba(3,5,10,0.35) 0%, rgba(3,5,10,0.82) 100%)',
                }}
              />
              {/* Content */}
              <div className="relative h-full flex flex-col justify-end px-4 py-5 gap-2">
                <span className="font-display font-semibold text-2xl sm:text-3xl block leading-tight" style={{ color: '#FFFFFF' }}>
                  {game.title}
                </span>
                <span className="text-base sm:text-lg block leading-snug" style={{ color: '#FFFFFF' }}>
                  {game.desc}
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
