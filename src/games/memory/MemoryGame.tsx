import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { buildLevelDeck, LEVEL_CONFIGS, getMemoryItemById, type LevelConfig, type MemoryCard } from './memoryData';
import MemoryCardTile from './MemoryCard';
import GameShell from '../../components/GameShell';
import CompletionOverlay from '../../components/CompletionOverlay';
import MemoryInstructions from './MemoryInstructions';
import ParticleEngine from '../../systems/ParticleEngine';
import { useParticleBurst } from '../../hooks/useParticleBurst';
import { useSound } from '../../hooks/useSound';
import { useAppStore } from '../../store/useAppStore';
import { IS_EMBED, postMsg } from '../../embed';
import { emojiUrl } from './twemoji';

interface Props { onBack: () => void; }

// symbol  → show the target emoji (2 s)
// blank   → symbol gone, nothing shown, player holds it in memory (blankMs)
// search  → cards appear, player picks one
// feedback → right or wrong shown briefly, then advance
type Phase = 'symbol' | 'blank' | 'search' | 'feedback';

const TOTAL_LEVELS = LEVEL_CONFIGS.length;
const SYMBOL_MS = 2000;
const SUCCESS_PAUSE_MS = 1400;
const WRONG_PAUSE_MS = 2600;

export default function MemoryGame({ onBack }: Props) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [level, setLevel] = useState(1);
  const [roundInLevel, setRoundInLevel] = useState(0);
  const [roundCount, setRoundCount] = useState(LEVEL_CONFIGS[0].roundCount);

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [targetQueue, setTargetQueue] = useState<string[]>([]);

  const [phase, setPhase] = useState<Phase>('symbol');
  const [targetId, setTargetId] = useState('');
  const [targetEmoji, setTargetEmoji] = useState('');
  const [targetName, setTargetName] = useState('');

  // feedback state
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);

  const [done, setDone] = useState(false);

  const { bursts, burst, clearBursts } = useParticleBurst();
  const { play } = useSound();
  const updateScore = useAppStore((s) => s.updateScore);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // ── Start a single round: symbol → blank → search ─────────────────────────
  const startRound = useCallback((queue: string[], roundIdx: number, config: LevelConfig) => {
    clearTimer();

    const symbolId = queue[roundIdx];
    const item = getMemoryItemById(symbolId);
    setTargetId(symbolId);
    setTargetEmoji(item.emoji);
    setTargetName(item.name);

    setPickedIdx(null);
    setWasCorrect(null);
    setCorrectIdx(null);
    setPhase('symbol');

    // symbol → blank
    timerRef.current = setTimeout(() => {
      setPhase('blank');
      // blank → search
      timerRef.current = setTimeout(() => {
        setPhase('search');
      }, config.blankMs);
    }, SYMBOL_MS);
  }, [clearTimer]);

  // ── Build a new board and begin level ─────────────────────────────────────
  const startLevel = useCallback((lvl: number) => {
    const config = LEVEL_CONFIGS[lvl - 1];
    const { cards: deck, targetQueue: queue } = buildLevelDeck(lvl);

    setLevel(lvl);
    setCards(deck);
    setTargetQueue(queue);
    setRoundInLevel(0);
    setRoundCount(config.roundCount);

    startRound(queue, 0, config);
  }, [startRound]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleStartGame = useCallback(() => {
    setShowInstructions(false);
    startLevel(1);
  }, [startLevel]);

  // ── One pick per round ─────────────────────────────────────────────────────
  const handleClick = useCallback(
    (idx: number) => {
      if (phase !== 'search') return;

      const card = cards[idx];
      const correct = card.symbolId === targetId;
      const cIdx = cards.findIndex((c) => c.symbolId === targetId);

      setPickedIdx(idx);
      setWasCorrect(correct);
      setCorrectIdx(cIdx >= 0 ? cIdx : null);
      setPhase('feedback');

      if (correct) {
        play('match');
        const el = document.getElementById(`mem-${idx}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          burst(rect.left + rect.width / 2, rect.top + rect.height / 2, card.artStyleId);
        }
      } else {
        play('wrong');
      }

      const pause = correct ? SUCCESS_PAUSE_MS : WRONG_PAUSE_MS;
      timerRef.current = setTimeout(() => {
        const nextRound = roundInLevel + 1;
        if (nextRound < roundCount) {
          setRoundInLevel(nextRound);
          startRound(targetQueue, nextRound, LEVEL_CONFIGS[level - 1]);
        } else if (level < TOTAL_LEVELS) {
          startLevel(level + 1);
        } else {
          play('complete');
          updateScore('memory', TOTAL_LEVELS * 100);
          postMsg({ type: 'game:complete', game: 'memory', score: TOTAL_LEVELS * 100 });
          setDone(true);
        }
      }, pause);
    },
    [phase, cards, targetId, roundInLevel, roundCount, level, targetQueue,
     burst, play, updateScore, startRound, startLevel],
  );

  const reset = useCallback(() => {
    clearTimer();
    setDone(false);
    startLevel(1);
  }, [clearTimer, startLevel]);

  const config = LEVEL_CONFIGS[level - 1];
  const showCards = phase === 'search' || phase === 'feedback';

  const getCardState = (idx: number): 'default' | 'correct' | 'wrong' => {
    if (phase !== 'feedback') return 'default';
    if (idx === pickedIdx) return wasCorrect ? 'correct' : 'wrong';
    if (!wasCorrect && idx === correctIdx) return 'correct';
    return 'default';
  };

  return (
    <>
      <ParticleEngine bursts={bursts} onBurstsConsumed={clearBursts} />

      <GameShell title="Symbol Search" emoji="🔍" score={(level - 1) * 100} onBack={onBack}>
        <div className="flex flex-col items-center gap-4 mt-4" style={{ width: '70vw' }}>

          {/* ── Level progress ────────────────────────────────────────────────── */}
          <div className="w-full flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#9B6FD8,#C9A6F5)' }}
                  animate={{ width: `${((level - 1) / TOTAL_LEVELS) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs font-semibold select-none shrink-0" style={{ color: '#7B4FC8' }}>
                {level} / {TOTAL_LEVELS}
              </span>
            </div>
          </div>

          {/* ── Round dots ───────────────────────────────────────────────────── */}
          {!showInstructions && (
            <div className="flex items-center gap-2">
              {Array.from({ length: roundCount }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: 8, height: 8,
                    background:
                      i < roundInLevel ? '#9B6FD8'
                      : i === roundInLevel ? '#C9A6F5'
                      : 'rgba(0,0,0,0.10)',
                  }}
                />
              ))}
              <span className="text-xs ml-1 select-none" style={{ color: '#7A6888', opacity: 0.55 }}>
                Round {roundInLevel + 1} / {roundCount}
              </span>
            </div>
          )}

          {/* ── Banner ───────────────────────────────────────────────────────── */}
          <div style={{ minHeight: 110 }} className="w-full">
            <AnimatePresence mode="wait">

              {phase === 'symbol' && (
                <motion.div
                  key={`sym-${level}-${roundInLevel}`}
                  className="w-full flex flex-col items-center gap-2 px-5 py-4 rounded-2xl"
                  style={{
                    background: 'rgba(155,111,216,0.10)',
                    border: '2px solid rgba(155,111,216,0.22)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs font-medium uppercase tracking-widest select-none"
                     style={{ color: '#7A5DB8', opacity: 0.7 }}>
                    Remember this
                  </p>
                  <motion.img
                    src={emojiUrl(targetEmoji)}
                    alt={targetName}
                    draggable={false}
                    style={{ width: 96, height: 96, objectFit: 'contain' }}
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              )}

              {phase === 'blank' && (
                <motion.div
                  key={`blank-${level}-${roundInLevel}`}
                  className="w-full flex items-center justify-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="flex gap-2"
                    animate={{ opacity: [0.25, 0.6, 0.25] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: '#9B6FD8' }}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {phase === 'search' && (
                <motion.div
                  key={`search-${level}-${roundInLevel}`}
                  className="w-full flex items-center justify-center gap-3 px-5 py-5 rounded-2xl"
                  style={{
                    background: 'rgba(0,0,0,0.04)',
                    border: '1.5px solid rgba(0,0,0,0.08)',
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                >
                  <span className="text-2xl select-none">🔍</span>
                  <p className="text-base font-semibold select-none"
                     style={{ color: '#3A2060', opacity: 0.65 }}>
                    Which one was it? Tap a card.
                  </p>
                </motion.div>
              )}

              {phase === 'feedback' && wasCorrect && (
                <motion.div
                  key={`ok-${level}-${roundInLevel}`}
                  className="w-full flex items-center justify-center gap-3 px-5 py-5 rounded-2xl"
                  style={{
                    background: 'rgba(155,111,216,0.14)',
                    border: '2px solid rgba(155,111,216,0.35)',
                  }}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 16, stiffness: 200 }}
                >
                  <motion.span className="text-3xl select-none"
                    animate={{ rotate: [0, 14, -10, 0], scale: [1, 1.25, 1] }}
                    transition={{ duration: 0.5 }}>
                    ✨
                  </motion.span>
                  <p className="text-base font-bold select-none" style={{ color: '#6B40BC' }}>
                    That's right!
                  </p>
                </motion.div>
              )}

              {phase === 'feedback' && wasCorrect === false && (
                <motion.div
                  key={`no-${level}-${roundInLevel}`}
                  className="w-full flex flex-col gap-1.5 px-5 py-3 rounded-2xl"
                  style={{
                    background: 'rgba(220,60,60,0.07)',
                    border: '1.5px solid rgba(220,60,60,0.25)',
                  }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl select-none">❌</span>
                    {pickedIdx !== null && cards[pickedIdx] && (
                      <img src={emojiUrl(cards[pickedIdx].emoji)} alt={cards[pickedIdx].name}
                        draggable={false} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    )}
                    <span className="text-xl select-none">→</span>
                    <span className="text-xl select-none">✅</span>
                    <img src={emojiUrl(targetEmoji)} alt={targetName}
                      draggable={false} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── Card grid (only visible during search + feedback) ─────────────── */}
          <AnimatePresence>
            {showCards && (
              <motion.div
                key="grid"
                className="w-full"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                  gap: config.cols <= 4 ? 12 : config.cols <= 6 ? 8 : config.cols <= 10 ? 5 : 3,
                }}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
              >
                {cards.map((card, idx) => (
                  <div key={card.id} id={`mem-${idx}`} style={{ aspectRatio: '1' }}>
                    <MemoryCardTile
                      card={card}
                      cardState={getCardState(idx)}
                      cols={config.cols}
                      onClick={phase === 'search' ? () => handleClick(idx) : undefined}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={reset}
            className="text-sm opacity-40 hover:opacity-65 transition-opacity mt-2"
          >
            ↺ New game
          </button>
        </div>
      </GameShell>

      {showInstructions && (
        <MemoryInstructions onPlay={handleStartGame} />
      )}

      {done && (
        <CompletionOverlay
          title="All levels cleared!"
          subtitle={`You found every symbol across all ${TOTAL_LEVELS} levels!`}
          score={TOTAL_LEVELS * 100}
          onReplay={reset}
          onHome={IS_EMBED ? () => postMsg({ type: 'game:back' }) : onBack}
        />
      )}
    </>
  );
}
