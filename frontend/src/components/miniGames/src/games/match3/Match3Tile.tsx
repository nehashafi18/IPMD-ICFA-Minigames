import React from 'react';
import { motion } from 'framer-motion';
import { getTileType, tilePower } from './match3Data';
import { POWER_UP_IMAGES, type PowerUpId } from '../../systems/gameArt';

interface Props {
  tileId: string;
  row: number;
  col: number;
  selected: boolean;
  highlighted: boolean;
  isCursor: boolean;
  isHinted: boolean;
  onClick: () => void;
}

function Match3Tile({ tileId, selected, highlighted, isCursor, isHinted, onClick }: Props) {
  const tile = getTileType(tileId);
  const power = tilePower(tileId);

  return (
    <motion.button
      layout
      tabIndex={-1}
      onClick={onClick}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      whileTap={{ scale: 0.86 }}
      className="relative w-full h-full rounded-xl flex items-center justify-center no-select overflow-hidden"
      style={{
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        background: power ? `${tile.primary}33` : `${tile.primary}22`,
        border: selected
          ? `2px solid ${tile.primary}`
          : isCursor
          ? `2px dashed ${tile.primary}99`
          : isHinted
          ? `2px solid ${tile.primary}cc`
          : highlighted
          ? `1px solid ${tile.primary}66`
          : power
          ? `1.5px solid ${tile.primary}88`
          : '1px solid rgba(0,0,0,0.08)',
        boxShadow: selected
          ? `0 0 14px ${tile.glow}, inset 0 0 6px ${tile.glow}`
          : isHinted
          ? `0 0 16px ${tile.glow}, 0 0 6px ${tile.primary}66`
          : power
          ? `0 0 10px ${tile.glow}`
          : isCursor
          ? `0 0 0 2px ${tile.primary}44`
          : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.12s, border 0.12s',
      }}
      animate={
        selected
          ? { scale: 1.1 }
          : isHinted
          ? { scale: [1, 1.08, 1] }
          : { scale: 1 }
      }
      transition={
        isHinted
          ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' as const }
          : { type: 'spring' as const, stiffness: 380, damping: 22 }
      }
    >
      <img
        src={power ? POWER_UP_IMAGES[power as PowerUpId] : tile.image}
        alt={power ? `${power} power-up` : tile.name}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
    </motion.button>
  );
}

export default React.memo(Match3Tile, (prev, next) =>
  prev.tileId === next.tileId &&
  prev.selected === next.selected &&
  prev.highlighted === next.highlighted &&
  prev.isCursor === next.isCursor &&
  prev.isHinted === next.isHinted,
);
