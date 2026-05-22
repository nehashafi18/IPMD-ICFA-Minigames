import { ART_STYLES } from '../../systems/artStyles';

export interface MemoryCard {
  id: number;
  pairId: string;
  artStyleId: string;
  emoji: string;
  name: string;
  description: string;
  flipped: boolean;
  matched: boolean;
}

const PAIRS = ART_STYLES.map((s) => ({
  pairId: s.id,
  artStyleId: s.id,
  emoji: s.emoji,
  name: s.name,
  description: s.description,
}));

export function buildDeck(pairCount = 8): MemoryCard[] {
  const selected = [...PAIRS].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const doubled = [...selected, ...selected];
  const shuffled = doubled.sort(() => Math.random() - 0.5);
  return shuffled.map((p, idx) => ({
    id: idx,
    ...p,
    flipped: false,
    matched: false,
  }));
}
