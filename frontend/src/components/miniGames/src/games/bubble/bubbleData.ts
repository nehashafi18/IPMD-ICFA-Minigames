import { ART_STYLES } from '../../systems/artStyles';

export const BUBBLE_TYPES = ART_STYLES.map((s) => ({
  id: s.id,
  emoji: s.emoji,
  primary: s.primary,
  secondary: s.secondary ?? s.gradient[1],
  glow: s.glow,
  gradient: s.gradient,
}));

export const BUBBLE_RADIUS = 22;
export const COLS = 11;
export const ROWS_VISIBLE = 10;
export const ROWS_TOTAL = 14;

export interface BubbleCell {
  id: string;
  typeId: string;
  row: number;
  col: number;
  x: number;
  y: number;
}

export function cellToXY(row: number, col: number, r = BUBBLE_RADIUS): { x: number; y: number } {
  const offsetX = row % 2 === 1 ? r : 0;
  return {
    x: col * r * 2 + r + offsetX,
    y: row * r * Math.sqrt(3),
  };
}

let cellId = 0;

export function buildInitialGrid(): BubbleCell[] {
  const cells: BubbleCell[] = [];
  for (let row = 0; row < 5; row++) {
    const cols = row % 2 === 0 ? COLS : COLS - 1;
    for (let col = 0; col < cols; col++) {
      const typeId = BUBBLE_TYPES[Math.floor(Math.random() * 5)].id;
      const { x, y } = cellToXY(row, col);
      cells.push({ id: `cell-${++cellId}`, typeId, row, col, x, y });
    }
  }
  return cells;
}

export function randomBubbleType(): string {
  return BUBBLE_TYPES[Math.floor(Math.random() * 5)].id;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// Exact hex topology: returns grid cells that occupy the 6 adjacent hex slots.
// Even rows have no x-offset; odd rows are shifted right by BUBBLE_RADIUS.
// Cross-row neighbors differ by column depending on the current row's parity.
function getHexNeighbors(grid: BubbleCell[], cell: BubbleCell): BubbleCell[] {
  const { row, col } = cell;
  const even = row % 2 === 0;
  const candidates: [number, number][] = [
    [row, col - 1],
    [row, col + 1],
    ...(even
      ? ([[row - 1, col - 1], [row - 1, col], [row + 1, col - 1], [row + 1, col]] as [number, number][])
      : ([[row - 1, col], [row - 1, col + 1], [row + 1, col], [row + 1, col + 1]] as [number, number][])),
  ];
  return grid.filter((c) =>
    c.id !== cell.id && candidates.some(([r, co]) => c.row === r && c.col === co),
  );
}

// BFS from startId — type is locked to start.typeId at entry; never re-read
// from intermediate cells so there is zero risk of type drift through the BFS.
export function findConnected(grid: BubbleCell[], startId: string): Set<string> {
  const start = grid.find((c) => c.id === startId);
  if (!start) return new Set();
  const targetType = start.typeId;
  // Mark on discovery (not on dequeue) so no cell enters the queue twice.
  const inCluster = new Set<string>([startId]);
  const queue: BubbleCell[] = [start];
  while (queue.length) {
    const cell = queue.shift()!;
    // Belt-and-suspenders: reject any cell whose type deviates from targetType.
    if (cell.typeId !== targetType) continue;
    for (const n of getHexNeighbors(grid, cell)) {
      if (n.typeId === targetType && !inCluster.has(n.id)) {
        inCluster.add(n.id);
        queue.push(n);
      }
    }
  }
  return inCluster;
}

// Scans the entire board for same-type clusters of size >= minMatch.
//
// KEY CORRECTNESS PROPERTY: every BFS gets its own fresh `seen` set.
// A shared visited set across iterations would allow marks from one cluster's
// traversal to block cells from being discovered in a later, different-type
// cluster — potentially causing incorrect omission or type confusion.
// Using a separate `seenAsStarter` set (for deduplicating outer-loop starts)
// and a fresh `seen` per BFS is the only safe approach.
export function findAllClusters(grid: BubbleCell[], minMatch = 3): Set<string> {
  const toRemove = new Set<string>();
  // Tracks which cells have already been claimed by a completed BFS so they
  // are not used as a start node again — separate from any per-BFS visited set.
  const claimed = new Set<string>();

  for (const start of grid) {
    if (claimed.has(start.id)) continue;

    const targetType = start.typeId;
    // Fresh set for this BFS only — no state leaks from any other iteration.
    const seen = new Set<string>([start.id]);
    const cluster: BubbleCell[] = [start];
    const queue: BubbleCell[] = [start];

    while (queue.length) {
      const cell = queue.shift()!;
      // Belt-and-suspenders: skip any cell whose type differs from targetType.
      // Under correct execution this never fires, but it guarantees isolation.
      if (cell.typeId !== targetType) continue;
      for (const n of getHexNeighbors(grid, cell)) {
        if (n.typeId === targetType && !seen.has(n.id)) {
          seen.add(n.id);
          cluster.push(n);
          queue.push(n);
        }
      }
    }

    // Claim every member so they are never re-evaluated as a start node.
    for (const c of cluster) claimed.add(c.id);

    if (cluster.length >= minMatch) {
      for (const c of cluster) toRemove.add(c.id);
    }
  }

  return toRemove;
}

// BFS from top row — anything not reachable by physical adjacency is floating.
export function findFloating(grid: BubbleCell[]): Set<string> {
  const topRow = grid.filter((c) => c.row === 0);
  const visited = new Set<string>(topRow.map((c) => c.id));
  const queue: BubbleCell[] = [...topRow];
  while (queue.length) {
    const cell = queue.shift()!;
    for (const n of getHexNeighbors(grid, cell)) {
      if (!visited.has(n.id)) { visited.add(n.id); queue.push(n); }
    }
  }
  const floating = new Set<string>();
  for (const c of grid) { if (!visited.has(c.id)) floating.add(c.id); }
  return floating;
}

export const getBubbleType = (id: string) => BUBBLE_TYPES.find((t) => t.id === id) ?? BUBBLE_TYPES[0];
