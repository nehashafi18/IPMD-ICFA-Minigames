import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameShell from '../../components/GameShell';
import CompletionOverlay from '../../components/CompletionOverlay';
import InstructionsOverlay from '../../components/InstructionsOverlay';
import ParticleEngine from '../../systems/ParticleEngine';
import { useParticleBurst } from '../../hooks/useParticleBurst';
import { useSound } from '../../hooks/useSound';
import { useAppStore } from '../../store/useAppStore';
import {
  type BubbleCell, buildInitialGrid, randomBubbleType, getBubbleType,
  BUBBLE_RADIUS, COLS, cellToXY, distance,
  findConnected, findFloating,
} from './bubbleData';

interface Props { onBack: () => void; }

const SPEED = 10;
const MIN_MATCH = 3;
const GRID_PAD_TOP = 24;
const CANVAS_BG = '#FAFAF7';

let globalId = 0;

// Ensures a bubble center is never closer than `r` to any edge of the play area.
// Called AFTER grid→pixel conversion so clamping operates in canvas space.
function getSafeBubblePosition(
  x: number, y: number, r: number, w: number, h: number,
): { x: number; y: number } {
  return {
    x: Math.max(r, Math.min(x, w - r)),
    y: Math.max(r, Math.min(y, h - r)),
  };
}

export default function BubbleGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    grid: buildInitialGrid(),
    shooterX: 0,
    angle: -Math.PI / 2,
    currentType: randomBubbleType(),
    nextType: randomBubbleType(),
    bullet: null as { x: number; y: number; vx: number; vy: number; typeId: string } | null,
    score: 0,
    done: false,
  });
  const rafRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
const { bursts, burst, clearBursts } = useParticleBurst();
  const { play } = useSound();
  const updateScore = useAppStore((s) => s.updateScore);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, scale: 1 });

  // ── Drawing ──────────────────────────────────────────────────────────────

  const drawBubble = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, typeId: string, alpha = 1, r = BUBBLE_RADIUS) => {
      const bt = getBubbleType(typeId);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = bt.glow;
      ctx.shadowBlur = 10;

      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.08, x, y, r);
      grad.addColorStop(0, bt.gradient[0] + 'ee');
      grad.addColorStop(1, bt.gradient[1] + 'cc');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowBlur = 0;
      const hl = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x - r * 0.35, y - r * 0.35, r * 0.5);
      hl.addColorStop(0, 'rgba(255,255,255,0.6)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = hl;
      ctx.fill();

      ctx.globalAlpha = alpha * 0.88;
      ctx.font = `${Math.floor(r * 0.8)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bt.emoji, x, y + 1);
      ctx.restore();
    },
    [],
  );

  const drawAimLine = useCallback(
    (ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, w: number, wallR: number) => {
      let x = sx, y = sy;
      let dx = Math.cos(angle);
      const dy = Math.sin(angle);
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = 'rgba(90,50,140,0.20)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 0; i < 5; i++) {
        while (true) {
          const tLeft = dx < 0 ? (wallR - x) / dx : Infinity;
          const tRight = dx > 0 ? (w - wallR - x) / dx : Infinity;
          const tStep = 80;
          const t = Math.min(tLeft, tRight, tStep);
          x += dx * t;
          y += dy * t;
          ctx.lineTo(x, y);
          if (t < tStep) { dx = -dx; } else break;
        }
      }
      ctx.stroke();
      ctx.restore();
    },
    [],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { w, h, offsetX, scale } = sizeRef.current;
    const r = BUBBLE_RADIUS * scale;
    const s = stateRef.current;

    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(0, h - 80);
    ctx.lineTo(w, h - 80);
    ctx.stroke();

    for (const cell of s.grid) {
      const raw = { x: cell.x * scale + offsetX, y: cell.y * scale + GRID_PAD_TOP };
      const pos = getSafeBubblePosition(raw.x, raw.y, r, w, h);
      drawBubble(ctx, pos.x, pos.y, cell.typeId, 1, r);
    }

    if (!s.bullet && !s.done) {
      drawAimLine(ctx, s.shooterX, h - 50, s.angle, w, r);
    }

    if (s.bullet) {
      const pos = getSafeBubblePosition(s.bullet.x, s.bullet.y, r, w, h);
      drawBubble(ctx, pos.x, pos.y, s.bullet.typeId, 1, r);
    }

    if (!s.done) {
      // Current bubble (cannon) — uses full BUBBLE_RADIUS (UI area, not scaled)
      const cannon = getSafeBubblePosition(s.shooterX, h - 50, BUBBLE_RADIUS, w, h);
      drawBubble(ctx, cannon.x, cannon.y, s.currentType);
      // Next bubble preview
      const nextX = s.shooterX + BUBBLE_RADIUS * 2.8;
      const nextR = BUBBLE_RADIUS * 0.7;
      const nextPos = getSafeBubblePosition(nextX, h - 50, nextR, w, h);
      drawBubble(ctx, nextPos.x, nextPos.y, s.nextType, 0.55, nextR);
      // Swap arrow label between them
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#3A2060';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⇄', s.shooterX + BUBBLE_RADIUS * 1.4, h - 50);
      ctx.restore();
    }
  }, [drawBubble, drawAimLine]);

  // ── Snap logic ────────────────────────────────────────────────────────────

  const snapToGrid = useCallback(
    (bx: number, by: number, typeId: string): BubbleCell | null => {
      const { offsetX, scale } = sizeRef.current;
      const r = BUBBLE_RADIUS * scale;
      let bestDist = Infinity;
      let bestRow = 0, bestCol = 0;
      for (let row = 0; row <= 10; row++) {
        const cols = row % 2 === 0 ? COLS : COLS - 1;
        for (let col = 0; col < cols; col++) {
          const { x: gx, y: gy } = cellToXY(row, col);
          const ax = gx * scale + offsetX, ay = gy * scale + GRID_PAD_TOP;
          if (stateRef.current.grid.some((c) => c.row === row && c.col === col)) continue;
          const d = distance(bx, by, ax, ay);
          if (d < bestDist) { bestDist = d; bestRow = row; bestCol = col; }
        }
      }
      if (bestDist < r * 2.5) {
        const { x, y } = cellToXY(bestRow, bestCol);
        return { id: `bullet-${++globalId}`, typeId, row: bestRow, col: bestCol, x, y };
      }
      return null;
    },
    [],
  );

  // ── Match + cascade ────────────────────────────────────────────────────────
  // Called AFTER bullet has already been nullified. Steps:
  //   1. Add new cell to grid
  //   2. Find connected same-type cluster from new cell
  //   3. If ≥ MIN_MATCH → pop, remove floating, cascade-loop until stable
  //   4. Advance queue, clear swap lock

  const handleMatch = useCallback(
    (newCell: BubbleCell) => {
      const s = stateRef.current;
      // Step 1: attach bubble to board
      s.grid = [...s.grid, newCell];
      const { offsetX, scale } = sizeRef.current;

      const popGroup = (ids: Set<string>, pts: number) => {
        for (const id of ids) {
          const cell = s.grid.find((c) => c.id === id);
          if (cell) burst(cell.x * scale + offsetX, cell.y * scale + GRID_PAD_TOP, cell.typeId);
        }
        s.grid = s.grid.filter((c) => !ids.has(c.id));
        s.score += ids.size * pts;
        setScore(s.score);
        updateScore('bubble', s.score);
      };

      // Step 2: evaluate cluster from new cell
      const connected = findConnected(s.grid, newCell.id);
      if (connected.size >= MIN_MATCH) {
        play('pop');
        popGroup(connected, 10);

        // Remove bubbles no longer connected to the ceiling (gravity)
        const floating = findFloating(s.grid);
        if (floating.size > 0) { play('sparkle'); popGroup(floating, 20); }

        if (s.grid.length === 0) {
          play('complete');
          s.done = true;
          setDone(true);
        }
      } else {
        play('shoot');
      }

      // Step 4: advance queue
      s.currentType = s.nextType;
      s.nextType = randomBubbleType();
    },
    [burst, play, updateScore],
  );

  // ── Game loop ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
      const gridWidth = COLS * BUBBLE_RADIUS * 2;
      const scale = Math.max(0.1, Math.min(1, (w - 4) / gridWidth));
      const scaledGridW = gridWidth * scale;
      sizeRef.current = { w, h, offsetX: (w - scaledGridW) / 2, scale };
      stateRef.current.shooterX = w / 2;
    };

    resize();
    setCanvasReady(true);

    const tick = () => {
      const s = stateRef.current;
      const { w, offsetX, scale } = sizeRef.current;
      const r = BUBBLE_RADIUS * scale;

      if (s.bullet) {
        s.bullet.x += s.bullet.vx;
        s.bullet.y += s.bullet.vy;

        if (s.bullet.x < r) {
          s.bullet.x = r;
          s.bullet.vx = Math.abs(s.bullet.vx);
        } else if (s.bullet.x > w - r) {
          s.bullet.x = w - r;
          s.bullet.vx = -Math.abs(s.bullet.vx);
        }

        // Ceiling: nullify bullet FIRST, then evaluate match
        if (s.bullet.y <= r + GRID_PAD_TOP) {
          const captured = s.bullet;
          s.bullet = null;
          const snapped = snapToGrid(captured.x, captured.y, captured.typeId);
          if (snapped) handleMatch(snapped);
        }

        // Grid collision: nullify bullet FIRST, then evaluate match
        if (s.bullet) {
          for (const cell of s.grid) {
            const cx = cell.x * scale + offsetX;
            const cy = cell.y * scale + GRID_PAD_TOP;
            if (distance(s.bullet.x, s.bullet.y, cx, cy) < r * 1.85) {
              const captured = s.bullet;
              s.bullet = null;
              const snapped = snapToGrid(captured.x, captured.y, captured.typeId);
              if (snapped) handleMatch(snapped);
              break;
            }
          }
        }

        // Off screen
        if (s.bullet && s.bullet.y > sizeRef.current.h) s.bullet = null;
      }

      draw();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [draw, snapToGrid, handleMatch]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const shoot = useCallback(() => {
    const s = stateRef.current;
    if (s.bullet || s.done) return;
    const angle = Math.max(-Math.PI + 0.18, Math.min(-0.18, s.angle));
    play('shoot');
    s.bullet = {
      x: s.shooterX,
      y: sizeRef.current.h - 50,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      typeId: s.currentType,
    };
  }, [play]);

  const handleSwap = useCallback(() => {
    const s = stateRef.current;
    if (s.bullet || s.done) return;
    [s.currentType, s.nextType] = [s.nextType, s.currentType];
    play('flip');
  }, [play]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sy = sizeRef.current.h - 50;
    stateRef.current.angle = Math.atan2(
      e.clientY - rect.top - sy,
      e.clientX - rect.left - stateRef.current.shooterX,
    );
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      onPointerMove(e);
      shoot();
    },
    [onPointerMove, shoot],
  );

  // Keyboard: Shift or S to swap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSwap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSwap]);

  const reset = useCallback(() => {
    stateRef.current = {
      grid: buildInitialGrid(),
      shooterX: sizeRef.current.w / 2,
      angle: -Math.PI / 2,
      currentType: randomBubbleType(),
      nextType: randomBubbleType(),
      bullet: null,
      score: 0,
      done: false,
    };
    setScore(0);
    setDone(false);
  }, []);

  return (
    <>
      <ParticleEngine bursts={bursts} onBurstsConsumed={clearBursts} />

      <GameShell title="Bubble Art" emoji="🫧" score={score} onBack={onBack}>
        <div className="w-full max-w-sm flex flex-col items-center gap-2 mt-2 flex-1">
          <canvas
            ref={canvasRef}
            className="w-full rounded-2xl border border-black/8 touch-none"
            style={{
              minHeight: 480,
              cursor: canvasReady ? 'crosshair' : 'default',
              background: CANVAS_BG,
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            }}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
          />

          {/* Swap button */}
          <motion.button
            onClick={handleSwap}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-black/8 text-sm font-medium transition-all active:scale-95"
            style={{ opacity: 0.85 }}
            whileHover={{ scale: 1.03 }}
            title="Swap current and next bubble (Shift or S)"
          >
            <span>⇄</span>
            <span>Swap bubble</span>
            <span className="text-xs opacity-50">Shift</span>
          </motion.button>

          <p className="text-xs opacity-25">Move to aim  •  Click or tap to shoot</p>

          <button onClick={reset} className="text-sm opacity-35 hover:opacity-60 transition-opacity">
            ↺ New game
          </button>
        </div>
      </GameShell>

      {showInstructions && (
        <InstructionsOverlay game="bubble" onPlay={() => setShowInstructions(false)} />
      )}

      {done && (
        <CompletionOverlay
          title="All Clear!"
          subtitle="You cleared the entire board!"
          score={score}
          onReplay={reset}
          onHome={onBack}
        />
      )}
    </>
  );
}
