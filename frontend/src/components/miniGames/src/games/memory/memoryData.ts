import { ART_STYLES } from '../../systems/artStyles';
import { MEMORY_SCENES } from '../../systems/gameArt';

export interface MemoryCard {
  id: number;
  symbolId: string;
  artStyleId: string;
  image: string;
  name: string;
  flipped: boolean;
  matched: boolean;
}

export const MEMORY_POOL = MEMORY_SCENES;

export interface LevelConfig {
  cardCount: number;
  roundCount: number;
  cols: number;
  blankMs: number;
}

// Row count is held constant across levels — higher levels add more COLUMNS
// (cards spread further sideways) rather than shrinking every card to squeeze
// in more rows, so card size stays consistent and the grid keeps using the
// full screen width instead of leaving empty space on each side.
export const LEVEL_CONFIGS: LevelConfig[] = [
  { cardCount: 6,  roundCount: 3, cols: 3, blankMs: 7000 },
  { cardCount: 9,  roundCount: 3, cols: 3, blankMs: 6000 },
  { cardCount: 12, roundCount: 4, cols: 4, blankMs: 5000 },
  { cardCount: 16, roundCount: 4, cols: 4, blankMs: 4000 },
  { cardCount: 20, roundCount: 5, cols: 5, blankMs: 3000 },
];

export function buildLevelDeck(level: number): MemoryCard[] {
  const config = LEVEL_CONFIGS[Math.min(level, LEVEL_CONFIGS.length - 1)];
  const cardCount = Math.min(config.cardCount, MEMORY_POOL.length);
  const pool = [...MEMORY_POOL].sort(() => Math.random() - 0.5).slice(0, cardCount);
  return pool.map((item, idx) => ({
    id: idx,
    symbolId: item.id,
    artStyleId: ART_STYLES[idx % ART_STYLES.length].id,
    image: item.image,
    name: item.name,
    flipped: false,
    matched: false,
  }));
}

export function getMemoryItemById(symbolId: string, cards: MemoryCard[]): MemoryCard | undefined {
  return cards.find((c) => c.symbolId === symbolId);
}
