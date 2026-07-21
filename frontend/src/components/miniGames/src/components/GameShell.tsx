import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import AmbientBackground from './AmbientBackground';
import SpeakerIcon from './SpeakerIcon';

interface Props {
  score?: number;
  onBack: () => void;
  children: ReactNode;
  topRight?: ReactNode;
}

export default function GameShell({ score, onBack, children, topRight }: Props) {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const toggleSound = useAppStore((s) => s.toggleSound);

  return (
    <div className="min-h-dvh flex flex-col">
      <AmbientBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 glass border-b border-white/10 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity no-select"
          style={{ color: '#FFFFFF' }}
        >
          <span className="text-lg">←</span>
          <span className="hidden sm:block">Games</span>
        </button>

        <div className="flex items-center gap-3">
          {score !== undefined && (
            <motion.div
              key={score}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.25 }}
              className="text-sm font-semibold"
              style={{ color: '#9FD8FF' }}
            >
              {score} pts
            </motion.div>
          )}
          {topRight}
          <button
            onClick={toggleSound}
            className="opacity-60 hover:opacity-100 transition-opacity no-select"
            style={{ color: '#FFFFFF' }}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            <SpeakerIcon muted={!soundEnabled} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-start p-4">
        {children}
      </main>
    </div>
  );
}
