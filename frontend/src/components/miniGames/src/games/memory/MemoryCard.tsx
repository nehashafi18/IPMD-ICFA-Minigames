import { AnimatePresence, motion } from 'framer-motion';
import { type MemoryCard as CardData } from './memoryData';
import { getArtStyleById } from '../../systems/artStyles';

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
  void cols;

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
                ? 'rgba(155,111,216,0.22)'
                : 'rgba(255,255,255,0.08)',
              border: highlight ? '2px solid #9B6FD8' : '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
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
                background: '#C9A8F0',
                opacity: 0.3,
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="front"
            className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center"
            style={{
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
            <img
              src={card.image}
              alt={card.name}
              draggable={false}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
