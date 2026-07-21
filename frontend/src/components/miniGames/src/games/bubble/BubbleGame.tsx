import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameShell from '../../components/GameShell';
import CompletionOverlay from '../../components/CompletionOverlay';
import InstructionsOverlay from '../../components/InstructionsOverlay';
import { useSound } from '../../hooks/useSound';
import { useAppStore } from '../../store/useAppStore';
import { type FallingBall, BALL_RADIUS, LEVEL_VY_BASE, LEVEL_VY_RANGE, makeBall, splitCount } from './bubbleData';

interface Props { onBack: () => void; }

const CANVAS_BG = '#05091A';
const MAX_MISSES = 20;
const PTS_PER_HIT = 10;
// Hits needed to finish each level — grows so later levels feel longer
const HITS_PER_LEVEL = [5, 8, 12, 18];
const BULLET_SPEED = 14;
const BULLET_R = 7;
const SHOOTER_Y_OFFSET = 36;

const LEVEL_NAMES = ['Warm-Up', 'Focus', 'Challenge', 'Expert'];
const LEVEL_DESCS = [
  'Balls fall slowly — take your time to aim.',
  'Speed is picking up. Stay focused!',
  'Balls now drift sideways. Track carefully!',
  'Maximum speed & movement. React fast!',
];
const LEVEL_STARS = [1, 2, 3, 4];

let gid = 0;
function uid() { return `b${++gid}`; }

interface Bullet { x: number; y: number; vx: number; vy: number; }

function buildSplitFromHit(
  hitX:     number,
  hitY:     number,
  parentR:  number,
  parentVy: number,   // exact speed of the ball that was hit
  level:    number,   // level BEFORE any level-up this tick
): FallingBall[] {
  const count  = splitCount(level);
  const redIdx = Math.floor(Math.random() * count);
  const childR = Math.max(16, parentR * 0.88);
  const lvl    = Math.min(level, 3);

  return Array.from({ length: count }, (_, j): FallingBall => {
    // The red ball keeps the parent's exact speed so the player feels no change.
    // Blue distractor balls use the level speed (they just scatter and fall off).
    const vy = j === redIdx
      ? parentVy
      : LEVEL_VY_BASE[lvl] + Math.random() * LEVEL_VY_RANGE[lvl];
    const vx = (Math.random() - 0.5) * 1.3;
    return {
      id: uid(),
      isRed:     j === redIdx,
      x:         hitX,
      y:         hitY,
      baseX:     hitX,
      vx,
      vy,
      r:         childR,
      amplitude: level >= 3 ? 10 + Math.random() * 18 : 0,
      frequency: 0.022 + Math.random() * 0.018,
      phase:     Math.random() * Math.PI * 2,
      t:         0,
    };
  });
}

interface Flash { x: number; y: number; alpha: number; red: boolean; r: number; }

interface GameState {
  balls: FallingBall[];
  bullets: Bullet[];
  shooterX: number;
  angle: number;
  score: number;
  level: number;
  misses: number;
  hits: number;
  done: boolean;
  started: boolean;
  paused: boolean;           // true while waiting for level-confirm
  flash: Flash | null;
  warningAlpha: number;
}

function initialState(w = 300): GameState {
  return {
    balls: [], bullets: [],
    shooterX: w / 2, angle: -Math.PI / 2,
    score: 0, level: 0, misses: 0, hits: 0,
    done: false, started: false, paused: false,
    flash: null, warningAlpha: 0,
  };
}

// ── Between-level overlay ─────────────────────────────────────────────────────

interface LevelGateProps {
  completedLevel: number;   // 0-indexed level just finished
  nextLevel: number;        // 0-indexed next level
  onContinue: () => void;
}

function LevelGate({ completedLevel, nextLevel, onContinue }: LevelGateProps) {
  const nextName = LEVEL_NAMES[Math.min(nextLevel, LEVEL_NAMES.length - 1)];
  const nextDesc = LEVEL_DESCS[Math.min(nextLevel, LEVEL_DESCS.length - 1)];
  const stars    = LEVEL_STARS[Math.min(nextLevel, LEVEL_STARS.length - 1)];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(3,5,16,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        className="flex flex-col items-center gap-6 rounded-3xl p-10 max-w-sm w-full mx-4"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 48px rgba(0,0,0,0.4)' }}
        initial={{ scale: 0.8, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        {/* Checkmark */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4CAF50,#2E7D32)' }}>
          <span className="text-3xl">✓</span>
        </div>

        <div className="text-center">
          <p className="text-sm uppercase tracking-widest mb-1" style={{ color: '#9FD8FF', opacity: 0.7 }}>
            Level {completedLevel + 1} Complete
          </p>
          <h2 className="font-display text-3xl font-bold" style={{ color: '#FFFFFF' }}>
            {LEVEL_NAMES[Math.min(completedLevel, LEVEL_NAMES.length - 1)]}
          </h2>
        </div>

        {/* Next level preview */}
        <div className="w-full rounded-2xl p-4 text-center" style={{ background: 'rgba(159,216,255,0.08)', border: '1px solid rgba(159,216,255,0.15)' }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#9FD8FF', opacity: 0.6 }}>
            Next — Level {nextLevel + 1}
          </p>
          <p className="text-lg font-semibold mb-1" style={{ color: '#FFFFFF' }}>
            {nextName}
          </p>
          <div className="flex justify-center gap-1 mb-2">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} style={{ opacity: i < stars ? 1 : 0.2, fontSize: 14 }}>★</span>
            ))}
          </div>
          <p className="text-sm" style={{ color: '#9FD8FF' }}>{nextDesc}</p>
        </div>

        <motion.button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg,#9B6FD8,#7B4FC8)', boxShadow: '0 4px 24px rgba(123,79,200,0.4)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Continue →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BubbleGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<GameState>(initialState());
  const rafRef    = useRef(0);

  const [score, setScore]               = useState(0);
  const [misses, setMisses]             = useState(0);
  const [level, setLevel]               = useState(1);
  const [done, setDone]                 = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  // pendingLevelUp = { completed: 0-indexed level done, next: 0-indexed next level }
  const [pendingLevelUp, setPendingLevelUp] = useState<{ completed: number; next: number } | null>(null);

  const { play }      = useSound();
  const updateScore   = useAppStore((s) => s.updateScore);

  // ── Red hit handler ───────────────────────────────────────────────────────

  const handleRedHit = useCallback(
    (ball: FallingBall, idx: number) => {
      const s = stateRef.current;
      play('chime');

      s.flash  = { x: ball.x, y: ball.y, alpha: 1, red: true, r: ball.r };
      s.balls.splice(idx, 1);
      s.score += PTS_PER_HIT;
      s.hits  += 1;
      setScore(s.score);
      updateScore('bubble', s.score);

      const oldLevel = s.level;
      const threshold = HITS_PER_LEVEL[Math.min(oldLevel, HITS_PER_LEVEL.length - 1)];
      const levelingUp = s.hits >= threshold && oldLevel < HITS_PER_LEVEL.length;

      if (levelingUp) {
        const newLevel = oldLevel + 1;
        // Clear ALL balls immediately so none fall off and count as misses
        s.balls = [];
        s.bullets = [];
        s.misses = 0;
        s.hits = 0;
        s.paused = true;
        play('sparkle');
        setPendingLevelUp({ completed: oldLevel, next: newLevel });
        s.level = newLevel;
        setLevel(newLevel + 1);
        setMisses(0);
      } else {
        // Not leveling up — spawn split balls as normal
        s.balls.push(...buildSplitFromHit(ball.x, ball.y, ball.r, ball.vy, oldLevel));
      }
    },
    [play, updateScore],
  );

  // ── Aim line ──────────────────────────────────────────────────────────────

  const drawAimLine = useCallback(
    (ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, w: number) => {
      let x = sx, y = sy, dx = Math.cos(angle);
      const dy = Math.sin(angle);
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(255,200,200,0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 0; i < 5; i++) {
        while (true) {
          const tLeft  = dx < 0 ? (BULLET_R - x) / dx : Infinity;
          const tRight = dx > 0 ? (w - BULLET_R - x) / dx : Infinity;
          const t = Math.min(tLeft, tRight, 90);
          x += dx * t; y += dy * t;
          ctx.lineTo(x, y);
          if (t < 90) dx = -dx; else break;
        }
        if (y < 0) break;
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    },
    [],
  );

  // ── Draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { width: w, height: h } = canvas;
    const s = stateRef.current;

    const wa = Math.min(1, s.warningAlpha);
    ctx.fillStyle = wa > 0
      ? `rgb(${Math.round(10 + 40 * wa)},${Math.round(10 + 18 * wa)},20)`
      : CANVAS_BG;
    ctx.fillRect(0, 0, w, h);

    const dangerY = h - SHOOTER_Y_OFFSET - 30;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,70,70,0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(0, dangerY);
    ctx.lineTo(w, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    for (const ball of s.balls) {
      ctx.save();
      ctx.shadowColor = ball.isRed ? '#FF3030' : '#3060FF';
      ctx.shadowBlur = 18;
      const grad = ctx.createRadialGradient(
        ball.x - ball.r * 0.3, ball.y - ball.r * 0.35, ball.r * 0.04,
        ball.x, ball.y, ball.r,
      );
      if (ball.isRed) {
        grad.addColorStop(0, '#FF9090');
        grad.addColorStop(0.45, '#FF1818');
        grad.addColorStop(1, '#8B0000');
      } else {
        grad.addColorStop(0, '#C0D8FF');
        grad.addColorStop(0.45, '#4488FF');
        grad.addColorStop(1, '#1A44CC');
      }
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      if (!ball.isRed) {
        ctx.strokeStyle = '#66AAFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      const hl = ctx.createRadialGradient(
        ball.x - ball.r * 0.35, ball.y - ball.r * 0.4, 0,
        ball.x - ball.r * 0.35, ball.y - ball.r * 0.4, ball.r * 0.52,
      );
      hl.addColorStop(0, 'rgba(255,255,255,0.55)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = hl;
      ctx.fill();
      ctx.restore();

      // Large symbol so the ball type is unmistakable
      ctx.save();
      ctx.font = `bold ${Math.round(ball.r * 0.88)}px Quicksand, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ball.isRed ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.70)';
      ctx.fillText(ball.isRed ? '♥' : '✕', ball.x, ball.y + ball.r * 0.06);
      ctx.restore();
    }

    if (s.warningAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, s.warningAlpha);
      ctx.fillStyle = '#FFB830';
      ctx.font = 'bold 13px Quicksand, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Oops! That was a blue ball — aim for red', w / 2, h / 2);
      ctx.restore();
    }

    const sy = h - SHOOTER_Y_OFFSET;
    const sx = s.shooterX;
    if (!s.done && s.started) {
      drawAimLine(ctx, sx, sy, s.angle, w);
    }
    ctx.save();
    ctx.shadowColor = '#FF6060';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#FF9090';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(s.angle) * 20, sy + Math.sin(s.angle) * 20);
    ctx.stroke();
    ctx.shadowBlur = 0;
    const sg = ctx.createRadialGradient(sx - 4, sy - 4, 1, sx, sy, 14);
    sg.addColorStop(0, '#FF9090');
    sg.addColorStop(1, '#CC2222');
    ctx.beginPath();
    ctx.arc(sx, sy, 14, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.restore();

    for (const b of s.bullets) {
      ctx.save();
      ctx.shadowColor = '#FFCCCC';
      ctx.shadowBlur = 12;
      const bg = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, BULLET_R);
      bg.addColorStop(0, '#FFFFFF');
      bg.addColorStop(0.4, '#FFD0D0');
      bg.addColorStop(1, '#FF4040');
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();
    }

    if (s.flash) {
      const f = s.flash;
      const expandR = f.r * (1 + (1 - f.alpha) * 1.5);
      ctx.save();
      ctx.globalAlpha = f.alpha * 0.85;
      ctx.strokeStyle = f.red ? '#FF5555' : '#5577FF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(f.x, f.y, expandR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      f.alpha -= 0.065;
      if (f.alpha <= 0) s.flash = null;
    }

  }, [drawAimLine]);

  // ── Game loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = canvas.clientWidth  || 220;
      canvas.height = canvas.clientHeight || 440;
      stateRef.current.shooterX = canvas.width / 2;
    };
    resize();

    const tick = () => {
      const s = stateRef.current;
      const { width: w, height: h } = canvas;
      const dangerY = h - SHOOTER_Y_OFFSET - 30;

      if (s.started && !s.done && !s.paused) {
        if (s.warningAlpha > 0) s.warningAlpha = Math.max(0, s.warningAlpha - 0.022);

        for (const ball of s.balls) {
          ball.t += 1;
          if (ball.amplitude > 0) {
            ball.baseX += ball.vx;
            const margin = ball.r + ball.amplitude;
            ball.baseX = Math.max(margin, Math.min(w - margin, ball.baseX));
            ball.x = ball.baseX + Math.sin(ball.t * ball.frequency + ball.phase) * ball.amplitude;
          } else {
            ball.baseX += ball.vx;
            if (ball.baseX < ball.r)     { ball.baseX = ball.r;     ball.vx =  Math.abs(ball.vx); }
            if (ball.baseX > w - ball.r) { ball.baseX = w - ball.r; ball.vx = -Math.abs(ball.vx); }
            ball.x = ball.baseX;
          }
          ball.y += ball.vy;
        }

        s.bullets = s.bullets.filter((b) => {
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < BULLET_R)     { b.x = BULLET_R;     b.vx =  Math.abs(b.vx); }
          if (b.x > w - BULLET_R) { b.x = w - BULLET_R; b.vx = -Math.abs(b.vx); }
          if (b.y < -BULLET_R) return false;

          for (let i = 0; i < s.balls.length; i++) {
            const ball = s.balls[i];
            const dx = b.x - ball.x;
            const dy = b.y - ball.y;
            if (dx * dx + dy * dy < (BULLET_R + ball.r) ** 2) {
              if (ball.isRed) {
                handleRedHit(ball, i);
              } else {
                play('flip');
                s.misses += 1;
                s.warningAlpha = 1.0;
                s.flash = { x: ball.x, y: ball.y, alpha: 0.65, red: false, r: ball.r };
                setMisses(s.misses);
                if (s.misses >= MAX_MISSES) { s.done = true; play('complete'); setDone(true); }
              }
              return false; // remove bullet on any hit
            }
          }
          return true;
        });

        let redFell = false;
        s.balls = s.balls.filter((b) => {
          if (b.y > dangerY + b.r) { if (b.isRed) redFell = true; return false; }
          return true;
        });

        if (redFell) {
          play('pop');
          s.misses += 1;
          setMisses(s.misses);
          if (s.misses >= MAX_MISSES) { s.done = true; play('complete'); setDone(true); }
        }

        if (!s.done && !s.balls.some((b) => b.isRed)) {
          const margin = BALL_RADIUS * 2;
          s.balls.push(makeBall(uid(), true, margin + Math.random() * (w - margin * 2), s.level));
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [draw, handleRedHit, play]);

  // ── Start / reset ─────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    const w = canvas?.width ?? 300;
    const margin = BALL_RADIUS * 2;
    stateRef.current = {
      ...initialState(w),
      started: true,
      balls: [makeBall(uid(), true, margin + Math.random() * (w - margin * 2), 0)],
    };
    setScore(0);
    setMisses(0);
    setLevel(1);
    setDone(false);
    setPendingLevelUp(null);
  }, []);

  // ── Level continue ────────────────────────────────────────────────────────

  const handleLevelContinue = useCallback(() => {
    setPendingLevelUp(null);
    const canvas = canvasRef.current;
    const w = canvas?.width ?? 300;
    // Capture the next level before resetting, then restart fresh at that level
    const nextLevel = stateRef.current.level;
    const margin = BALL_RADIUS * 2;
    stateRef.current = {
      ...initialState(w),
      started: true,
      level: nextLevel,
      balls: [makeBall(uid(), true, margin + Math.random() * (w - margin * 2), nextLevel)],
    };
    setScore(0);
    setMisses(0);
    setLevel(nextLevel + 1);
    setDone(false);
  }, []);

  // ── Shoot ─────────────────────────────────────────────────────────────────

  const shoot = useCallback(() => {
    const s = stateRef.current;
    if (!s.started || s.done || s.paused) return;
    const angle = Math.max(-Math.PI + 0.15, Math.min(-0.15, s.angle));
    play('shoot');
    s.bullets.push({
      x: s.shooterX,
      y: (canvasRef.current?.height ?? 440) - SHOOTER_Y_OFFSET,
      vx: Math.cos(angle) * BULLET_SPEED,
      vy: Math.sin(angle) * BULLET_SPEED,
    });
  }, [play]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (canvas.height / rect.height);
    stateRef.current.angle = Math.atan2(my - (canvas.height - SHOOTER_Y_OFFSET), mx - stateRef.current.shooterX);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => { handlePointerMove(e); shoot(); },
    [handlePointerMove, shoot],
  );

  const hitCount = Math.round(score / PTS_PER_HIT);

  return (
    <>
      <GameShell score={score} onBack={onBack}>
        <div className="flex flex-col items-center justify-start gap-3 mt-2 flex-1 w-full">

          <div className="flex items-center gap-2 w-full max-w-xs px-1">
            <div className="flex-1 rounded-xl py-2 text-center"
              style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.22)' }}>
              <div className="text-sm uppercase tracking-widest mb-0.5" style={{ color: '#FF8888', opacity: 0.65 }}>Misses</div>
              <div className="text-3xl font-bold leading-none" style={{ color: '#FF7777' }}>
                {misses}<span className="text-lg font-normal opacity-45">/{MAX_MISSES}</span>
              </div>
            </div>
            <div className="flex-1 rounded-xl py-2 text-center"
              style={{ background: 'rgba(159,216,255,0.08)', border: '1px solid rgba(159,216,255,0.18)' }}>
              <div className="text-sm uppercase tracking-widest mb-0.5" style={{ color: '#9FD8FF', opacity: 0.65 }}>Level</div>
              <div className="text-3xl font-bold leading-none" style={{ color: '#FFFFFF' }}>{level}</div>
            </div>
            <div className="flex-1 rounded-xl py-2 text-center"
              style={{ background: 'rgba(159,216,255,0.08)', border: '1px solid rgba(159,216,255,0.18)' }}>
              <div className="text-sm uppercase tracking-widest mb-0.5" style={{ color: '#9FD8FF', opacity: 0.65 }}>Score</div>
              <div className="text-3xl font-bold leading-none" style={{ color: '#9FD8FF' }}>{score}</div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className="rounded-2xl border border-white/10 touch-none"
            style={{ width: 'min(94vw, 380px)', height: '60vh', minHeight: 260, cursor: 'crosshair', background: CANVAS_BG, boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
          />

          <p className="text-base text-center font-semibold" style={{ color: '#9FD8FF' }}>
            Shoot the <span style={{ color: '#FF5555', fontWeight: 800 }}>♥ red</span> ball — avoid the <span style={{ color: '#5599FF' }}>✕ blue</span> balls
          </p>

          <button onClick={startGame} className="flex items-center gap-2 text-base transition-opacity hover:opacity-100" style={{ color: '#9FD8FF', opacity: 0.75 }}>
            <span className="text-xl">↺</span> New game
          </button>
        </div>
      </GameShell>

      {showInstructions && (
        <InstructionsOverlay game="bubble" onPlay={() => { setShowInstructions(false); startGame(); }} />
      )}

      <AnimatePresence>
        {pendingLevelUp && (
          <LevelGate
            key="level-gate"
            completedLevel={pendingLevelUp.completed}
            nextLevel={pendingLevelUp.next}
            onContinue={handleLevelContinue}
          />
        )}
      </AnimatePresence>

      {done && !pendingLevelUp && (
        <CompletionOverlay
          title="Session Complete"
          subtitle={`${hitCount} hits · ${misses} misses`}
          score={score}
          onReplay={startGame}
          onHome={onBack}
        />
      )}
    </>
  );
}
