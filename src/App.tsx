import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import HomeScreen from './components/HomeScreen';
import MemoryGame from './games/memory/MemoryGame';
import Match3Game from './games/match3/Match3Game';
import BubbleGame from './games/bubble/BubbleGame';
import { EMBED_GAME, postMsg } from './embed';

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeInOut' as const } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.25, ease: 'easeInOut' as const } },
};

export default function App() {
  const currentGame = useAppStore((s) => s.currentGame);
  const navigateTo = useAppStore((s) => s.navigateTo);

  // Jump straight into the requested game when loaded inside an iframe.
  useEffect(() => {
    if (EMBED_GAME) navigateTo(EMBED_GAME);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Let the parent know the app is ready.
  useEffect(() => {
    postMsg({ type: 'game:ready', game: currentGame });
  }, [currentGame]);

  return (
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
  );
}
