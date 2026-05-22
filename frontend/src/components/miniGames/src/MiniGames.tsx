import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import HomeScreen from './components/HomeScreen';
import MemoryGame from './games/memory/MemoryGame';
import Match3Game from './games/match3/Match3Game';
import BubbleGame from './games/bubble/BubbleGame';
import './index.css'
import './minigame.css'

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeInOut' as const } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.25, ease: 'easeInOut' as const } },
};

export default function MiniGame() {
  const currentGame = useAppStore((s) => s.currentGame);
  const navigateTo = useAppStore((s) => s.navigateTo);

  return (
    <div className="minigame-root">
    <AnimatePresence mode="wait">
      {currentGame === 'home' && (
        <motion.div key="home" {...pageVariants} className="flex-1 flex flex-col">
          <HomeScreen />
        </motion.div>
      )}

      {currentGame === 'memory' && (
        <motion.div key="memory" {...pageVariants} className="flex-1 flex flex-col">
          <MemoryGame onBack={() => navigateTo('home')} />
        </motion.div>
      )}

      {currentGame === 'match3' && (
        <motion.div key="match3" {...pageVariants} className="flex-1 flex flex-col">
          <Match3Game onBack={() => navigateTo('home')} />
        </motion.div>
      )}

      {currentGame === 'bubble' && (
        <motion.div key="bubble" {...pageVariants} className="flex-1 flex flex-col">
          <BubbleGame onBack={() => navigateTo('home')} />
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
