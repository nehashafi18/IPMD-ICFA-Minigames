import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GameId =
  | 'transition'
  | 'home'
  | 'memory-intro'
  | 'match3-intro'
  | 'bubble-intro'
  | 'artDetective-intro'
  | 'memory'
  | 'match3'
  | 'bubble'
  | 'artDetective'
  | 'memoryGallery';

export type PlayableGameId = 'memory' | 'match3' | 'bubble' | 'artDetective' | 'memoryGallery';

interface AppState {
  currentGame: GameId;
  activeTheme: string;
  soundEnabled: boolean;
  reducedMotion: boolean;
  scores: Record<PlayableGameId, number>;
  // Actions
  navigateTo: (game: GameId) => void;
  setTheme: (themeId: string) => void;
  toggleSound: () => void;
  toggleReducedMotion: () => void;
  updateScore: (game: PlayableGameId, score: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentGame: 'transition',
      activeTheme: 'soft-pastel',
      soundEnabled: true,
      reducedMotion: false,
      scores: { memory: 0, match3: 0, bubble: 0, artDetective: 0, memoryGallery: 0 },

      navigateTo: (game) => set({ currentGame: game }),

      setTheme: (themeId) => set({ activeTheme: themeId }),

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),

      updateScore: (game, score) =>
        set((s) => ({
          scores: {
            ...s.scores,
            [game]: Math.max(s.scores[game] ?? 0, score),
          },
        })),
    }),
    {
      name: 'emotional-arts-prefs',
      partialize: (s) => ({
        activeTheme: s.activeTheme,
        soundEnabled: s.soundEnabled,
        reducedMotion: s.reducedMotion,
        scores: s.scores,
      }),
    },
  ),
);
