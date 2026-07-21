import { useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CheckInPhase from './phases/CheckInPhase';
import ScenePhase from './phases/ScenePhase';
import ReflectionPhase from './phases/ReflectionPhase';
import { EMOTION_MAP } from './emotionCanvasData';
import type { EmotionAdapter } from './systems/emotionAdapter';

interface Props { onBack: () => void; }

type Phase = 'checkin' | 'scene' | 'reflection';

export default function EmotionCanvasGame({ onBack }: Props) {
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  const [phase, setPhase]       = useState<Phase>('checkin');
  const [preEmotions, setPreEmotions] = useState<string[]>([]);
  const [adapterRef, setAdapterRef]   = useState<EmotionAdapter | null>(null);

  const handleCheckInDone = useCallback((emotions: string[]) => {
    setPreEmotions(emotions);
    setPhase('scene');
  }, []);

  const handleSceneDone = useCallback((adapter: EmotionAdapter) => {
    setAdapterRef(adapter);
    setPhase('reflection');
  }, []);

  const primaryEmotion = EMOTION_MAP[preEmotions[0] ?? ''] ?? EMOTION_MAP['calm'];

  return (
    <>
      {phase === 'checkin' && (
        <CheckInPhase
          onComplete={handleCheckInDone}
          onBack={onBack}
          reducedMotion={reducedMotion}
        />
      )}
      {phase === 'scene' && primaryEmotion && (
        <ScenePhase
          primaryEmotion={primaryEmotion}
          onDone={handleSceneDone}
          onBack={onBack}
          reducedMotion={reducedMotion}
        />
      )}
      {phase === 'reflection' && adapterRef && (
        <ReflectionPhase
          preEmotions={preEmotions}
          adapter={adapterRef}
          onDone={onBack}
          onBack={onBack}
          reducedMotion={reducedMotion}
        />
      )}
    </>
  );
}
