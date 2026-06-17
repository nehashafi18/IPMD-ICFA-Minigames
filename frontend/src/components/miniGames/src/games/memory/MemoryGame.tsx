import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildLevelDeck, type MemoryCard, LEVEL_CONFIGS } from './memoryData';
import MemoryCardTile from './MemoryCard';
import MemoryInstructions from './MemoryInstructions';
import GameShell from '../../components/GameShell';
import CompletionOverlay from '../../components/CompletionOverlay';
import ParticleEngine from '../../systems/ParticleEngine';
import { useParticleBurst } from '../../hooks/useParticleBurst';
import { useSound } from '../../hooks/useSound';
import { useAppStore } from '../../store/useAppStore';
import { emojiUrl } from './twemoji';

interface Props { onBack: () => void; }

type Phase = 'preview' | 'finding' | 'correct' | 'wrong' | 'levelDone' | 'complete';

const TOTAL_LEVELS = LEVEL_CONFIGS.length;

function EmojiImg({ emoji, size }: { emoji: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span style={{ fontSize: size }}>{emoji}</span>;
  return (
    <img
      src={emojiUrl(emoji)}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

export default function MemoryGame({ onBack }: Props) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [level, setLevel] = useState(0);
  const [round, setRound] = useState(0);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('preview');
  const [totalScore, setTotalScore] = useState(0);
  const { bursts, burst, clearBursts } = useParticleBurst();
  const { play } = useSound();
  const updateScore = useAppStore((s) => s.updateScore);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cfg = LEVEL_CONFIGS[level] ?? LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1];

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const startRound = useCallback((lvl: number, rnd: number) => {
    clearTimer();
    const deck = buildLevelDeck(lvl);
    const newTarget = Math.floor(Math.random() * deck.length);
    const shown = deck.map((c) => ({ ...c, flipped: true, matched: false }));
    setCards(shown);
    setTargetIdx(newTarget);
    setPickedIdx(null);
    setPhase('preview');
    setLevel(lvl);
    setRound(rnd);

    const blankMs = LEVEL_CONFIGS[lvl].blankMs;
    timerRef.current = setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, flipped: false })));
      setPhase('finding');
    }, blankMs);
  }, [clearTimer]);

  const handleStartGame = useCallback(() => {
    setShowInstructions(false);
    startRound(0, 0);
  }, [startRound]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleCardClick = useCallback((idx: number) => {
    if (phase !== 'finding') return;
    clearTimer();
    setPickedIdx(idx);

    const isCorrect = idx === targetIdx;
    if (isCorrect) {
      play('match');
      setPhase('correct');
      const el = document.getElementById(`mem-card-${idx}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        burst(rect.left + rect.width / 2, rect.top + rect.height / 2, cards[idx].artStyleId);
      }
      setCards((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, flipped: true, matched: true } : c)),
      );
      timerRef.current = setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= cfg.roundCount) {
          const nextLevel = level + 1;
          if (nextLevel >= TOTAL_LEVELS) {
            play('complete');
            setTotalScore((s) => {
              const final = s + 500;
              updateScore('memory', final);
              return final;
            });
            setPhase('complete');
          } else {
            play('complete');
            setTotalScore((s) => s + 200);
            setPhase('levelDone');
          }
        } else {
          startRound(level, nextRound);
        }
      }, 1200);
    } else {
      play('flip');
      setPhase('wrong');
      setCards((prev) =>
        prev.map((c, i) =>
          i === idx || i === targetIdx ? { ...c, flipped: true } : c,
        ),
      );
      timerRef.current = setTimeout(() => {
        const nextRound = round + 1 < cfg.roundCount ? round + 1 : round;
        startRound(level, nextRound);
      }, 2000);
    }
  }, [phase, targetIdx, round, level, cfg, cards, burst, play, updateScore, startRound, clearTimer]);

  const handleNextLevel = useCallback(() => {
    startRound(level + 1, 0);
  }, [level, startRound]);

  const gap = cfg.cols <= 4 ? 12 : cfg.cols <= 6 ? 8 : cfg.cols <= 10 ? 5 : 3;
  const targetCard = cards[targetIdx];

  return (
    <>
      <ParticleEngine bursts={bursts} onBurstsConsumed={clearBursts} />

      <GameShell title="Memory Find" emoji="🎴" onBack={onBack}>
        {/* Level progress bar */}
        <div
          className="flex items-center gap-2 mb-3"
          style={{ width: '70vw', maxWidth: '100%' }}
        >
          <span className="text-xs font-semibold" style={{ color: '#9B6FD8', whiteSpace: 'nowrap' }}>
            Lv {level + 1}/{TOTAL_LEVELS}
          </span>
          <div className="flex gap-1 flex-1">
            {Array.from({ length: cfg.roundCount }, (_, i) => (
              <div
                key={i}
                className="flex-1 h-2 rounded-full"
                style={{
                  background:
                    i < round
                      ? '#9B6FD8'
                      : phase === 'correct' && i === round
                      ? '#B06ED8'
                      : 'rgba(0,0,0,0.1)',
                  transition: 'background 0.4s',
                }}
              />
            ))}
          </div>
          <span className="text-xs opacity-40">{totalScore}pts</span>
        </div>

        {/* Target banner */}
        <AnimatePresence mode="wait">
          {targetCard && (phase === 'preview' || phase === 'finding') && (
            <motion.div
              key={`target-${level}-${round}`}
              className="flex items-center gap-3 rounded-2xl px-5 py-3 mb-4"
              style={{
                background: 'rgba(155,111,216,0.10)',
                border: '1.5px solid rgba(155,111,216,0.22)',
                width: '70vw',
                maxWidth: '100%',
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <EmojiImg emoji={targetCard.emoji} size={44} />
              <span className="text-sm font-semibold" style={{ color: '#5A3080' }}>
                {phase === 'preview' ? 'Remember this' : 'Find it!'}
              </span>
            </motion.div>
          )}

          {phase === 'correct' && targetCard && (
            <motion.div
              key="feedback-correct"
              className="flex items-center gap-3 rounded-2xl px-5 py-3 mb-4"
              style={{
                background: 'rgba(80,180,80,0.10)',
                border: '1.5px solid rgba(80,180,80,0.28)',
                width: '70vw',
                maxWidth: '100%',
              }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmojiImg emoji={targetCard.emoji} size={40} />
              <span className="text-2xl">✓</span>
            </motion.div>
          )}

          {phase === 'wrong' && targetCard && pickedIdx !== null && cards[pickedIdx] && (
            <motion.div
              key="feedback-wrong"
              className="flex items-center gap-3 rounded-2xl px-5 py-3 mb-4"
              style={{
                background: 'rgba(220,60,60,0.08)',
                border: '1.5px solid rgba(220,60,60,0.22)',
                width: '70vw',
                maxWidth: '100%',
              }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmojiImg emoji={cards[pickedIdx].emoji} size={32} />
              <span className="text-lg opacity-40">→</span>
              <EmojiImg emoji={targetCard.emoji} size={36} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card grid */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(100dvh - 240px)', width: '70vw', maxWidth: '100%' }}
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${cfg.cols},1fr)`, gap }}
          >
            {cards.map((card, idx) => (
              <div key={card.id} id={`mem-card-${idx}`} style={{ aspectRatio: '1' }}>
                <MemoryCardTile
                  card={card}
                  onClick={() => handleCardClick(idx)}
                  disabled={phase !== 'finding'}
                  cols={cfg.cols}
                />
              </div>
            ))}
          </div>
        </div>
      </GameShell>

      {showInstructions && <MemoryInstructions onPlay={handleStartGame} />}

      {phase === 'levelDone' && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ background: 'rgba(240,234,226,0.88)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            className="flex flex-col items-center gap-6 rounded-3xl p-10 text-center"
            style={{
              background: 'rgba(255,255,255,0.85)',
              boxShadow: '0 12px 60px rgba(80,40,130,0.12)',
              maxWidth: 380,
            }}
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="text-5xl">🎉</div>
            <h2 className="font-semibold text-2xl" style={{ color: '#3A2060' }}>
              Level {level + 1} done!
            </h2>
            <p className="text-sm" style={{ color: '#7A6888' }}>
              Level {level + 2} — {LEVEL_CONFIGS[level + 1]?.cardCount} cards
            </p>
            <motion.button
              onClick={handleNextLevel}
              className="px-10 py-3.5 rounded-xl font-semibold text-white text-base"
              style={{ background: 'linear-gradient(135deg,#9B6FD8,#7B4FC8)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Next Level →
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {phase === 'complete' && (
        <CompletionOverlay
          title="Amazing Memory!"
          subtitle={`All ${TOTAL_LEVELS} levels complete!`}
          score={totalScore}
          onReplay={() => {
            setTotalScore(0);
            setPhase('preview');
            setCards([]);
            setShowInstructions(true);
          }}
          onHome={onBack}
        />
      )}
    </>
  );
}
