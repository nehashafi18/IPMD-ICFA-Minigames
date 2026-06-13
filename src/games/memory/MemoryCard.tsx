import { useState } from 'react';
import { motion } from 'framer-motion';
import { type MemoryCard as CardData } from './memoryData';
import { getArtStyleById } from '../../systems/artStyles';
import { emojiUrl } from './twemoji';

interface Props {
  card: CardData;
  cardState: 'default' | 'correct' | 'wrong';
  onClick?: () => void;
  cols?: number;
}

function EmojiImg({ emoji, alt, size }: { emoji: string; alt: string; size: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span style={{ fontSize: size, lineHeight: 1 }} className="select-none">{emoji}</span>;
  }
  return (
    <img
      src={emojiUrl(emoji)}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

export default function MemoryCardTile({ card, cardState, onClick, cols = 4 }: Props) {
  const style = getArtStyleById(card.artStyleId);
  const unit = `70vw / ${cols}`;
  const imgSize = `calc(${unit} * 0.65)`;
  const pad = `calc(${unit} * 0.06)`;

  return (
    <motion.div
      className="relative w-full h-full no-select rounded-xl flex items-center justify-center"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: pad,
        background:
          cardState === 'wrong'
            ? 'rgba(220,60,60,0.12)'
            : cardState === 'correct'
            ? `${style.primary}30`
            : `${style.primary}18`,
        border:
          cardState === 'wrong'
            ? '2px solid rgba(220,60,60,0.55)'
            : cardState === 'correct'
            ? `2px solid ${style.primary}`
            : `1.5px solid ${style.primary}45`,
        boxShadow:
          cardState === 'wrong'
            ? '0 0 14px rgba(220,60,60,0.25)'
            : cardState === 'correct'
            ? `0 0 22px ${style.glow}`
            : '0 2px 8px rgba(0,0,0,0.06)',
      }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.06 } : undefined}
      whileTap={onClick ? { scale: 0.94 } : undefined}
      animate={cardState === 'correct' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <EmojiImg emoji={card.emoji} alt={card.name} size={imgSize} />
    </motion.div>
  );
}
