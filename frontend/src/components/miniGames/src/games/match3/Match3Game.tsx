import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  buildGrid, type Grid, findAllMatches, clearCells, applyGravity,
  isAdjacent, swapCells, GRID_SIZE, tileBase, tilePower,
  powerUpExtras, computeSpawns,
  hasValidMoves, reshuffleBoard, findPossibleMove, type PossibleMove,
} from './match3Data';
import Match3Tile from './Match3Tile';
import GameShell from '../../components/GameShell';
import InstructionsOverlay from '../../components/InstructionsOverlay';
import ParticleEngine from '../../systems/ParticleEngine';
import { useParticleBurst } from '../../hooks/useParticleBurst';
import { useSound } from '../../hooks/useSound';
import { useAppStore } from '../../store/useAppStore';
import { POWER_UP_IMAGES } from '../../systems/gameArt';

interface Props { onBack: () => void; }

const MATCH_DELAY = 280;
const CASCADE_DELAY = 180;

export default function Match3Game({ onBack }: Props) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [grid, setGrid] = useState<Grid>(() => buildGrid());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  // null = keyboard cursor not yet activated; avoids a permanent outline at [0,0] on load
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [animating, setAnimating] = useState(false);
  const [score, setScore] = useState(0);
  const [comboDisplay, setComboDisplay] = useState<string | null>(null);
  const [reshuffling, setReshuffling] = useState(false);
  const { bursts, burst, clearBursts } = useParticleBurst();
  const { play } = useSound();
  const updateScore = useAppStore((s) => s.updateScore);
  const gridRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  // Mirror of `selected` kept in a ref so async handlers always read the latest value.
  const selectedRef = useRef<[number, number] | null>(null);
  const stableGridRef = useRef<Grid>(grid);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hint, setHint] = useState<PossibleMove | null>(null);

  // ── Match processing with power-up spawn/activate ────────────────────────
  const processMatches = useCallback(
    async (g: Grid, comboCount: number): Promise<Grid> => {
      const matches = findAllMatches(g);
      if (matches.length === 0) {
        processingRef.current = false;
        return g;
      }

      // Determine cells to clear, power-ups to spawn, extra activations
      const toClear = new Set<string>();           // "r,c"
      const toSpawn = new Map<string, string>();   // "r,c" → new tileId
      const extraClear = new Set<string>();        // from power-up activations

      for (const match of matches) {
        const n = match.cells.length;
        const isHoriz =
          n > 1 && match.cells.every(([mr]) => mr === match.cells[0][0]);

        for (const [r, c] of match.cells) {
          toClear.add(`${r},${c}`);
          const power = tilePower(g[r][c]);
          if (power) {
            for (const [er, ec] of powerUpExtras(g, r, c, power, isHoriz)) {
              extraClear.add(`${er},${ec}`);
            }
          }
        }

      }

      // Spawn power-ups: straight 4+ lines and T/L shape intersections
      for (const [key, tileId] of computeSpawns(matches, g)) {
        toSpawn.set(key, tileId);
      }

      // Particles
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const cellW = rect.width / GRID_SIZE;
        const cellH = rect.height / GRID_SIZE;
        const allAffected = new Set([...toClear, ...extraClear]);
        for (const key of allAffected) {
          const [r, c] = key.split(',').map(Number);
          const base = tileBase(g[r][c]) ?? '';
          burst(
            rect.left + c * cellW + cellW / 2,
            rect.top + r * cellH + cellH / 2,
            base,
          );
        }
      }

      // Score
      const allClearCount = new Set([...toClear, ...extraClear]).size;
      const multiplier = comboCount + 1;
      const gained = allClearCount * 10 * multiplier;
      setScore((s) => {
        const next = s + gained;
        updateScore('match3', next);
        return next;
      });

      if (comboCount > 0) {
        play('sparkle');
        setComboDisplay(`x${comboCount + 1} Combo!`);
        setTimeout(() => setComboDisplay(null), 1100);
      } else {
        play('match');
      }

      await new Promise((r) => setTimeout(r, MATCH_DELAY));

      // Build cleared grid, then apply spawns
      const allClear = new Set([...toClear, ...extraClear]);
      let next = clearCells(g, allClear);
      for (const [key, newTile] of toSpawn) {
        if (!extraClear.has(key)) {
          const [r, c] = key.split(',').map(Number);
          next[r][c] = newTile;
        }
      }
      setGrid(next);

      await new Promise((r) => setTimeout(r, CASCADE_DELAY));
      const fallen = applyGravity(next);
      setGrid(fallen);

      await new Promise((r) => setTimeout(r, CASCADE_DELAY));
      return processMatches(fallen, comboCount + 1);
    },
    [burst, play, updateScore],
  );

  // Detects a dead board and reshuffles normal tiles (power-ups stay in place)
  const reshuffleIfDead = useCallback(
    async (g: Grid): Promise<void> => {
      if (hasValidMoves(g)) return;
      setReshuffling(true);
      await new Promise((r) => setTimeout(r, 600));
      const next = reshuffleBoard(g);
      setGrid(next);
      setReshuffling(false);
      processingRef.current = true;
      await processMatches(next, 0);
    },
    [processMatches],
  );

  // Keep stableGridRef current so the hint timer always reads the latest grid
  useEffect(() => { stableGridRef.current = grid; }, [grid]);
  useEffect(() => () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); }, []);

  const clearHint = useCallback(() => {
    setHint(null);
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
  }, []);

  const startHintTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(
      () => setHint(findPossibleMove(stableGridRef.current)),
      25000,
    );
  }, []);

  // Process initial board on mount
  useEffect(() => {
    (async () => {
      processingRef.current = true;
      setAnimating(true);
      const settled = await processMatches(grid, 0);
      await reshuffleIfDead(settled);
      startHintTimer();
      setAnimating(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep selectedRef in sync so async handlers always see the latest selection.
  const syncSelected = useCallback((val: [number, number] | null) => {
    selectedRef.current = val;
    setSelected(val);
  }, []);

  // ── Tile click / keyboard action ─────────────────────────────────────────
  const handleTileClick = useCallback(
    async (row: number, col: number) => {
      if (processingRef.current) return;

      clearHint();

      // Read selection from the ref — never stale even inside async continuations.
      const sel = selectedRef.current;

      if (!sel) {
        syncSelected([row, col]);
        play('flip');
        return;
      }

      const [selRow, selCol] = sel;

      // Clicked the same tile → deselect.
      if (selRow === row && selCol === col) {
        syncSelected(null);
        return;
      }

      // Clicked non-adjacent tile → move selection.
      if (!isAdjacent(selRow, selCol, row, col)) {
        syncSelected([row, col]);
        play('flip');
        return;
      }

      // Adjacent tile clicked → attempt swap.
      syncSelected(null);           // clear immediately, before any await
      processingRef.current = true;
      setAnimating(true);

      // Capture grid snapshot; don't rely on stale closure value after awaits.
      const currentGrid = stableGridRef.current;
      const swapped = swapCells(currentGrid, selRow, selCol, row, col);
      setGrid(swapped);
      play('shoot');

      const matches = findAllMatches(swapped);
      if (matches.length === 0) {
        // No match — animate snap-back.
        await new Promise((r) => setTimeout(r, 260));
        setGrid(currentGrid);
        processingRef.current = false;
        startHintTimer();
        setAnimating(false);
        return;
      }

      const settled = await processMatches(swapped, 0);
      await reshuffleIfDead(settled);
      startHintTimer();
      setAnimating(false);
    },
    [syncSelected, play, processMatches, reshuffleIfDead, clearHint, startHintTimer],
  );

  // ── Keyboard controls ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
      if (processingRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
          setCursor((prev) => { const [r, c] = prev ?? [0, 0]; return [Math.max(0, r - 1), c]; });
          break;
        case 'ArrowDown':
          setCursor((prev) => { const [r, c] = prev ?? [0, 0]; return [Math.min(GRID_SIZE - 1, r + 1), c]; });
          break;
        case 'ArrowLeft':
          setCursor((prev) => { const [r, c] = prev ?? [0, 0]; return [r, Math.max(0, c - 1)]; });
          break;
        case 'ArrowRight':
          setCursor((prev) => { const [r, c] = prev ?? [0, 0]; return [r, Math.min(GRID_SIZE - 1, c + 1)]; });
          break;
        case 'Enter':
        case ' ':
          setCursor((cur) => {
            const [r, c] = cur ?? [0, 0];
            handleTileClick(r, c);
            return cur ?? [0, 0];
          });
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTileClick]);

  const reset = useCallback(() => {
    clearHint();
    const fresh = buildGrid();
    setGrid(fresh);
    syncSelected(null);
    setCursor(null);
    setAnimating(false);
    setScore(0);
    processingRef.current = false;
    (async () => {
      processingRef.current = true;
      setAnimating(true);
      const settled = await processMatches(fresh, 0);
      await reshuffleIfDead(settled);
      startHintTimer();
      setAnimating(false);
    })();
  }, [processMatches, reshuffleIfDead, clearHint, startHintTimer]);

  return (
    <>
      <ParticleEngine bursts={bursts} onBurstsConsumed={clearBursts} />

      <GameShell score={score} onBack={onBack}>
        <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="flex flex-col items-center gap-3" style={{ width: 'min(86vw, calc(100dvh - 320px))' }}>

          {/* Combo / reshuffle badge */}
          <div className="h-7 flex items-center">
            <AnimatePresence mode="wait">
              {reshuffling ? (
                <motion.div
                  key="reshuffle"
                  initial={{ scale: 0.5, opacity: 0, y: -8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: 8 }}
                  className="font-display text-base font-bold px-4 py-1 glass rounded-full border border-white/15"
                  style={{ color: '#5B8DD6' }}
                >
                  Reshuffling ↺
                </motion.div>
              ) : comboDisplay ? (
                <motion.div
                  key={comboDisplay}
                  initial={{ scale: 0.5, opacity: 0, y: -8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: 8 }}
                  className="font-display text-base font-bold px-4 py-1 glass rounded-full border border-white/15"
                  style={{ color: '#C07A10' }}
                >
                  {comboDisplay}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Grid — touch-action: none prevents scroll-hijacking; interaction is click-only */}
          <div
            ref={gridRef}
            className="grid w-full gap-1"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, aspectRatio: '1', touchAction: 'none' }}
          >
            {grid.map((row, r) =>
              row.map((tileId, c) => (
                <AnimatePresence key={`${r}-${c}`} mode="popLayout">
                  {tileId ? (
                    <motion.div
                      key={tileId + r + c}
                      className="aspect-square"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                    >
                      <Match3Tile
                        tileId={tileId}
                        row={r}
                        col={c}
                        selected={!!selected && selected[0] === r && selected[1] === c}
                        highlighted={false}
                        isCursor={!!cursor && cursor[0] === r && cursor[1] === c}
                        isHinted={
                          !animating && !!hint &&
                          ((hint.r1 === r && hint.c1 === c) || (hint.r2 === r && hint.c2 === c))
                        }
                        onClick={() => handleTileClick(r, c)}
                      />
                    </motion.div>
                  ) : (
                    <div key={`empty-${r}-${c}`} className="aspect-square" />
                  )}
                </AnimatePresence>
              )),
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm mt-1" style={{ color: '#9FD8FF' }}>
            <span>↔ Line blast</span>
            <span className="flex items-center gap-1.5">
              <img src={POWER_UP_IMAGES.bomb} alt="" className="w-5 h-5 rounded-full object-cover" />
              Color bomb
            </span>
            <span className="flex items-center gap-1.5">
              <img src={POWER_UP_IMAGES.super} alt="" className="w-5 h-5 rounded-full object-cover" />
              Super blast
            </span>
          </div>

          <button
            onClick={reset}
            className="flex items-center gap-2 text-base transition-opacity hover:opacity-100"
            style={{ color: '#9FD8FF', opacity: 0.85 }}
          >
            <span className="text-2xl">↺</span> New board
          </button>
        </div>
        </div>
      </GameShell>

      {showInstructions && (
        <InstructionsOverlay game="match3" onPlay={() => setShowInstructions(false)} />
      )}
    </>
  );
}
