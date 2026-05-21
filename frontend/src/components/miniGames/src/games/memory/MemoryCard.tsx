import { AnimatePresence, motion } from 'framer-motion';
import { type MemoryCard as CardData } from './memoryData';
import { getArtStyleById } from '../../systems/artStyles';

interface Props {
  card: CardData;
  onClick: () => void;
  disabled: boolean;
}

// Flip transition — back exits first, then front enters.
// The front face is NEVER in the DOM when visible === false.
const flipTransition = { duration: 0.18, ease: 'easeInOut' as const };

export default function MemoryCardTile({ card, onClick, disabled }: Props) {
  const style = getArtStyleById(card.artStyleId);
  const visible = card.flipped || card.matched;

  return (
    <div
      className="relative w-full h-full cursor-pointer no-select"
      style={{ minHeight: 0 }}
      onClick={disabled || card.matched ? undefined : onClick}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!visible ? (
          /* ── BACK face — only face rendered when not flipped ── */
          <motion.div
            key="back"
            className="absolute inset-0 rounded-2xl flex items-center justify-center border border-black/8"
            style={{
              background: 'rgba(255,255,255,0.60)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
            }}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={flipTransition}
          >
            <div
              className="w-7 h-7 rounded-full"
              style={{ background: '#9B6FD8', opacity: 0.18 }}
            />
          </motion.div>
        ) : (
          /* ── FRONT face — only rendered after flip; emoji never leaks ── */
          <motion.div
            key="front"
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-1 p-2"
            style={{
              background: `${style.primary}20`,
              border: `2px solid ${style.primary}50`,
              boxShadow: card.matched
                ? `0 0 16px ${style.glow}, 0 2px 10px rgba(0,0,0,0.06)`
                : '0 2px 10px rgba(0,0,0,0.06)',
            }}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{
              rotateY: 0,
              opacity: 1,
              scale: card.matched ? [1, 1.08, 1] : 1,
            }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={flipTransition}
          >
            <span className="text-3xl leading-none select-none">{card.emoji}</span>
            <span
              className="text-[10px] font-semibold text-center leading-tight select-none"
              style={{ color: '#3A2060', opacity: 0.72 }}
            >
              {card.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
