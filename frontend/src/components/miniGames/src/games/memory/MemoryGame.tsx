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
import { ART_STYLE_IMAGES } from '../../systems/gameArt';

interface Props { onBack: () => void; }

type Phase = 'reveal' | 'preview' | 'finding' | 'correct' | 'wrong' | 'levelDone' | 'complete';

const TOTAL_LEVELS = LEVEL_CONFIGS.length;
const REVEAL_MS = 1400;

function SceneImg({ image, size }: { image: string; size: number }) {
  return (
    <img
      src={image}
      alt=""
      draggable={false}
      className="rounded-lg object-cover"
      style={{ width: size, height: size }}
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
    setPhase('reveal');
    setLevel(lvl);
    setRound(rnd);

    // Big solo reveal of the target picture first, then the card grid appears
    // (still flipped face-up) before flipping face-down to start the find phase.
    timerRef.current = setTimeout(() => {
      setPhase('preview');
      const blankMs = LEVEL_CONFIGS[lvl].blankMs;
      timerRef.current = setTimeout(() => {
        setCards((prev) => prev.map((c) => ({ ...c, flipped: false })));
        setPhase('finding');
      }, blankMs);
    }, REVEAL_MS);
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
  const rows = cfg.cardCount / cfg.cols;
  const gridWidth = `min(94vw, calc((100dvh - 260px) * ${cfg.cols} / ${rows}))`;

  return (
    <>
      <ParticleEngine bursts={bursts} onBurstsConsumed={clearBursts} />

      <GameShell score={totalScore} onBack={onBack}>
        {/* Level progress bar */}
        <div
          className="flex items-center gap-3 mb-3"
          style={{ width: '94vw', maxWidth: '100%' }}
        >
          <span className="font-semibold" style={{ color: '#9FD8FF', whiteSpace: 'nowrap', fontSize: 15 }}>
            Level {level + 1}/{TOTAL_LEVELS}
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
                      : 'rgba(255,255,255,0.12)',
                  transition: 'background 0.4s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Big solo reveal of the target picture, before the card grid appears at all */}
        {phase === 'reveal' && targetCard && (
          <motion.div
            className="flex-1 flex flex-col items-center justify-center gap-4 w-full"
            style={{ minHeight: 0 }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-3xl overflow-hidden" style={{ width: 'min(65vw, 340px)', height: 'min(65vw, 340px)', boxShadow: '0 12px 50px rgba(80,40,130,0.25)' }}>
              <img src={targetCard.image} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold" style={{ color: '#FFFFFF', fontSize: 22 }}>Remember this</span>
          </motion.div>
        )}

        {/* Target banner */}
        <AnimatePresence mode="wait">
          {targetCard && (phase === 'preview' || phase === 'finding') && (
            <motion.div
              key={`target-${level}-${round}`}
              className="flex items-center gap-4 rounded-2xl px-4 py-3 mb-3"
              style={{
                background: 'rgba(155,111,216,0.14)',
                border: '1.5px solid rgba(155,111,216,0.3)',
                width: '94vw',
                maxWidth: '100%',
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <SceneImg image={targetCard.image} size={120} />
              <span className="font-semibold" style={{ color: '#FFFFFF', fontSize: 22 }}>
                {phase === 'preview' ? 'Remember this' : 'Find it!'}
              </span>
            </motion.div>
          )}

          {phase === 'correct' && targetCard && (
            <motion.div
              key="feedback-correct"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 mb-3"
              style={{
                background: 'rgba(80,200,120,0.14)',
                border: '1.5px solid rgba(80,200,120,0.35)',
                width: '94vw',
                maxWidth: '100%',
              }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <SceneImg image={targetCard.image} size={120} />
              <span className="text-3xl" style={{ color: '#FFFFFF' }}>✓</span>
            </motion.div>
          )}

          {phase === 'wrong' && targetCard && pickedIdx !== null && cards[pickedIdx] && (
            <motion.div
              key="feedback-wrong"
              className="flex items-center gap-4 rounded-2xl px-4 py-3 mb-3"
              style={{
                background: 'rgba(230,80,80,0.12)',
                border: '1.5px solid rgba(230,80,80,0.3)',
                width: '94vw',
                maxWidth: '100%',
              }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <SceneImg image={cards[pickedIdx].image} size={110} />
              <span className="text-2xl" style={{ color: '#9FD8FF' }}>→</span>
              <SceneImg image={targetCard.image} size={120} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card grid — sized to always fit without scrolling */}
        {phase !== 'reveal' && (
          <div className="flex-1 flex items-center justify-center w-full" style={{ minHeight: 0 }}>
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${cfg.cols},1fr)`, gap, width: gridWidth }}
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
        )}
      </GameShell>

      {showInstructions && <MemoryInstructions onPlay={handleStartGame} />}

      {phase === 'levelDone' && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ background: 'rgba(5,8,15,0.82)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            className="glass flex flex-col items-center gap-6 rounded-3xl p-10 text-center"
            style={{
              boxShadow: '0 12px 60px rgba(0,0,0,0.4)',
              maxWidth: 380,
            }}
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <SceneImg image={ART_STYLE_IMAGES['sparkles']} size={80} />
            <h2 className="font-semibold text-2xl" style={{ color: '#FFFFFF' }}>
              Level {level + 1} done!
            </h2>
            <p className="text-sm" style={{ color: '#9FD8FF' }}>
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
