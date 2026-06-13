import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { sounds } from '../systems/audioSystem';

type SoundKey = keyof typeof sounds;

export function useSound() {
  const enabled = useAppStore((s) => s.soundEnabled);

  const play = useCallback(
    (key: SoundKey) => {
      if (enabled) sounds[key]();
    },
    [enabled],
  );

  return { play };
}
