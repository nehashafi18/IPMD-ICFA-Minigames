import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type MemoryCard as CardData } from './memoryData';
import { getArtStyleById } from '../../systems/artStyles';
import { emojiUrl } from './twemoji';

function EmojiImg({ emoji, alt, size }: { emoji: string; alt: string; size: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>;
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

interface Props {
  card: CardData;
  onClick: () => void;
  disabled: boolean;
  cols?: number;
  highlight?: boolean;
}

const flipTransition = { duration: 0.15, ease: 'easeInOut' as const };

export default function MemoryCardTile({ card, onClick, disabled, cols = 5, highlight = false }: Props) {
  const style = getArtStyleById(card.artStyleId);
  const visible = card.flipped || card.matched;
  const imgSize = `calc(70vw / ${cols} * 0.62)`;

  return (
    <div
      className="relative w-full h-full cursor-pointer no-select"
      style={{ minHeight: 0 }}
      onClick={disabled || card.matched ? undefined : onClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!visible ? (
          <motion.div
            key="back"
            className="absolute inset-0 rounded-lg flex items-center justify-center"
            style={{
              background: highlight
                ? 'rgba(155,111,216,0.18)'
                : 'rgba(255,255,255,0.55)',
              border: highlight ? '2px solid #9B6FD8' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            }}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={flipTransition}
          >
            <div
              className="rounded-full"
              style={{
                width: `calc(70vw / ${cols} * 0.18)`,
                height: `calc(70vw / ${cols} * 0.18)`,
                background: '#9B6FD8',
                opacity: 0.15,
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="front"
            className="absolute inset-0 rounded-lg flex items-center justify-center"
            style={{
              background: `${style.primary}22`,
              border: `2px solid ${style.primary}60`,
              boxShadow: card.matched
                ? `0 0 12px ${style.glow}, 0 1px 6px rgba(0,0,0,0.06)`
                : '0 1px 6px rgba(0,0,0,0.06)',
            }}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1, scale: card.matched ? [1, 1.1, 1] : 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={flipTransition}
          >
            <EmojiImg emoji={card.emoji} alt={card.name} size={imgSize} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
