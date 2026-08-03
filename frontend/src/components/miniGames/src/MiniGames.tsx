import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect } from 'react';
import { useAppStore, type GameId } from './store/useAppStore';
import HomeScreen from './components/HomeScreen';
import TransitionScreen from './components/TransitionScreen';
import GameIntro from './components/GameIntro';
import MemoryGame from './games/memory/MemoryGame';
import Match3Game from './games/match3/Match3Game';
import BubbleGame from './games/bubble/BubbleGame';
import ArtDetectiveGame from './games/artDetective/ArtDetectiveGame';
import MemoryGalleryGame from './games/memoryGallery/MemoryGalleryGame';
import { bgMusic } from './systems/audioSystem';
import './index.css'
import './minigame.css'

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeInOut' as const } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.25, ease: 'easeInOut' as const } },
};

export default function MiniGame() {
  const currentGame  = useAppStore((s) => s.currentGame);
  const navigateTo   = useAppStore((s) => s.navigateTo);
  const soundEnabled = useAppStore((s) => s.soundEnabled);

  // Start/switch music on screen change.
  // useLayoutEffect fires synchronously before paint, keeping us closest to the
  // parent's click-gesture window so audio.play() succeeds without user interaction.
  useLayoutEffect(() => {
    if (!soundEnabled) {
      bgMusic.stop();
    } else if (currentGame === 'transition') {
      bgMusic.start('transition');
    } else if (currentGame === 'home') {
      bgMusic.start('home');
    } else if (currentGame === 'memory') {
      bgMusic.start('memory-match');
    } else if (currentGame === 'bubble') {
      bgMusic.start('cascade');
    } else if (currentGame === 'artDetective') {
      bgMusic.start('artDetective');
    } else if (currentGame === 'memoryGallery') {
      bgMusic.start('memoryGallery');
    } else {
      bgMusic.stop();
    }
  }, [soundEnabled, currentGame]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop only when the whole MiniGame component unmounts
  useEffect(() => () => { bgMusic.stop(); }, []);

  return (
    <div className="minigame-root" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
    <AnimatePresence mode="wait">
      {currentGame === 'transition' && (
        <motion.div key="transition" {...pageVariants} className="flex-1 flex flex-col">
          <TransitionScreen onDone={() => navigateTo('home')} />
        </motion.div>
      )}

      {currentGame === 'home' && (
        <motion.div key="home" {...pageVariants} className="flex-1 flex flex-col">
          <HomeScreen />
        </motion.div>
      )}

      {currentGame === 'memory-intro' && (
        <motion.div key="memory-intro" {...pageVariants} className="flex-1 flex flex-col">
          <GameIntro variant="memory" onDone={() => navigateTo('memory')} />
        </motion.div>
      )}

      {currentGame === 'match3-intro' && (
        <motion.div key="match3-intro" {...pageVariants} className="flex-1 flex flex-col">
          <GameIntro variant="match3" onDone={() => navigateTo('match3')} />
        </motion.div>
      )}

      {currentGame === 'bubble-intro' && (
        <motion.div key="bubble-intro" {...pageVariants} className="flex-1 flex flex-col">
          <GameIntro variant="bubble" onDone={() => navigateTo('bubble')} />
        </motion.div>
      )}

      {currentGame === 'artDetective-intro' && (
        <motion.div key="artDetective-intro" {...pageVariants} className="flex-1 flex flex-col">
          <GameIntro variant="artDetective" onDone={() => navigateTo('artDetective')} />
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

      {currentGame === 'artDetective' && (
        <motion.div key="artDetective" {...pageVariants} className="flex-1 flex flex-col relative overflow-hidden">
          <ArtDetectiveGame onBack={() => navigateTo('home')} />
        </motion.div>
      )}

      {currentGame === 'memoryGallery' && (
        <motion.div key="memoryGallery" {...pageVariants} className="flex-1 flex flex-col relative overflow-hidden">
          <MemoryGalleryGame onBack={() => navigateTo('home')} />
        </motion.div>
      )}

    </AnimatePresence>
    </div>
  );
}
