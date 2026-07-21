import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../../components/GameShell';
import CompletionOverlay from '../../components/CompletionOverlay';
import MemoryGalleryInstructions from './MemoryGalleryInstructions';
import { useAppStore } from '../../store/useAppStore';

interface Props { onBack: () => void; }

// ── Object pool — uses the same clear illustrated subjects as Memory Match ────────
const ALL_OBJECTS = [
  { id: 'cat',        img: '/games/memory/cat.png',        label: 'Cat',        color: '#FF9B6A' },
  { id: 'dog',        img: '/games/memory/dog.png',        label: 'Dog',        color: '#7EC8E3' },
  { id: 'bird',       img: '/games/memory/bird.png',       label: 'Bird',       color: '#A8E6CF' },
  { id: 'fish',       img: '/games/memory/fish.png',       label: 'Fish',       color: '#88D8FF' },
  { id: 'butterfly',  img: '/games/memory/butterfly.png',  label: 'Butterfly',  color: '#DDA0DD' },
  { id: 'apple',      img: '/games/memory/apple.png',      label: 'Apple',      color: '#FF8080' },
  { id: 'strawberry', img: '/games/memory/strawberry.png', label: 'Strawberry', color: '#FF6B8A' },
  { id: 'watermelon', img: '/games/memory/watermelon.png', label: 'Watermelon', color: '#7FE47F' },
  { id: 'banana',     img: '/games/memory/banana.png',     label: 'Banana',     color: '#FFE070' },
  { id: 'orange',     img: '/games/memory/orange.png',     label: 'Orange',     color: '#FFB347' },
  { id: 'flower',     img: '/games/memory/flower.png',     label: 'Flower',     color: '#FF80A8' },
  { id: 'tree',       img: '/games/memory/tree.png',       label: 'Tree',       color: '#6DB36D' },
  { id: 'leaf',       img: '/games/memory/leaf.png',       label: 'Leaf',       color: '#90D890' },
  { id: 'mushroom',   img: '/games/memory/mushroom.png',   label: 'Mushroom',   color: '#D9A070' },
  { id: 'cactus',     img: '/games/memory/cactus.png',     label: 'Cactus',     color: '#87C87F' },
  { id: 'star',       img: '/games/memory/star.png',       label: 'Star',       color: '#FFD966' },
  { id: 'moon',       img: '/games/memory/moon.png',       label: 'Moon',       color: '#C8B4E8' },
  { id: 'sun',        img: '/games/memory/sun.png',        label: 'Sun',        color: '#FFD44A' },
  { id: 'rainbow',    img: '/games/memory/rainbow.png',    label: 'Rainbow',    color: '#A8D8EA' },
  { id: 'heart',      img: '/games/memory/heart.png',      label: 'Heart',      color: '#FF80B0' },
];


// ── Difficulty config ─────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, objects: 3, seq: 2, viewMs: 8000 },
  { level: 2, objects: 4, seq: 2, viewMs: 7000 },
  { level: 3, objects: 5, seq: 3, viewMs: 6500 },
  { level: 4, objects: 6, seq: 3, viewMs: 6000 },
  { level: 5, objects: 7, seq: 4, viewMs: 5500 },
];
const TOTAL_LEVELS = LEVELS.length;

type Phase = 'loading' | 'exploring' | 'sequencing' | 'countdown' | 'recalling' | 'feedback' | 'levelDone' | 'complete';

interface RoomObject {
  id: string;
  img: string;
  label: string;
  color: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryGalleryGame({ onBack }: Props) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [level,       setLevel]       = useState(0);
  const [phase,       setPhase]       = useState<Phase>('exploring');
  const [roomObjs,    setRoomObjs]    = useState<RoomObject[]>([]);
  const [sequence,    setSequence]    = useState<number[]>([]);        // indices into roomObjs
  const [litStep,     setLitStep]     = useState<number | null>(null); // current seq step being lit
  const [seqNums,     setSeqNums]     = useState<(number | null)[]>([]);
  const [clicks,      setClicks]      = useState<number[]>([]);        // player's picks (obj indices)
  const [lastWrong,   setLastWrong]   = useState<number | null>(null);
  const [countdown,   setCountdown]   = useState(0);
  const [score,       setScore]       = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [roundResult, setRoundResult] = useState<{ correct: number; total: number } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const updateScore = useAppStore(s => s.updateScore);

  const after = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const cfg = LEVELS[level] ?? LEVELS[LEVELS.length - 1];

  const buildRound = useCallback((lvl: number) => {
    const c = LEVELS[lvl] ?? LEVELS[LEVELS.length - 1];
    const objPool = shuffle(ALL_OBJECTS).slice(0, c.objects);
    const room: RoomObject[] = objPool.map(obj => ({ ...obj }));
    const seq = shuffle([...Array(c.objects).keys()]).slice(0, c.seq);
    return { room, seq };
  }, []);

  const startRound = useCallback((lvl: number) => {
    clearTimers();
    const { room, seq } = buildRound(lvl);
    setLevel(lvl);
    setRoomObjs(room);
    setSequence(seq);
    setSeqNums(room.map(() => null));
    setLitStep(null);
    setClicks([]);
    setLastWrong(null);
    setRoundResult(null);
    setPhase('exploring');

    const c = LEVELS[lvl] ?? LEVELS[LEVELS.length - 1];
    const stepDur = 750;
    const gap     = stepDur + 350;

    // Brief look then start sequence
    after(() => {
      setPhase('sequencing');
      seq.forEach((objIdx, step) => {
        after(() => {
          setLitStep(step);
          setSeqNums(prev => {
            const next = [...prev];
            next[objIdx] = step + 1;
            return next;
          });
          after(() => setLitStep(null), stepDur);
        }, step * gap + 100);
      });

      // After sequence, countdown timer
      after(() => {
        setPhase('countdown');
        let rem = Math.round(c.viewMs / 1000);
        setCountdown(rem);

        const tick = setInterval(() => {
          rem -= 1;
          setCountdown(rem);
          if (rem <= 0) {
            clearInterval(tick);
            // Clear numbers and start recall
            setSeqNums(room.map(() => null));
            setLitStep(null);
            setClicks([]);
            setPhase('recalling');
          }
        }, 1000);
        timers.current.push(tick as unknown as ReturnType<typeof setTimeout>);
      }, seq.length * gap + 600);
    }, 1200);
  }, [buildRound, clearTimers, after]);

  const handleStartGame = useCallback(() => {
    setShowInstructions(false);
    setScore(0);
    setStreak(0);
    startRound(0);
  }, [startRound]);

  const handleObjectClick = useCallback((idx: number) => {
    if (phase !== 'recalling') return;
    if (clicks.includes(idx)) return;

    const expectedObjIdx = sequence[clicks.length];
    const isCorrect = idx === expectedObjIdx;

    if (isCorrect) {
      const newClicks = [...clicks, idx];
      setClicks(newClicks);
      setSeqNums(prev => {
        const next = [...prev];
        next[idx] = newClicks.length;
        return next;
      });

      if (newClicks.length === sequence.length) {
        // Round complete
        const correct = sequence.length;
        const newStreak = streak + 1;
        setStreak(newStreak);
        const pts = correct * 100 + (newStreak > 1 ? (newStreak - 1) * 50 : 0);
        setScore(s => s + pts);
        setRoundResult({ correct, total: sequence.length });
        setPhase('feedback');
      }
    } else {
      setLastWrong(idx);
      const newStreak = 0;
      setStreak(newStreak);
      const correct = clicks.length;
      setRoundResult({ correct, total: sequence.length });
      // Reveal correct sequence
      setSeqNums(sequence.reduce<(number | null)[]>((acc, objIdx, step) => {
        acc[objIdx] = step + 1;
        return acc;
      }, roomObjs.map(() => null)));
      setPhase('feedback');
      after(() => setLastWrong(null), 600);
    }
  }, [phase, clicks, sequence, streak, roomObjs, after]);

  const handleNextRound = useCallback(() => {
    const nextLevel = level + 1;
    if (nextLevel >= TOTAL_LEVELS) {
      setPhase('complete');
      updateScore('memoryGallery', score + 500);
    } else {
      setPhase('levelDone');
    }
  }, [level, score, updateScore]);

  const handleNextLevel = useCallback(() => {
    startRound(level + 1);
  }, [level, startRound]);

  const objectImgFilter = (idx: number) => {
    if (phase === 'sequencing' && sequence[litStep ?? -1] === idx)
      return `drop-shadow(0 0 16px ${roomObjs[idx]?.color ?? '#fff'}) drop-shadow(0 0 30px ${roomObjs[idx]?.color ?? '#fff'})`;
    if (clicks.includes(idx))
      return 'drop-shadow(0 0 12px rgba(74,222,128,0.9))';
    if (lastWrong === idx)
      return 'drop-shadow(0 0 16px rgba(248,113,113,0.95))';
    if (phase === 'feedback' && sequence.includes(idx) && !clicks.includes(idx))
      return 'drop-shadow(0 0 12px rgba(251,191,36,0.8))';
    return 'none';
  };

  return (
    <>
      <GameShell score={score} onBack={onBack}>

        {/* Level / streak bar */}
        <div className="flex items-center justify-between w-full mb-3" style={{ maxWidth: '100%' }}>
          <span className="font-semibold" style={{ color: '#c9a96e', fontSize: 20 }}>
            Level {level + 1}/{TOTAL_LEVELS}
          </span>
          <span style={{ color: 'rgba(201,169,110,0.6)', fontSize: 18 }}>
            {streak > 0 ? `${streak}× streak` : ''}
          </span>
          {/* Seq progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: cfg.seq }, (_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 8, height: 8,
                  background: i < clicks.length
                    ? '#4ade80'
                    : phase === 'recalling' || phase === 'feedback'
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(201,169,110,0.25)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Instruction bar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between w-full rounded-xl px-4 py-2 mb-3 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,169,110,0.15)', minHeight: 42 }}
          >
            <span style={{
              color: phase === 'recalling' ? '#4ade80' : phase === 'feedback' ? (roundResult?.correct === sequence.length ? '#4ade80' : '#f87171') : '#c9a96e',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}>
              {phase === 'exploring'   ? 'Explore'
               : phase === 'sequencing' ? 'Watch'
               : phase === 'countdown'  ? 'Memorize'
               : phase === 'recalling'  ? 'Recall'
               : phase === 'feedback'   ? (roundResult?.correct === sequence.length ? 'Correct!' : 'Wrong')
               : ''}
            </span>
            <span style={{ color: 'rgba(232,213,183,0.7)', fontSize: 20, fontStyle: 'italic' }}>
              {phase === 'exploring'   ? `${cfg.seq} objects will glow in sequence…`
               : phase === 'sequencing' ? `Watch the order — ${cfg.seq} objects`
               : phase === 'countdown'  ? `${countdown}s — study the sequence`
               : phase === 'recalling'  ? `Click ${sequence.length - clicks.length} more in order`
               : phase === 'feedback'   ? `${roundResult?.correct ?? 0} / ${roundResult?.total ?? 0} correct`
               : ''}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Card Grid */}
        <div
          className="flex-1 w-full rounded-2xl flex flex-col"
          style={{
            minHeight: 0,
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #05080F 0%, #020408 100%)',
          }}
        >
          {/* Framed objects grid — fills the wall, no scroll */}
          <div
            className="flex-1 grid grid-cols-2 gap-2.5 p-2.5"
            style={{ minHeight: 0, gridAutoRows: '1fr' }}
          >
            {roomObjs.map((obj, idx) => {
              const seqNum   = seqNums[idx];
              const isLit    = phase === 'sequencing' && sequence[litStep ?? -1] === idx;
              const isPicked = clicks.includes(idx);
              const isWrong  = lastWrong === idx;
              const isInSeq  = sequence.includes(idx);

              const frameBorder = isWrong   ? '#f87171'
                                : isPicked  ? '#4ade80'
                                : isLit     ? obj.color
                                : phase === 'feedback' && isInSeq && !isPicked
                                ? '#fbbf24'
                                : `${obj.color}55`;

              const frameGlow = isLit
                ? `0 0 32px ${obj.color}, 0 4px 18px rgba(0,0,0,0.4)`
                : isPicked   ? '0 0 24px rgba(74,222,128,0.6), 0 4px 18px rgba(0,0,0,0.4)'
                : isWrong    ? '0 0 24px rgba(248,113,113,0.6), 0 4px 18px rgba(0,0,0,0.4)'
                :              '0 4px 8px rgba(0,0,0,0.3)';

              return (
                <motion.button
                  key={obj.id}
                  onClick={() => handleObjectClick(idx)}
                  disabled={phase !== 'recalling' || isPicked}
                  style={{
                    position: 'relative',
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    cursor: phase === 'recalling' && !isPicked ? 'pointer' : 'default',
                  }}
                  whileTap={phase === 'recalling' && !isPicked ? { scale: 0.96 } : {}}
                >
                  {/* Colorful card */}
                  <motion.div
                    style={{
                      position: 'absolute', inset: 0,
                      borderRadius: 12,
                      border: `3.5px solid ${frameBorder}`,
                      boxShadow: frameGlow,
                      background: `linear-gradient(145deg, ${obj.color}28, ${obj.color}14)`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 4,
                      overflow: 'hidden',
                      transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
                    }}
                    animate={{ scale: isLit ? 1.06 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <img
                      src={obj.img}
                      alt={obj.label}
                      draggable={false}
                      style={{
                        width: '64%',
                        height: '64%',
                        objectFit: 'contain',
                        filter: objectImgFilter(idx),
                        transition: 'filter 0.25s ease',
                      }}
                    />
                    <span style={{
                      fontSize: 'clamp(16px, 4.5vw, 22px)',
                      fontWeight: 700,
                      color: isWrong   ? '#fca5a5'
                           : isPicked  ? '#86efac'
                           : isLit     ? '#fff'
                           :             `${obj.color}dd`,
                      letterSpacing: '0.03em',
                      lineHeight: 1,
                      textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                      transition: 'color 0.25s',
                    }}>
                      {obj.label}
                    </span>
                  </motion.div>

                  {/* Sequence number badge */}
                  <AnimatePresence>
                    {seqNum !== null && (
                      <motion.div
                        className="absolute flex items-center justify-center rounded-full"
                        style={{
                          top: 6, right: 6, zIndex: 10,
                          width: 48, height: 48,
                          background: isPicked ? '#4ade80' : '#fbbf24',
                          color: '#0a0612',
                          fontSize: 22, fontWeight: 700,
                          fontFamily: 'Quicksand, sans-serif',
                          boxShadow: isPicked
                            ? '0 0 12px rgba(74,222,128,0.8)'
                            : '0 0 12px rgba(251,191,36,0.8)',
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', damping: 14 }}
                      >
                        {isPicked ? '✓' : seqNum}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Wrong badge */}
                  <AnimatePresence>
                    {isWrong && (
                      <motion.div
                        className="absolute flex items-center justify-center rounded-full"
                        style={{
                          top: 6, right: 6, zIndex: 10,
                          width: 48, height: 48,
                          background: '#f87171', color: '#fff',
                          fontSize: 22, fontWeight: 700,
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        ✕
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Next Round button below grid */}
          <AnimatePresence>
            {phase === 'feedback' && (
              <motion.div
                className="flex justify-center px-4 pb-5 pt-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.button
                  onClick={handleNextRound}
                  className="px-10 py-3 rounded-xl font-semibold text-white"
                  style={{
                    background: roundResult?.correct === sequence.length
                      ? 'linear-gradient(135deg, #c9a96e, #9b6f3a)'
                      : 'linear-gradient(135deg, #9B6FD8, #7B4FC8)',
                    fontSize: 20,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {level + 1 >= TOTAL_LEVELS ? 'Finish →' : 'Next Round →'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </GameShell>

      {/* Instructions overlay */}
      {showInstructions && <MemoryGalleryInstructions onPlay={handleStartGame} />}

      {/* Level done overlay */}
      <AnimatePresence>
        {phase === 'levelDone' && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ background: 'rgba(5,8,15,0.82)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="glass flex flex-col items-center gap-5 rounded-3xl p-10 text-center"
              style={{ maxWidth: 360 }}
              initial={{ scale: 0.85, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div style={{ fontSize: 48, lineHeight: 1 }}>🏛️</div>
              <h2 className="font-semibold text-3xl" style={{ color: '#c9a96e' }}>
                Wing {level + 1} Complete
              </h2>
              <p style={{ color: 'rgba(232,213,183,0.6)', fontSize: 18 }}>
                Wing {level + 2} — {LEVELS[level + 1]?.seq} objects to recall
              </p>
              <motion.button
                onClick={handleNextLevel}
                className="px-10 py-3.5 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #c9a96e, #9b6f3a)', color: '#0a0612' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Enter Next Wing →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion */}
      {phase === 'complete' && (
        <CompletionOverlay
          title="Master Curator!"
          subtitle={`All ${TOTAL_LEVELS} wings of the manor explored`}
          score={score}
          onReplay={() => {
            setScore(0);
            setStreak(0);
            setShowInstructions(true);
            setPhase('exploring');
          }}
          onHome={onBack}
        />
      )}
    </>
  );
}
