import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { buildDeck, type MemoryCard } from './memoryData';
import MemoryCardTile from './MemoryCard';
import GameShell from '../../components/GameShell';
import CompletionOverlay from '../../components/CompletionOverlay';
import InstructionsOverlay from '../../components/InstructionsOverlay';
import ParticleEngine from '../../systems/ParticleEngine';
import { useParticleBurst } from '../../hooks/useParticleBurst';
import { useSound } from '../../hooks/useSound';
import { useAppStore } from '../../store/useAppStore';

interface Props { onBack: () => void; }

const PAIR_COUNT = 8;
const FLIP_DELAY = 900;

export default function MemoryGame({ onBack }: Props) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [cards, setCards] = useState<MemoryCard[]>(() => buildDeck(PAIR_COUNT));
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [done, setDone] = useState(false);
  const { bursts, burst, clearBursts } = useParticleBurst();
  const { play } = useSound();
  const updateScore = useAppStore((s) => s.updateScore);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const score = Math.max(0, PAIR_COUNT * 100 - moves * 5);

  const reset = useCallback(() => {
    setCards(buildDeck(PAIR_COUNT));
    setSelected([]);
    setLocked(false);
    setMoves(0);
    setMatches(0);
    setDone(false);
  }, []);

  const flip = useCallback(
    (idx: number) => {
      if (locked || cards[idx].flipped || cards[idx].matched) return;
      play('flip');

      const newSelected = [...selected, idx];
      setCards((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, flipped: true } : c)),
      );

      if (newSelected.length === 1) {
        setSelected(newSelected);
        return;
      }

      // Two cards flipped — compare
      setSelected([]);
      setMoves((m) => m + 1);
      setLocked(true);

      const [a, b] = newSelected;
      const cardA = cards[a];
      const cardB = cards[b];

      if (cardA.pairId === cardB.pairId) {
        play('match');
        const newMatches = matches + 1;
        setMatches(newMatches);

        setCards((prev) =>
          prev.map((c, i) =>
            i === a || i === b ? { ...c, flipped: true, matched: true } : c,
          ),
        );

        const el = document.getElementById(`mem-card-${a}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          burst(rect.left + rect.width / 2, rect.top + rect.height / 2, cardA.artStyleId);
        }

        setLocked(false);

        if (newMatches === PAIR_COUNT) {
          setTimeout(() => {
            play('complete');
            updateScore('memory', score);
            setDone(true);
          }, 600);
        }
      } else {
        // Mismatch — flip both back after delay
        timerRef.current = setTimeout(() => {
          play('flip');
          setCards((prev) =>
            prev.map((c, i) =>
              i === a || i === b ? { ...c, flipped: false } : c,
            ),
          );
          setLocked(false);
        }, FLIP_DELAY);
      }
    },
    [locked, cards, selected, matches, burst, play, score, updateScore],
  );

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <>
      <ParticleEngine bursts={bursts} onBurstsConsumed={clearBursts} />

      <GameShell
        title="Memory Match"
        emoji="🎴"
        score={score}
        onBack={onBack}
        topRight={<span className="text-xs opacity-40">{moves} moves</span>}
      >
        <div className="w-full max-w-lg flex flex-col items-center gap-4 mt-4">

          {/* Pairs progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: PAIR_COUNT }, (_, i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: i < matches ? '#9B6FD8' : 'rgba(0,0,0,0.12)',
                }}
                animate={i < matches ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Card grid — 4 columns, cards at least 80px each */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
            {cards.map((card, idx) => (
              <div
                key={card.id}
                id={`mem-card-${idx}`}
                className="w-full"
                style={{ aspectRatio: '1', minHeight: 72 }}
              >
                <MemoryCardTile
                  card={card}
                  onClick={() => flip(idx)}
                  disabled={locked}
                />
              </div>
            ))}
          </div>

          <button
            onClick={reset}
            className="text-sm opacity-35 hover:opacity-60 transition-opacity mt-1"
          >
            ↺ Shuffle
          </button>
        </div>
      </GameShell>

      {showInstructions && (
        <InstructionsOverlay game="memory" onPlay={() => setShowInstructions(false)} />
      )}

      {done && (
        <CompletionOverlay
          title="Beautiful!"
          subtitle={`Matched all ${PAIR_COUNT} pairs in ${moves} moves`}
          score={score}
          onReplay={reset}
          onHome={onBack}
        />
      )}
    </>
  );
}
