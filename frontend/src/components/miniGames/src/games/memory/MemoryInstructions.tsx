import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MEMORY_SCENES } from '../../systems/gameArt';
import MemoryCardTile from './MemoryCard';
import type { MemoryCard } from './memoryData';

const N      = 6;
const COLS   = 3;
const TARGET = 2;   // bird — the card to find
const WRONG  = 4;   // butterfly — simulated wrong pick

const SCENES = MEMORY_SCENES.slice(0, N);

// Size of target image when docked in the banner
const BANNER_IMG = 140;

function makeCards(faceUp: boolean[], matchedIdx: number | null): MemoryCard[] {
  return SCENES.map((s, i) => ({
    id: i,
    symbolId: s.id,
    artStyleId: 'watercolor',
    image: s.image,
    name: s.name,
    flipped: faceUp[i],
    matched: matchedIdx === i,
  }));
}

type DemoPhase =
  | 'idle'
  | 'flip-preview'
  | 'flip-hiding'
  | 'flip-done'
  | 'find-wait'
  | 'find-wrong-lit'
  | 'find-wrong-show'
  | 'find-correct-lit'
  | 'find-matched';

interface Props { onPlay: () => void }

export default function MemoryInstructions({ onPlay }: Props) {
  const [step,      setStep]      = useState(0);
  const [faceUp,    setFaceUp]    = useState<boolean[]>(Array(N).fill(true));
  const [matched,   setMatched]   = useState<number | null>(null);
  const [hovered,   setHovered]   = useState<number | null>(null);
  const [demoPhase, setDemoPhase] = useState<DemoPhase>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const runStep1 = useCallback(() => {
    clearTimers();
    setFaceUp(Array(N).fill(true));
    setMatched(null);
    setHovered(null);
    setDemoPhase('flip-preview');

    after(() => {
      setDemoPhase('flip-hiding');
      for (let i = 0; i < N; i++) {
        after(
          () => setFaceUp(prev => prev.map((v, k) => (k === i ? false : v))),
          i * 230,
        );
      }
      after(() => {
        setDemoPhase('flip-done');
        after(() => {
          setFaceUp(Array(N).fill(true));
          setDemoPhase('flip-preview');
          after(runStep1, 1000);
        }, 1100);
      }, N * 230 + 500);
    }, 1600);
  }, [clearTimers, after]);

  const runStep2 = useCallback(() => {
    clearTimers();
    setFaceUp(Array(N).fill(false));
    setMatched(null);
    setHovered(null);
    setDemoPhase('find-wait');

    after(() => {
      setHovered(WRONG);
      setDemoPhase('find-wrong-lit');
      after(() => {
        setHovered(null);
        setFaceUp(prev => prev.map((v, k) => (k === WRONG || k === TARGET ? true : v)));
        setDemoPhase('find-wrong-show');
        after(() => {
          setFaceUp(Array(N).fill(false));
          setDemoPhase('find-wait');
          after(() => {
            setHovered(TARGET);
            setDemoPhase('find-correct-lit');
            after(() => {
              setHovered(null);
              setFaceUp(prev => prev.map((v, k) => (k === TARGET ? true : v)));
              setMatched(TARGET);
              setDemoPhase('find-matched');
              after(runStep2, 1900);
            }, 680);
          }, 950);
        }, 1500);
      }, 720);
    }, 900);
  }, [clearTimers, after]);

  useEffect(() => {
    clearTimers();
    if (step === 1) runStep1();
    else if (step === 2) runStep2();
    else {
      setFaceUp(Array(N).fill(true));
      setMatched(null);
      setHovered(null);
      setDemoPhase('idle');
    }
    return clearTimers;
  }, [step, runStep1, runStep2, clearTimers]);

  const advance = () => {
    if (step < 2) setStep(s => s + 1);
    else onPlay();
  };

  const cards      = makeCards(faceUp, matched);
  const wrongShown = demoPhase === 'find-wrong-show';

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: '#05080F' }}
    >

      {/* ── BANNER (steps 1 & 2) ── */}
      <div style={{ minHeight: step > 0 ? 176 : 0, flexShrink: 0 }}>
        <AnimatePresence mode="wait">

          {/* Wrong-pick feedback */}
          {step > 0 && wrongShown && (
            <motion.div
              key="wrong"
              className="flex items-center gap-5 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{
                background: 'rgba(230,80,80,0.12)',
                border: '1.5px solid rgba(230,80,80,0.3)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <img
                src={SCENES[WRONG].image} alt="" draggable={false}
                className="rounded-2xl object-cover flex-shrink-0"
                style={{ width: BANNER_IMG, height: BANNER_IMG }}
              />
              <span style={{ color: '#9FD8FF', fontSize: 30, lineHeight: 1 }}>→</span>
              <img
                src={SCENES[TARGET].image} alt="" draggable={false}
                className="rounded-2xl object-cover flex-shrink-0"
                style={{ width: BANNER_IMG, height: BANNER_IMG }}
              />
            </motion.div>
          )}

          {/* Correct-pick feedback — layoutId keeps image in place from normal banner */}
          {step > 0 && demoPhase === 'find-matched' && (
            <motion.div
              key="correct"
              className="flex items-center gap-5 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{
                background: 'rgba(80,200,120,0.14)',
                border: '1.5px solid rgba(80,200,120,0.35)',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                layoutId="target-card"
                className="overflow-hidden flex-shrink-0"
                style={{ width: BANNER_IMG, height: BANNER_IMG, borderRadius: 16 }}
              >
                <img src={SCENES[TARGET].image} alt="" draggable={false}
                  className="w-full h-full object-cover" />
              </motion.div>
              <motion.span
                style={{ color: '#fff', fontSize: 44, lineHeight: 1 }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 11 }}
              >
                ✓
              </motion.span>
            </motion.div>
          )}

          {/* Normal banner — shared image element that flies from step 0's big card */}
          {step > 0 && !wrongShown && demoPhase !== 'find-matched' && (
            <motion.div
              key="normal"
              className="flex items-center gap-5 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{
                background: 'rgba(155,111,216,0.14)',
                border: '1.5px solid rgba(155,111,216,0.3)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                layoutId="target-card"
                className="overflow-hidden flex-shrink-0"
                style={{ width: BANNER_IMG, height: BANNER_IMG, borderRadius: 16 }}
              >
                <img src={SCENES[TARGET].image} alt="" draggable={false}
                  className="w-full h-full object-cover" />
              </motion.div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 22 }}>
                {step === 1 ? 'Remember this' : 'Find it!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MAIN VISUAL AREA + BUTTON (grouped so button sits right under graphic) ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-7"
        style={{ minHeight: 0, padding: '0 16px' }}
      >
        <AnimatePresence mode="wait">

          {/* Step 0 — big card; instant exit so layoutId can take over the image */}
          {step === 0 && (
            <motion.div
              key="step0"
              className="flex flex-col items-center gap-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
            >
              <motion.div
                layoutId="target-card"
                className="overflow-hidden flex-shrink-0"
                style={{
                  width: 'min(74vw, 360px)',
                  height: 'min(74vw, 360px)',
                  borderRadius: 28,
                  boxShadow: '0 0 70px rgba(155,111,216,0.65), 0 12px 48px rgba(0,0,0,0.65)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 55px rgba(155,111,216,0.5),  0 12px 48px rgba(0,0,0,0.65)',
                    '0 0 90px rgba(155,111,216,0.85), 0 12px 48px rgba(0,0,0,0.65)',
                    '0 0 55px rgba(155,111,216,0.5),  0 12px 48px rgba(0,0,0,0.65)',
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src={SCENES[TARGET].image} alt="" draggable={false}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.span
                style={{ color: '#fff', fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}
              >
                Remember this
              </motion.span>
            </motion.div>
          )}

          {/* Steps 1 & 2 — card grid */}
          {step > 0 && (
            <motion.div
              key={`grid-${step}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ width: 'min(94vw, 440px)' }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  gap: 'clamp(10px, 3vw, 20px)',
                }}
              >
                {cards.map((card, idx) => {
                  const isTarget = idx === TARGET;
                  const isWrong  = idx === WRONG;

                  const previewGlow  = step === 1 && demoPhase === 'flip-preview' && isTarget;
                  const hoverWrong   = hovered === WRONG  && isWrong;
                  const hoverCorrect = hovered === TARGET && isTarget;
                  const matchedGlow  = demoPhase === 'find-matched' && isTarget;
                  const showGlow     = previewGlow || hoverWrong || hoverCorrect || matchedGlow;

                  const ringColor =
                    hoverWrong                    ? 'rgba(248,113,113,0.9)' :
                    (hoverCorrect || matchedGlow) ? 'rgba(74,222,128,0.9)'  :
                    '#9B6FD8';
                  const shadow =
                    hoverWrong                    ? '0 0 32px rgba(248,113,113,0.7)' :
                    (hoverCorrect || matchedGlow) ? '0 0 32px rgba(74,222,128,0.7)' :
                    '0 0 32px rgba(155,111,216,0.7)';

                  return (
                    <div key={card.id} className="relative" style={{ aspectRatio: '1' }}>
                      <AnimatePresence>
                        {showGlow && (
                          <motion.div
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{ border: `2.5px solid ${ringColor}`, boxShadow: shadow, zIndex: 10 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </AnimatePresence>
                      <MemoryCardTile
                        card={card}
                        onClick={() => {}}
                        disabled
                        cols={COLS}
                        highlight={hovered === idx && !faceUp[idx]}
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button directly under graphic */}
        <motion.button
          onClick={advance}
          className="py-4 rounded-2xl font-semibold text-white"
          style={{
            width: 'min(94vw, 440px)',
            fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
            background: step === 2
              ? 'linear-gradient(135deg, #9B6FD8, #7B4FC8)'
              : 'rgba(255,255,255,0.08)',
            border: step === 2 ? 'none' : '1px solid rgba(255,255,255,0.14)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          layout
        >
          {step === 2 ? 'Play →' : 'Next →'}
        </motion.button>
      </div>

      {/* ── DOTS ── */}
      <div className="flex justify-center gap-3 pb-8">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 8, height: 8,
              background: i === step ? '#9FD8FF' : 'rgba(159,216,255,0.2)',
            }}
            animate={{ scale: i === step ? 1.4 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
