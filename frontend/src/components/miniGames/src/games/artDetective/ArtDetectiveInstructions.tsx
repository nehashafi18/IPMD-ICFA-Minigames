import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { onPlay: () => void }

const DEMO_OBJECTS = [
  { img: '/detective/objects/compass.png',  label: 'Compass',  x: 77, y: 66 },
  { img: '/detective/objects/key.png',      label: 'Key',      x: 17, y: 76 },
  { img: '/detective/objects/lantern.png',  label: 'Lantern',  x: 48, y: 25 },
];

const WRONG_SPOT = { x: 35, y: 50 };

type FindPhase =
  | 'idle' | 'wrong-move' | 'wrong-hit'
  | 'move-0' | 'hit-0' | 'found-0'
  | 'move-1' | 'hit-1' | 'found-1'
  | 'move-2' | 'hit-2' | 'found-2'
  | 'all-found';

type HintPhase = 'idle' | 'glowing' | 'fading';

type TimerPhase =
  | 'idle' | 'running' | 'urgent'
  | 'move-final' | 'hit-final' | 'found-final';

export default function ArtDetectiveInstructions({ onPlay }: Props) {
  const [step,         setStep]         = useState(0);
  const [itemsVisible, setItemsVisible] = useState(0);
  const [findPhase,    setFindPhase]    = useState<FindPhase>('idle');
  const [hintPhase,    setHintPhase]    = useState<HintPhase>('idle');
  const [timerPhase,   setTimerPhase]   = useState<TimerPhase>('idle');
  const [cursorX, setCursorX] = useState(10);
  const [cursorY, setCursorY] = useState(48);
  const [timerPct, setTimerPct] = useState(100);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const after = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (timerInterval.current) { clearInterval(timerInterval.current!); timerInterval.current = null; }
  }, []);

  // Step 1: items spring in one by one, then loop
  const runItemDemo = useCallback(() => {
    clearTimers();
    setItemsVisible(0);
    after(() => setItemsVisible(1), 300);
    after(() => setItemsVisible(2), 750);
    after(() => setItemsVisible(3), 1200);
    after(runItemDemo, 4200);
  }, [clearTimers, after]);

  // Step 2: wrong tap then find all 3 objects
  const runFindDemo = useCallback(() => {
    clearTimers();
    setFindPhase('idle');
    setCursorX(10); setCursorY(48);

    after(() => { setCursorX(WRONG_SPOT.x); setCursorY(WRONG_SPOT.y); setFindPhase('wrong-move'); }, 400);
    after(() => { setFindPhase('wrong-hit'); }, 960);
    after(() => { setFindPhase('idle'); }, 1680);

    after(() => { setCursorX(77); setCursorY(66); setFindPhase('move-0'); }, 2180);
    after(() => { setFindPhase('hit-0'); }, 2780);
    after(() => { setFindPhase('found-0'); }, 3230);

    after(() => { setCursorX(17); setCursorY(76); setFindPhase('move-1'); }, 3880);
    after(() => { setFindPhase('hit-1'); }, 4480);
    after(() => { setFindPhase('found-1'); }, 4930);

    after(() => { setCursorX(48); setCursorY(25); setFindPhase('move-2'); }, 5580);
    after(() => { setFindPhase('hit-2'); }, 6180);
    after(() => { setFindPhase('found-2'); }, 6630);
    after(() => { setFindPhase('all-found'); }, 7180);
    after(runFindDemo, 8600);
  }, [clearTimers, after]);

  // Step 3: hint halos appear then fade
  const runHintDemo = useCallback(() => {
    clearTimers();
    setHintPhase('idle');
    after(() => setHintPhase('glowing'), 900);
    after(() => setHintPhase('fading'), 3400);
    after(runHintDemo, 5000);
  }, [clearTimers, after]);

  // Step 4: timer drains urgent → rush to last object
  const runTimerDemo = useCallback(() => {
    clearTimers();
    setTimerPhase('running');
    setTimerPct(88);
    setCursorX(10); setCursorY(48);

    let pct = 88;
    timerInterval.current = setInterval(() => {
      pct -= 1;
      setTimerPct(pct);
      if (pct <= 12) { clearInterval(timerInterval.current!); timerInterval.current = null; }
    }, 34);

    after(() => setTimerPhase('urgent'), 2000);
    after(() => { setCursorX(77); setCursorY(66); setTimerPhase('move-final'); }, 2300);
    after(() => setTimerPhase('hit-final'), 2900);
    after(() => { setTimerPct(10); setTimerPhase('found-final'); }, 3350);
    after(runTimerDemo, 5000);
  }, [clearTimers, after]);

  useEffect(() => {
    clearTimers();
    setItemsVisible(0);
    setFindPhase('idle');
    setHintPhase('idle');
    setTimerPhase('idle');
    setCursorX(10); setCursorY(48);
    setTimerPct(100);

    if (step === 1) runItemDemo();
    else if (step === 2) runFindDemo();
    else if (step === 3) runHintDemo();
    else if (step === 4) runTimerDemo();
    return clearTimers;
  }, [step, runItemDemo, runFindDemo, runHintDemo, runTimerDemo, clearTimers]);

  const advance = () => { if (step < 4) setStep(s => s + 1); else onPlay(); };

  // Step 2 derived state
  const foundMask = [
    ['found-0','move-1','hit-1','found-1','move-2','hit-2','found-2','all-found'].includes(findPhase),
    ['found-1','move-2','hit-2','found-2','all-found'].includes(findPhase),
    ['found-2','all-found'].includes(findPhase),
  ];
  const hitObjIdx =
    findPhase === 'hit-0' ? 0 : findPhase === 'hit-1' ? 1 : findPhase === 'hit-2' ? 2 :
    timerPhase === 'hit-final' ? 0 : null;

  // Step 4: key + lantern pre-found, only compass left
  const step4FoundMask = [
    timerPhase === 'found-final' || timerPhase === 'hit-final',
    true,
    true,
  ];

  const timerUrgent = ['urgent','move-final','hit-final','found-final'].includes(timerPhase);
  const wrongHit    = step === 2 && findPhase === 'wrong-hit';
  const allFoundS2  = step === 2 && findPhase === 'all-found';
  const allFoundS4  = step === 4 && timerPhase === 'found-final';
  const allFound    = allFoundS2 || allFoundS4;
  const s2Normal    = step === 2 && !wrongHit && !allFoundS2;
  const s4Urgent    = step === 4 && timerUrgent && !allFoundS4;
  const s4Normal    = step === 4 && !timerUrgent && !allFoundS4;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: '#05080F' }}
    >

      {/* ── BANNER (steps 1–4) ── */}
      <div style={{ minHeight: step > 0 ? 224 : 0, flexShrink: 0 }}>
        <AnimatePresence mode="wait">

          {/* Step 1 — item preview */}
          {step === 1 && (
            <motion.div key="banner-s1"
              className="flex items-center gap-4 mx-5 mt-5 rounded-3xl px-5 py-4"
              style={{ background: 'rgba(200,170,90,0.10)', border: '1.5px solid rgba(200,170,90,0.25)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div style={{ flexShrink: 0 }}>
                <p style={{ color: 'rgba(200,170,90,0.62)', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0 }}>
                  Find these
                </p>
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, margin: '4px 0 0' }}>
                  Hidden in the scene
                </p>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                {DEMO_OBJECTS.map((obj, i) => (
                  <motion.div key={obj.label}
                    style={{ width: 68, height: 68, borderRadius: 14,
                      border: '1.5px solid rgba(200,170,90,0.22)',
                      background: 'rgba(200,170,90,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    animate={{ opacity: itemsVisible > i ? 1 : 0, scale: itemsVisible > i ? 1 : 0.7 }}
                    transition={{ type: 'spring', damping: 16, stiffness: 200 }}
                  >
                    <img src={obj.img} alt={obj.label} style={{ width: 48, height: 48, objectFit: 'contain' }} draggable={false} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3 — hint lamp */}
          {step === 3 && (
            <motion.div key="banner-hint"
              className="flex items-center gap-4 mx-5 mt-5 rounded-3xl px-5 py-4"
              style={{
                background: hintPhase === 'glowing' ? 'rgba(240,184,72,0.10)' : 'rgba(200,170,90,0.08)',
                border: `1.5px solid ${hintPhase === 'glowing' ? 'rgba(240,184,72,0.38)' : 'rgba(200,170,90,0.20)'}`,
                transition: 'background 0.5s, border-color 0.5s',
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: hintPhase === 'glowing' ? 'rgba(240,184,72,0.18)' : 'rgba(200,170,90,0.06)',
                  border: `1.5px solid ${hintPhase === 'glowing' ? 'rgba(240,184,72,0.45)' : 'rgba(200,170,90,0.18)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: hintPhase === 'glowing' ? '0 0 18px rgba(240,184,72,0.38)' : 'none',
                  transition: 'background 0.5s, border-color 0.5s, box-shadow 0.5s' }}
                animate={hintPhase === 'glowing' ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg viewBox="0 0 22 22" width="22" height="22" fill="none"
                  stroke={hintPhase === 'glowing' ? '#F0B848' : 'rgba(200,170,90,0.45)'}
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'stroke 0.5s' }}>
                  <circle cx="11" cy="9" r="5"/>
                  <path d="M8 14.5h6M9 17h4"/>
                  <path d="M11 2v1.5M4.5 4.5l1 1M17.5 4.5l-1 1M2 10h1.5M19 10h-1.5"/>
                </svg>
              </motion.div>
              <div>
                <p style={{ color: hintPhase === 'glowing' ? '#F0B848' : 'rgba(200,170,90,0.58)', fontSize: 14, fontWeight: 700, margin: 0, transition: 'color 0.5s' }}>
                  {hintPhase === 'glowing' ? 'Objects revealed!' : 'Hint available'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: 10, margin: '3px 0 0', lineHeight: 1.4 }}>
                  Shows all locations for a few seconds
                </p>
              </div>
            </motion.div>
          )}

          {/* Wrong-tap red banner (step 2) */}
          {wrongHit && (
            <motion.div key="banner-wrong"
              className="flex items-center gap-4 mx-5 mt-5 rounded-3xl px-5 py-4"
              style={{ background: 'rgba(230,80,80,0.12)', border: '1.5px solid rgba(230,80,80,0.3)' }}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            >
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <span style={{ color: '#f87171', fontSize: 22, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Not there!
                </span>
                <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 18 }}>
                  Tap the glowing dots
                </span>
              </div>
              <div className="flex-1" />
              <BannerObjects objects={DEMO_OBJECTS} foundMask={[false, false, false]} />
            </motion.div>
          )}

          {/* Timer urgent red banner (step 4) */}
          {s4Urgent && (
            <motion.div key="banner-urgent"
              className="flex flex-col gap-2 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{ background: 'rgba(230,80,80,0.12)', border: '1.5px solid rgba(230,80,80,0.3)' }}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: '#f87171', fontSize: 22, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Time</span>
                <span style={{ color: '#f87171', fontSize: 22, fontWeight: 600 }}>{Math.round(timerPct * 0.1)}s</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', borderRadius: 4, background: '#f87171', transformOrigin: 'left' }}
                  animate={{ width: `${timerPct}%` }} transition={{ duration: 0.1, ease: 'linear' }} />
              </div>
              <BannerObjects objects={DEMO_OBJECTS} foundMask={step4FoundMask} />
            </motion.div>
          )}

          {/* All-found green banner */}
          {allFound && (
            <motion.div key={`banner-done-${step}`}
              className="flex flex-col gap-2 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{ background: 'rgba(80,200,120,0.14)', border: '1.5px solid rgba(80,200,120,0.35)' }}
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            >
              <span style={{ color: '#4ade80', fontSize: 22, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>All found!</span>
              <BannerObjects objects={DEMO_OBJECTS} foundMask={[true, true, true]} />
            </motion.div>
          )}

          {/* Step 2 normal gold banner */}
          {s2Normal && (
            <motion.div key="banner-s2-normal"
              className="flex flex-col gap-2 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{ background: 'rgba(200,170,90,0.10)', border: '1.5px solid rgba(200,170,90,0.25)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <span style={{ color: 'rgba(200,170,90,0.7)', fontSize: 22, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Find these</span>
              <BannerObjects objects={DEMO_OBJECTS} foundMask={foundMask} />
            </motion.div>
          )}

          {/* Step 4 normal gold timer banner */}
          {s4Normal && (
            <motion.div key="banner-s4-normal"
              className="flex flex-col gap-2 mx-5 mt-5 rounded-3xl px-6 py-4"
              style={{ background: 'rgba(200,170,90,0.10)', border: '1.5px solid rgba(200,170,90,0.25)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: 'rgba(200,170,90,0.7)', fontSize: 22, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Time</span>
                <span style={{ color: 'rgba(200,170,90,0.7)', fontSize: 22, fontWeight: 600 }}>{Math.round(timerPct * 0.1)}s</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(to right, #c9a96e, #4ade80)', transformOrigin: 'left' }}
                  animate={{ width: `${timerPct}%` }} transition={{ duration: 0.1, ease: 'linear' }} />
              </div>
              <BannerObjects objects={DEMO_OBJECTS} foundMask={step4FoundMask} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MAIN VISUAL AREA + BUTTON ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-7" style={{ minHeight: 0, padding: '0 16px' }}>
        <AnimatePresence mode="wait">

          {/* Step 0 — big scene with glowing dots */}
          {step === 0 && (
            <motion.div key="step0" className="flex flex-col items-center gap-7"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.05 } }}>
              <motion.div className="relative overflow-hidden"
                style={{ width: 'min(92vw, 480px)', height: 'min(58vw, 310px)', borderRadius: 24 }}
                animate={{ boxShadow: [
                  '0 0 45px rgba(200,170,90,0.3), 0 12px 48px rgba(0,0,0,0.7)',
                  '0 0 80px rgba(200,170,90,0.6), 0 12px 48px rgba(0,0,0,0.7)',
                  '0 0 45px rgba(200,170,90,0.3), 0 12px 48px rgba(0,0,0,0.7)',
                ]}}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img src="/detective/forest.jpg" alt="" className="w-full h-full object-cover" draggable={false} />
                <div className="absolute inset-0" style={{ background: 'rgba(5,3,12,0.35)' }} />
                {DEMO_OBJECTS.map((obj, i) => (
                  <motion.div key={obj.label} className="absolute rounded-full"
                    style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: 12, height: 12,
                      marginLeft: -6, marginTop: -6,
                      background: 'rgba(200,170,90,0.95)', boxShadow: '0 0 10px rgba(200,170,90,0.9)' }}
                    animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.2, delay: i * 0.55, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}
              </motion.div>
              <motion.span style={{ color: '#fff', fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
                Explore the scene
              </motion.span>
            </motion.div>
          )}

          {/* Step 1 — item cards spring in */}
          {step === 1 && (
            <motion.div key="step1" className="flex flex-col items-center gap-5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ display: 'flex', gap: 14 }}>
                {DEMO_OBJECTS.map((obj, i) => (
                  <motion.div key={obj.label}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                    animate={{ opacity: itemsVisible > i ? 1 : 0, y: itemsVisible > i ? 0 : 20, scale: itemsVisible > i ? 1 : 0.8 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                  >
                    <div style={{ width: 96, height: 96, borderRadius: 20,
                      border: '1.5px solid rgba(200,170,90,0.22)', background: 'rgba(200,170,90,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', padding: 12 }}>
                      <div style={{ position: 'absolute', top: -9, left: 9, width: 21, height: 21, borderRadius: '50%',
                        background: '#05080F', border: '1px solid rgba(200,170,90,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800, color: 'rgba(200,170,90,0.65)' }}>
                        {i + 1}
                      </div>
                      <img src={obj.img} alt={obj.label}
                        style={{ width: 68, height: 68, objectFit: 'contain' }} draggable={false} />
                    </div>
                    <span style={{ color: 'rgba(220,200,160,0.62)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                      {obj.label}
                    </span>
                  </motion.div>
                ))}
              </div>
              {/* Progress dots preview */}
              <motion.div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
                borderRadius: 20, border: '1px solid rgba(200,170,90,0.12)', background: 'rgba(200,170,90,0.04)' }}
                animate={{ opacity: itemsVisible >= 3 ? 1 : 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0,1,2].map(k => (
                    <div key={k} style={{ width: 7, height: 7, borderRadius: '50%',
                      background: 'rgba(200,170,90,0.18)', border: '1.5px solid rgba(200,170,90,0.28)' }} />
                  ))}
                </div>
                <span style={{ color: 'rgba(200,170,90,0.42)', fontSize: 13, fontWeight: 600 }}>0 / 3 found</span>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2 — find mechanic (wrong tap + correct finds) */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <SceneDemo cursorX={cursorX} cursorY={cursorY} hitObjIdx={hitObjIdx}
                foundMask={foundMask} objects={DEMO_OBJECTS}
                findPhase={findPhase} timerPhase="idle" hintPhase="idle" />
            </motion.div>
          )}

          {/* Step 3 — hint glow halos */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <SceneDemo cursorX={10} cursorY={48} hitObjIdx={null}
                foundMask={[false, false, false]} objects={DEMO_OBJECTS}
                findPhase="idle" timerPhase="idle" hintPhase={hintPhase} />
            </motion.div>
          )}

          {/* Step 4 — timer urgency + final find */}
          {step === 4 && (
            <motion.div key="step4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <SceneDemo cursorX={cursorX} cursorY={cursorY} hitObjIdx={hitObjIdx}
                foundMask={step4FoundMask} objects={DEMO_OBJECTS}
                findPhase="idle" timerPhase={timerPhase} hintPhase="idle" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Captions */}
        <AnimatePresence mode="wait">
          {step === 1 && <motion.span key="c1" style={{ color: '#fff', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Spot your targets</motion.span>}
          {step === 2 && <motion.span key="c2" style={{ color: '#fff', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Tap hidden objects</motion.span>}
          {step === 3 && <motion.span key="c3" style={{ color: '#fff', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Use your hint when stuck</motion.span>}
          {step === 4 && <motion.span key="c4" style={{ color: '#fff', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Race the clock</motion.span>}
        </AnimatePresence>

        {/* Button */}
        <motion.button onClick={advance} className="py-4 rounded-2xl font-semibold text-white"
          style={{
            width: 'min(94vw, 440px)',
            fontSize: 'clamp(1.05rem, 3.5vw, 1.25rem)',
            background: step === 4 ? 'linear-gradient(135deg, #527A38, #384F24)' : 'rgba(255,255,255,0.08)',
            border: step === 4 ? 'none' : '1px solid rgba(255,255,255,0.14)',
          }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} layout>
          {step === 4 ? 'Start Game →' : 'Next →'}
        </motion.button>
      </div>

      {/* ── DOTS (5 steps) ── */}
      <div className="flex justify-center gap-3 pb-8">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div key={i} className="rounded-full"
            style={{ width: 8, height: 8, background: i === step ? '#c9a96e' : 'rgba(200,170,90,0.2)' }}
            animate={{ scale: i === step ? 1.4 : 1 }} transition={{ duration: 0.3 }} />
        ))}
      </div>
    </motion.div>
  );
}

// ── Animated scene component ──────────────────────────────────────────────────
interface SceneDemoProps {
  cursorX: number;
  cursorY: number;
  hitObjIdx: number | null;
  foundMask: boolean[];
  objects: typeof DEMO_OBJECTS;
  findPhase: FindPhase;
  timerPhase: TimerPhase;
  hintPhase: HintPhase;
}

function SceneDemo({ cursorX, cursorY, hitObjIdx, foundMask, objects, findPhase, timerPhase, hintPhase }: SceneDemoProps) {
  const isWrongHit   = findPhase === 'wrong-hit';
  const cursorActive = findPhase !== 'idle' || timerPhase !== 'idle';
  const hintActive   = hintPhase === 'glowing' || hintPhase === 'fading';

  return (
    <div className="relative overflow-hidden"
      style={{ width: 'min(92vw, 480px)', height: 'min(58vw, 310px)', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
      <img src="/detective/forest.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ background: 'rgba(5,3,12,0.4)' }} />

      {/* Hint halos — radial glow + rotating dashed ring at each object position */}
      {hintActive && objects.map((obj, i) => (
        <div key={`hint-${i}`} className="absolute"
          style={{ left: `${obj.x}%`, top: `${obj.y}%`,
            width: 88, height: 88, marginLeft: -44, marginTop: -44,
            transform: 'translate(-50%,-50%) translate(44px,44px)',
            zIndex: 4, pointerEvents: 'none' }}>
          <motion.div className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(240,184,72,0.30) 0%, rgba(240,184,72,0) 70%)' }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: hintPhase === 'fading' ? 0 : 1, scale: hintPhase === 'fading' ? 0.6 : 1 }}
            transition={{ duration: hintPhase === 'fading' ? 1.3 : 0.55, delay: hintPhase === 'glowing' ? i * 0.18 : 0 }}
          />
          <motion.div className="absolute rounded-full"
            style={{ inset: 20, border: '1.5px dashed rgba(240,184,72,0.72)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: hintPhase === 'fading' ? 0 : 1, rotate: 360 }}
            transition={{
              opacity: { duration: hintPhase === 'fading' ? 1.3 : 0.55, delay: hintPhase === 'glowing' ? i * 0.18 : 0 },
              rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
            }}
          />
        </div>
      ))}

      {/* Wrong-tap red ring + X */}
      <AnimatePresence>
        {isWrongHit && (
          <div key="wrong-flash" className="absolute"
            style={{ left: `${WRONG_SPOT.x}%`, top: `${WRONG_SPOT.y}%`, transform: 'translate(-50%,-50%)', zIndex: 15 }}>
            <motion.div className="absolute rounded-full"
              style={{ width: 30, height: 30, marginLeft: -15, marginTop: -15, border: '2.5px solid #f87171', pointerEvents: 'none' }}
              initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} />
            <motion.span style={{ color: '#f87171', fontSize: 18, fontWeight: 900, textShadow: '0 1px 8px rgba(0,0,0,0.95)',
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', lineHeight: 1 }}
              initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }}
              transition={{ type: 'spring', damping: 12 }}>
              ✕
            </motion.span>
          </div>
        )}
      </AnimatePresence>

      {/* Object dots / checkmarks */}
      {objects.map((obj, i) => {
        const isHit   = hitObjIdx === i;
        const isFound = foundMask[i];
        return (
          <div key={obj.label} className="absolute"
            style={{ left: `${obj.x}%`, top: `${obj.y}%`, transform: 'translate(-50%,-50%)', zIndex: 5 }}>
            <AnimatePresence mode="wait">
              {isFound ? (
                <motion.div key="check" className="flex items-center justify-center rounded-full"
                  style={{ width: 22, height: 22, background: '#4ade80', boxShadow: '0 0 12px rgba(74,222,128,0.7)' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', damping: 12 }}>
                  <span style={{ color: '#0a0612', fontSize: 12, fontWeight: 800, lineHeight: 1 }}>✓</span>
                </motion.div>
              ) : (
                <motion.div key="dot" className="rounded-full"
                  style={{ width: 12, height: 12,
                    background: isHit ? 'rgba(251,191,36,1)' : 'rgba(200,170,90,0.9)',
                    boxShadow: isHit ? '0 0 14px rgba(251,191,36,1)' : '0 0 8px rgba(200,170,90,0.8)' }}
                  animate={!isHit ? { scale: [0.85, 1.2, 0.85], opacity: [0.7, 1, 0.7] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  exit={{ scale: 0, opacity: 0 }} />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isHit && (
                <motion.div key="ring" className="absolute rounded-full"
                  style={{ inset: -12, border: '2.5px solid #fbbf24', pointerEvents: 'none' }}
                  initial={{ scale: 0.4, opacity: 1 }} animate={{ scale: 1.8, opacity: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }} />
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isHit && (
                <motion.span key="found-label" className="absolute text-xs font-bold"
                  style={{ left: '50%', top: -28, transform: 'translateX(-50%)', color: '#fbbf24',
                    whiteSpace: 'nowrap', textShadow: '0 1px 8px rgba(0,0,0,0.9)', letterSpacing: '0.04em', pointerEvents: 'none' }}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                  Found!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Cursor */}
      {cursorActive && (
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12,
            background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.82)',
            boxShadow: '0 0 8px rgba(255,255,255,0.4)', zIndex: 10 }}
          animate={{ left: `${cursorX}%`, top: `${cursorY}%` }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }} />
      )}
    </div>
  );
}

// ── Object thumbnails row in banner ───────────────────────────────────────────
function BannerObjects({ objects, foundMask }: { objects: typeof DEMO_OBJECTS; foundMask: boolean[] }) {
  return (
    <div className="flex items-center gap-3">
      {objects.map((obj, i) => (
        <div key={obj.label} className="relative flex flex-col items-center gap-1">
          <div className="relative overflow-hidden rounded-xl"
            style={{ width: 110, height: 110,
              background: foundMask[i] ? 'rgba(74,222,128,0.12)' : 'rgba(200,170,90,0.08)',
              border: `1.5px solid ${foundMask[i] ? 'rgba(74,222,128,0.4)' : 'rgba(200,170,90,0.25)'}`,
              transition: 'background 0.3s, border-color 0.3s' }}>
            <img src={obj.img} alt={obj.label}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} draggable={false} />
            <AnimatePresence>
              {foundMask[i] && (
                <motion.div className="absolute inset-0 flex items-center justify-center rounded-xl"
                  style={{ background: 'rgba(74,222,128,0.25)' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span style={{ color: '#4ade80', fontSize: 28, fontWeight: 800 }}>✓</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span style={{ color: foundMask[i] ? 'rgba(74,222,128,0.8)' : 'rgba(200,170,90,0.5)',
            fontSize: 16, letterSpacing: '0.04em', fontFamily: 'Quicksand, sans-serif' }}>
            {obj.label}
          </span>
        </div>
      ))}
    </div>
  );
}
