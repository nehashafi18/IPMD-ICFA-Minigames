import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import AmbientBackground from './AmbientBackground';
import { IS_EMBED, postMsg } from '../embed';

interface Props {
  title: string;
  emoji: string;
  score?: number;
  onBack: () => void;
  children: ReactNode;
  topRight?: ReactNode;
}

export default function GameShell({ title, emoji, score, onBack, children, topRight }: Props) {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const toggleSound = useAppStore((s) => s.toggleSound);

  return (
    <div className="min-h-dvh flex flex-col">
      <AmbientBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 glass border-b border-black/8 shadow-sm">
        {IS_EMBED ? (
          <button
            onClick={() => postMsg({ type: 'game:back' })}
            className="flex items-center gap-2 text-sm font-medium opacity-50 hover:opacity-90 transition-opacity no-select"
          >
            <span className="text-lg">✕</span>
          </button>
        ) : (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium opacity-50 hover:opacity-90 transition-opacity no-select"
          >
            <span className="text-lg">←</span>
            <span className="hidden sm:block">Games</span>
          </button>
        )}

        <h1 className="font-display text-lg font-semibold text-center" style={{ color: '#3A2060' }}>
          {emoji} {title}
        </h1>

        <div className="flex items-center gap-3">
          {score !== undefined && (
            <motion.div
              key={score}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.25 }}
              className="text-sm font-semibold"
              style={{ color: '#7B4FC8' }}
            >
              ✦ {score}
            </motion.div>
          )}
          {topRight}
          <button
            onClick={toggleSound}
            className="text-base opacity-50 hover:opacity-90 transition-opacity no-select"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? '🔊' : '🔇'}
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
