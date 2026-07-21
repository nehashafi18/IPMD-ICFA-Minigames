import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { onPlay: () => void }

const DEMO_OBJECTS = [
  { id: 'cat',   img: '/games/memory/cat.png',   color: '#FF9B6A', label: 'Cat'   },
  { id: 'star',  img: '/games/memory/star.png',  color: '#FFD966', label: 'Star'  },
  { id: 'heart', img: '/games/memory/heart.png', color: '#FF80B0', label: 'Heart' },
];

// Sequence: vase(0) → bust(2) → clock(1)
const DEMO_SEQ = [0, 2, 1];

// Thumbnail size in the banner (matches MemoryInstructions BANNER_IMG feel)
const BANNER_IMG = 108;

export default function MemoryGalleryInstructions({ onPlay }: Props) {
  const [step,          setStep]          = useState(0);
  const [litSeqPos,     setLitSeqPos]     = useState<number | null>(null);
  const [lastLitSeqPos, setLastLitSeqPos] = useState(0);
  const [wrongObjIdx,   setWrongObjIdx]   = useState<number | null>(null);
  const [wrongHit,      setWrongHit]      = useState(false);
  const [matchedSeqPos, setMatchedSeqPos] = useState<number[]>([]);
  const [cursorX,       setCursorX]       = useState(5);
  const [cursorY,       setCursorY]       = useState(50);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const after = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const runStep1Ref = useRef<() => void>(() => {});
  const runStep2Ref = useRef<() => void>(() => {});

  const runStep1 = useCallback(() => {
    clearTimers();
    setLitSeqPos(null);
    setLastLitSeqPos(0);
    setWrongHit(false);
    setWrongObjIdx(null);
    setMatchedSeqPos([]);

    after(() => { setLitSeqPos(0); setLastLitSeqPos(0); }, 500);
    after(() => setLitSeqPos(null), 1150);
    after(() => { setLitSeqPos(1); setLastLitSeqPos(1); }, 1700);
    after(() => setLitSeqPos(null), 2350);
    after(() => { setLitSeqPos(2); setLastLitSeqPos(2); }, 2900);
    after(() => setLitSeqPos(null), 3550);
    after(() => runStep1Ref.current(), 5200);
  }, [clearTimers, after]);
  runStep1Ref.current = runStep1;

  const runStep2 = useCallback(() => {
    clearTimers();
    setLitSeqPos(null);
    setWrongHit(false);
    setWrongObjIdx(null);
    setMatchedSeqPos([]);
    setCursorX(5);
    setCursorY(50);

    // Wrong click: clock (middle frame, obj idx 1) — should be vase first
    after(() => { setCursorX(50); setCursorY(50); }, 350);
    after(() => { setWrongObjIdx(1); setWrongHit(true); }, 850);
    after(() => { setWrongHit(false); setWrongObjIdx(null); setCursorX(5); setCursorY(50); }, 1400);

    // Correct 1: vase (left frame, obj idx 0, seq pos 0)
    after(() => { setCursorX(17); setCursorY(50); }, 1950);
    after(() => setMatchedSeqPos([0]), 2500);

    // Correct 2: bust (right frame, obj idx 2, seq pos 1)
    after(() => { setCursorX(83); setCursorY(50); }, 3100);
    after(() => setMatchedSeqPos([0, 1]), 3650);

    // Correct 3: clock (middle frame, obj idx 1, seq pos 2)
    after(() => { setCursorX(50); setCursorY(50); }, 4250);
    after(() => setMatchedSeqPos([0, 1, 2]), 4800);

    after(() => runStep2Ref.current(), 6600);
  }, [clearTimers, after]);
  runStep2Ref.current = runStep2;

  useEffect(() => {
    clearTimers();
    setLitSeqPos(null);
    setLastLitSeqPos(0);
    setWrongHit(false);
    setWrongObjIdx(null);
    setMatchedSeqPos([]);
    setCursorX(5);
    setCursorY(50);

    if (step === 1) runStep1();
    else if (step === 2) runStep2();

    return clearTimers;
  }, [step, runStep1, runStep2, clearTimers]);

  // Derived
  const litObjIdx      = step === 1 ? (litSeqPos !== null ? DEMO_SEQ[litSeqPos] : null) : wrongHit ? wrongObjIdx : null;
  const matchedObjIdxs = new Set(matchedSeqPos.map(p => DEMO_SEQ[p]));
  const allDone        = matchedSeqPos.length === DEMO_SEQ.length;
  const wrongBanner    = step === 2 && wrongHit;
  const doneBanner     = step === 2 && allDone;

  // Which object shows in the normal banner
  const s1BannerObj   = DEMO_OBJECTS[DEMO_SEQ[lastLitSeqPos]];
  const s2NextObjIdx  = allDone ? DEMO_SEQ[DEMO_SEQ.length - 1] : DEMO_SEQ[matchedSeqPos.length];
  const s2BannerObj   = DEMO_OBJECTS[s2NextObjIdx];

  const advance = () => {
    if (step < 2) setStep(s => s + 1);
    else onPlay();
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: '#05080F' }}
    >

      {/* ── BANNER (steps 1 & 2) — mirrors MemoryInstructions exactly ── */}
      <div style={{ minHeight: step > 0 ? 176 : 0, flexShrink: 0 }}>
        <AnimatePresence mode="wait">

          {/* Wrong order — [wrong obj] → [correct next] */}
          {step > 0 && wrongBanner && (
            <motion.div
              key="banner-wrong"
              className="flex items-center gap-5 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{ background: 'rgba(230,80,80,0.12)', border: '1.5px solid rgba(230,80,80,0.3)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <FrameThumb img={DEMO_OBJECTS[wrongObjIdx ?? 1].img} borderColor="rgba(239,68,68,0.8)" color={DEMO_OBJECTS[wrongObjIdx ?? 1].color} size={BANNER_IMG} />
              <span style={{ color: '#9FD8FF', fontSize: 30, lineHeight: 1 }}>→</span>
              <FrameThumb img={DEMO_OBJECTS[DEMO_SEQ[matchedSeqPos.length]].img} borderColor={DEMO_OBJECTS[DEMO_SEQ[matchedSeqPos.length]].color} color={DEMO_OBJECTS[DEMO_SEQ[matchedSeqPos.length]].color} size={BANNER_IMG} />
            </motion.div>
          )}

          {/* All done — matches green "correct" banner in MemoryInstructions */}
          {step > 0 && doneBanner && (
            <motion.div
              key={`banner-done-${step}`}
              className="flex items-center gap-5 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{ background: 'rgba(80,200,120,0.14)', border: '1.5px solid rgba(80,200,120,0.35)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                layoutId="manor-seq-card"
                className="overflow-hidden flex-shrink-0"
                style={{ width: BANNER_IMG, height: BANNER_IMG, borderRadius: 14, border: '2px solid rgba(74,222,128,0.8)', background: `linear-gradient(145deg, ${s2BannerObj.color}30, ${s2BannerObj.color}14)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img src={s2BannerObj.img} alt="" draggable={false} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
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

          {/* Normal — shared layoutId element flies from step 0's big card */}
          {step > 0 && !wrongBanner && !doneBanner && (
            <motion.div
              key={step === 1 ? 'banner-s1' : 'banner-s2'}
              className="flex items-center gap-5 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{ background: 'rgba(201,169,110,0.1)', border: '1.5px solid rgba(201,169,110,0.25)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                layoutId="manor-seq-card"
                className="overflow-hidden flex-shrink-0"
                style={{ width: BANNER_IMG, height: BANNER_IMG, borderRadius: 14, border: `2px solid ${litSeqPos !== null && step === 1 ? 'rgba(201,169,110,1)' : 'rgba(201,169,110,0.45)'}`, background: 'rgba(5,8,15,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.3s' }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={step === 1 ? lastLitSeqPos : matchedSeqPos.length}
                    src={step === 1 ? s1BannerObj.img : s2BannerObj.img}
                    alt=""
                    draggable={false}
                    style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
              </motion.div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 22 }}>
                {step === 1
                  ? `Sequence ${lastLitSeqPos + 1} of ${DEMO_SEQ.length}`
                  : 'Recall in order'}
              </span>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── MAIN VISUAL + BUTTON ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-7"
        style={{ minHeight: 0, padding: '0 16px' }}
      >
        <AnimatePresence mode="wait">

          {/* Step 0 — big first-sequence object; instant exit so layoutId can fly */}
          {step === 0 && (
            <motion.div
              key="step0"
              className="flex flex-col items-center gap-7"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
            >
              <motion.div
                layoutId="manor-seq-card"
                className="overflow-hidden flex-shrink-0 flex flex-col items-center justify-center gap-3"
                style={{
                  width: 'min(74vw, 300px)',
                  height: 'min(74vw, 300px)',
                  borderRadius: 24,
                  border: `3px solid ${DEMO_OBJECTS[DEMO_SEQ[0]].color}`,
                  background: `linear-gradient(145deg, ${DEMO_OBJECTS[DEMO_SEQ[0]].color}35, ${DEMO_OBJECTS[DEMO_SEQ[0]].color}18)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 70px ${DEMO_OBJECTS[DEMO_SEQ[0]].color}80, 0 12px 48px rgba(0,0,0,0.4)`,
                }}
                animate={{
                  boxShadow: [
                    `0 0 55px ${DEMO_OBJECTS[DEMO_SEQ[0]].color}55, 0 12px 48px rgba(0,0,0,0.4)`,
                    `0 0 90px ${DEMO_OBJECTS[DEMO_SEQ[0]].color}cc, 0 12px 48px rgba(0,0,0,0.4)`,
                    `0 0 55px ${DEMO_OBJECTS[DEMO_SEQ[0]].color}55, 0 12px 48px rgba(0,0,0,0.4)`,
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src={DEMO_OBJECTS[DEMO_SEQ[0]].img}
                  alt=""
                  draggable={false}
                  style={{ width: '68%', height: '68%', objectFit: 'contain' }}
                />
                <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }}>
                  {DEMO_OBJECTS[DEMO_SEQ[0]].label}
                </span>
              </motion.div>
              <motion.span style={{ color: '#fff', fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
                Remember the sequence
              </motion.span>
            </motion.div>
          )}

          {/* Steps 1 & 2 — framed objects in a row */}
          {step > 0 && (
            <motion.div
              key={`demo-${step}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ width: 'min(94vw, 440px)' }}
            >
              <DemoRoom
                objects={DEMO_OBJECTS}
                litObjIdx={litObjIdx}
                litSeqPos={litSeqPos}
                wrongHit={wrongHit}
                matchedObjIdxs={matchedObjIdxs}
                showCursor={step === 2}
                cursorX={cursorX}
                cursorY={cursorY}
              />
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
              ? 'linear-gradient(135deg, #c9a96e, #9b6f3a)'
              : 'rgba(255,255,255,0.08)',
            border: step === 2 ? 'none' : '1px solid rgba(255,255,255,0.14)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          layout
        >
          {step === 2 ? 'Enter the Manor →' : 'Next →'}
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
              background: i === step ? '#c9a96e' : 'rgba(201,169,110,0.2)',
            }}
            animate={{ scale: i === step ? 1.4 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Reusable card thumbnail for banner ───────────────────────────────────────
function FrameThumb({ img, borderColor, color, size }: { img: string; borderColor: string; color: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 14, flexShrink: 0,
      border: `2px solid ${borderColor}`,
      background: `linear-gradient(145deg, ${color}28, ${color}14)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src={img} alt="" draggable={false} style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
    </div>
  );
}

// ── Demo room: 3 colorful cards (matching Memory Match style) ─────────────────
interface DemoRoomProps {
  objects:        typeof DEMO_OBJECTS;
  litObjIdx:      number | null;
  litSeqPos:      number | null;
  wrongHit:       boolean;
  matchedObjIdxs: Set<number>;
  showCursor:     boolean;
  cursorX:        number;
  cursorY:        number;
}

function DemoRoom({
  objects, litObjIdx, litSeqPos, wrongHit,
  matchedObjIdxs, showCursor, cursorX, cursorY,
}: DemoRoomProps) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 20,
        background: 'linear-gradient(160deg, #05080F 0%, #020408 100%)',
        padding: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        gap: 12,
      }}
    >
      {objects.map((obj, idx) => {
        const isLit     = litObjIdx === idx;
        const isWrong   = wrongHit && isLit;
        const isMatched = matchedObjIdxs.has(idx);

        const borderColor = isWrong   ? '#f87171'
                          : isMatched ? '#4ade80'
                          : isLit     ? obj.color
                          :             `${obj.color}55`;

        const glow = isWrong   ? `0 0 28px rgba(239,68,68,0.7), 0 3px 12px rgba(0,0,0,0.4)`
                   : isMatched ? `0 0 22px rgba(74,222,128,0.6), 0 3px 12px rgba(0,0,0,0.4)`
                   : isLit     ? `0 0 30px ${obj.color}, 0 3px 12px rgba(0,0,0,0.4)`
                   :              '0 3px 8px rgba(0,0,0,0.3)';

        return (
          <motion.div
            key={obj.id}
            style={{
              flex: 1, aspectRatio: '1', position: 'relative',
              borderRadius: 12,
              border: `3px solid ${borderColor}`,
              boxShadow: glow,
              background: `linear-gradient(145deg, ${obj.color}28, ${obj.color}14)`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4,
              overflow: 'hidden',
              transition: 'border-color 0.25s, box-shadow 0.25s',
            }}
            animate={{ scale: isLit ? 1.07 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={obj.img}
              alt=""
              style={{
                width: '62%', height: '62%', objectFit: 'contain',
                filter: isWrong   ? 'drop-shadow(0 0 10px rgba(239,68,68,0.9))'
                      : isLit     ? `drop-shadow(0 0 14px ${obj.color})`
                      : isMatched ? 'drop-shadow(0 0 10px rgba(74,222,128,0.85))'
                      :             'none',
                transition: 'filter 0.25s ease',
              }}
              draggable={false}
            />
            <span style={{
              fontSize: 16, fontWeight: 700,
              color: isWrong   ? '#fca5a5'
                   : isMatched ? '#86efac'
                   : isLit     ? '#fff'
                   :             `${obj.color}cc`,
              letterSpacing: '0.02em', lineHeight: 1,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              transition: 'color 0.25s',
            }}>
              {obj.label}
            </span>

            {/* Sequence number badge (step 1, while lit) */}
            {isLit && !isWrong && litSeqPos !== null && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#fbbf24', color: '#0a0612',
                  fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(251,191,36,0.8)',
                }}
              >
                {litSeqPos + 1}
              </motion.div>
            )}

            {/* Matched checkmark (step 2) */}
            {isMatched && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#4ade80', color: '#0a0612',
                  fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✓
              </motion.div>
            )}
          </motion.div>
        );
      })}

      {/* Cursor (step 2) */}
      {showCursor && (
        <motion.div
          style={{
            position: 'absolute',
            width: 30, height: 30,
            marginLeft: -15, marginTop: -15,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.82)',
            pointerEvents: 'none',
            zIndex: 20,
          }}
          animate={{ left: `${cursorX}%`, top: `${cursorY}%` }}
          transition={{ type: 'spring', stiffness: 190, damping: 24 }}
        />
      )}
    </div>
  );
}
