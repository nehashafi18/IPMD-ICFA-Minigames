import { useState, useCallback } from 'react';

export interface BurstEvent {
  x: number;
  y: number;
  artStyleId: string;
  id: number;
}

let burstId = 0;

export function useParticleBurst() {
  const [bursts, setBursts] = useState<BurstEvent[]>([]);

  const burst = useCallback((x: number, y: number, artStyleId: string) => {
    const newBurst: BurstEvent = { x, y, artStyleId, id: ++burstId };
    setBursts((prev) => [...prev, newBurst]);
  }, []);

  const clearBursts = useCallback(() => setBursts([]), []);

  return { bursts, burst, clearBursts };
}
