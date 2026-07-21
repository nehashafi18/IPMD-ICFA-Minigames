import { ART_STYLES } from '../../systems/artStyles';

export const TILE_TYPES = ART_STYLES.map((s) => ({
  id: s.id,
  image: s.image,
  name: s.name,
  primary: s.primary,
  glow: s.glow,
  gradient: s.gradient,
}));

export const GRID_SIZE = 7;
export type Grid = (string | null)[][];
export type PowerType = 'line' | 'bomb' | 'super';

// ── Power-up encoding helpers ──────────────────────────────────────────────
// Tile IDs are plain strings like "watercolor".
// Power tiles are prefixed: "__line__watercolor", "__bomb__watercolor", etc.

export function tileBase(id: string | null): string | null {
  if (!id) return null;
  return id.replace(/^__(line|bomb|super)__/, '');
}

export function tilePower(id: string | null): PowerType | null {
  if (!id) return null;
  const m = id.match(/^__(line|bomb|super)__/);
  return m ? (m[1] as PowerType) : null;
}

export function makePowerTile(power: PowerType, baseType: string): string {
  return `__${power}__${baseType}`;
}

// ── Grid construction ──────────────────────────────────────────────────────

function randomTileId(): string {
  return TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)].id;
}

export function buildGrid(): Grid {
  const grid: Grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => randomTileId()),
  );
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      while (hasMatchAt(grid, row, col)) {
        grid[row][col] = randomTileId();
      }
    }
  }
  return grid;
}

function hasMatchAt(grid: Grid, row: number, col: number): boolean {
  const v = tileBase(grid[row][col]);
  if (!v) return false;
  if (col >= 2 && tileBase(grid[row][col - 1]) === v && tileBase(grid[row][col - 2]) === v) return true;
  if (row >= 2 && tileBase(grid[row - 1][col]) === v && tileBase(grid[row - 2][col]) === v) return true;
  return false;
}

// ── Match detection ────────────────────────────────────────────────────────

export interface MatchResult {
  cells: [number, number][];
  tileId: string; // base type (no power prefix)
}

export function findAllMatches(grid: Grid): MatchResult[] {
  const usedCells = new Set<string>();
  const results: MatchResult[] = [];

  const mark = (cells: [number, number][], tileId: string) => {
    // Merge with existing match sharing any cell
    const cellKeys = cells.map(([r, c]) => `${r},${c}`);
    const newKeys = cellKeys.filter((k) => !usedCells.has(k));
    if (newKeys.length === 0) return;
    for (const k of cellKeys) usedCells.add(k);
    results.push({ cells, tileId });
  };

  // Horizontal runs
  for (let r = 0; r < GRID_SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= GRID_SIZE; c++) {
      const prev = c > 0 ? grid[r][c - 1] : null;
      const curr = c < GRID_SIZE ? grid[r][c] : null;
      const prevBase = tileBase(prev);
      const currBase = tileBase(curr);
      if (currBase !== null && currBase === prevBase) {
        run++;
      } else {
        if (run >= 3 && prevBase) {
          const cells: [number, number][] = Array.from({ length: run }, (_, i) => [r, c - run + i]);
          mark(cells, prevBase);
        }
        run = 1;
      }
    }
  }

  // Vertical runs
  for (let c = 0; c < GRID_SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= GRID_SIZE; r++) {
      const prev = r > 0 ? grid[r - 1][c] : null;
      const curr = r < GRID_SIZE ? grid[r][c] : null;
      const prevBase = tileBase(prev);
      const currBase = tileBase(curr);
      if (currBase !== null && currBase === prevBase) {
        run++;
      } else {
        if (run >= 3 && prevBase) {
          const cells: [number, number][] = Array.from({ length: run }, (_, i) => [r - run + i, c]);
          mark(cells, prevBase);
        }
        run = 1;
      }
    }
  }

  return results;
}

// ── Power-up activation effects ────────────────────────────────────────────

// Returns additional cell coordinates to clear when a power-up fires
export function powerUpExtras(
  grid: Grid,
  row: number,
  col: number,
  power: PowerType,
  matchIsHorizontal: boolean,
): [number, number][] {
  const extras: [number, number][] = [];

  if (power === 'line') {
    if (matchIsHorizontal) {
      // Clear entire column
      for (let r = 0; r < GRID_SIZE; r++) extras.push([r, col]);
    } else {
      // Clear entire row
      for (let c = 0; c < GRID_SIZE; c++) extras.push([row, c]);
    }
  } else if (power === 'bomb') {
    const base = tileBase(grid[row][col]);
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (tileBase(grid[r][c]) === base) extras.push([r, c]);
  } else if (power === 'super') {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr, nc = col + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) extras.push([nr, nc]);
      }
  }

  return extras;
}

// ── Grid mutation helpers ──────────────────────────────────────────────────

export function applyGravity(grid: Grid): Grid {
  const next: Grid = grid.map((row) => [...row]);
  for (let c = 0; c < GRID_SIZE; c++) {
    const col = next.map((row) => row[c]).filter(Boolean) as string[];
    while (col.length < GRID_SIZE) col.unshift(randomTileId());
    for (let r = 0; r < GRID_SIZE; r++) next[r][c] = col[r];
  }
  return next;
}

export function clearCells(grid: Grid, keys: Set<string>): Grid {
  const next = grid.map((row) => [...row]);
  for (const key of keys) {
    const [r, c] = key.split(',').map(Number);
    next[r][c] = null;
  }
  return next;
}

export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

export function swapCells(grid: Grid, r1: number, c1: number, r2: number, c2: number): Grid {
  const next = grid.map((row) => [...row]);
  [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
  return next;
}

export const getTileType = (id: string) => {
  const base = tileBase(id) ?? id;
  return TILE_TYPES.find((t) => t.id === base) ?? TILE_TYPES[0];
};

// ── Dead-board detection ───────────────────────────────────────────────────

// Returns true if any horizontal or vertical adjacent swap produces a match.
// Exits early on first valid move found (no need to scan the whole board).
export function hasValidMoves(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) continue;
      // Swap right
      if (c + 1 < GRID_SIZE && grid[r][c + 1]) {
        if (findAllMatches(swapCells(grid, r, c, r, c + 1)).length > 0) return true;
      }
      // Swap down
      if (r + 1 < GRID_SIZE && grid[r + 1]?.[c]) {
        if (findAllMatches(swapCells(grid, r, c, r + 1, c)).length > 0) return true;
      }
    }
  }
  return false;
}

// ── Power-safe reshuffle ───────────────────────────────────────────────────

// Shuffles only normal tiles; power-up tiles stay at their exact positions.
// Retries up to 20 times to guarantee at least one valid move exists.
export function reshuffleBoard(grid: Grid): Grid {
  const powerMap = new Map<string, string>(); // "r,c" → tileId (power tiles, immovable)
  const normalIds: string[] = [];
  const normalPositions: [number, number][] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const id = grid[r][c];
      if (!id) continue;
      if (tilePower(id)) {
        powerMap.set(`${r},${c}`, id);
      } else {
        normalIds.push(id);
        normalPositions.push([r, c]);
      }
    }
  }

  const fisherYates = (arr: string[]): string[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const build = (ids: string[]): Grid => {
    const next: Grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    for (const [key, id] of powerMap) {
      const [r, c] = key.split(',').map(Number);
      next[r][c] = id;
    }
    ids.forEach((id, i) => { next[normalPositions[i][0]][normalPositions[i][1]] = id; });
    return next;
  };

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = build(fisherYates(normalIds));
    if (hasValidMoves(candidate)) return candidate;
  }
  return build(fisherYates(normalIds)); // fallback (edge case: board nearly all power-ups)
}

// ── Hint system ────────────────────────────────────────────────────────────

export interface PossibleMove { r1: number; c1: number; r2: number; c2: number; }

// Returns the best swap the player can make: largest resulting match, with a
// bonus for moves that activate an existing power-up tile.
// Scans the whole board so the hint is genuinely useful, not just the first find.
export function findPossibleMove(grid: Grid): PossibleMove | null {
  let bestMove: PossibleMove | null = null;
  let bestScore = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) continue;

      const trySwap = (r2: number, c2: number) => {
        if (!grid[r2]?.[c2]) return;
        const matches = findAllMatches(swapCells(grid, r, c, r2, c2));
        if (matches.length === 0) return;
        const totalCells = matches.reduce((s, m) => s + m.cells.length, 0);
        const powerBonus = (tilePower(grid[r][c]) ? 10 : 0) + (tilePower(grid[r2][c2]) ? 10 : 0);
        const score = totalCells + powerBonus;
        if (!bestMove || score > bestScore) { bestMove = { r1: r, c1: c, r2, c2 }; bestScore = score; }
      };

      trySwap(r, c + 1); // right
      trySwap(r + 1, c); // down
    }
  }

  return bestMove;
}

// ── Power-up spawn computation ─────────────────────────────────────────────
//
// Single source of truth for deciding what power-up tile spawns and where.
// Called once per processMatches invocation, works identically on player swaps
// and cascades because processMatches is recursive.
//
// Priority (higher rank wins when two rules target the same cell):
//   line (1) < bomb (2) < super (3)
//
// Rules:
//   Straight 4     → line blast at mid-cell
//   Straight 5     → color bomb at mid-cell
//   Straight 6+    → super blast at mid-cell
//   T/L shape      → color bomb at the intersection cell
//   T/L + total≥7  → super blast at intersection cell
export function computeSpawns(matches: MatchResult[], grid: Grid): Map<string, string> {
  const rank: Record<PowerType, number> = { line: 1, bomb: 2, super: 3 };
  const spawns = new Map<string, string>(); // "r,c" → encoded tileId

  const setIfStronger = (r: number, c: number, power: PowerType) => {
    const id = grid[r]?.[c];
    if (!id) return;
    const base = tileBase(id) ?? id;
    const key = `${r},${c}`;
    const existing = spawns.get(key);
    const existingRank = existing ? (rank[tilePower(existing) ?? 'line'] ?? 0) : 0;
    if (rank[power] > existingRank) spawns.set(key, makePowerTile(power, base));
  };

  // Phase 1 — straight-line power-ups
  for (const match of matches) {
    const n = match.cells.length;
    if (n < 4) continue;
    const [mr, mc] = match.cells[Math.floor((n - 1) / 2)];
    setIfStronger(mr, mc, n >= 6 ? 'super' : n >= 5 ? 'bomb' : 'line');
  }

  // Phase 2 — T/L shape detection
  // A cell is a T/L intersection when it appears in both a horizontal match
  // and a vertical match. findAllMatches always produces axis-aligned runs, so
  // orientation is determined by whether the first and last cell share a row
  // (horizontal) or a column (vertical).
  const isH = (m: MatchResult) =>
    m.cells.length > 1 && m.cells[0][0] === m.cells[m.cells.length - 1][0];
  const isV = (m: MatchResult) =>
    m.cells.length > 1 && m.cells[0][1] === m.cells[m.cells.length - 1][1];

  // Build cell → match list index
  const cellMap = new Map<string, MatchResult[]>();
  for (const m of matches) {
    for (const [r, c] of m.cells) {
      const key = `${r},${c}`;
      const arr = cellMap.get(key) ?? [];
      arr.push(m);
      cellMap.set(key, arr);
    }
  }

  for (const [key, cms] of cellMap) {
    if (cms.length < 2) continue;
    const hm = cms.find(isH);
    const vm = cms.find(isV);
    if (!hm || !vm) continue;
    const [r, c] = key.split(',').map(Number);
    const combined = hm.cells.length + vm.cells.length - 1;
    setIfStronger(r, c, combined >= 7 ? 'super' : 'bomb');
  }

  return spawns;
}
