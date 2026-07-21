export interface FallingBall {
  id: string;
  isRed: boolean;
  x: number;
  y: number;
  baseX: number;   // anchor for sinusoidal paths
  vx: number;      // horizontal drift per tick
  vy: number;      // downward speed per tick
  r: number;
  amplitude: number; // sinusoidal amplitude (0 = none)
  frequency: number;
  phase: number;
  t: number;       // tick counter
}

export const BALL_RADIUS = 36;

// Per-level fall speed (pixels/tick at 60 fps) — slowed for accessibility.
export const LEVEL_VY_BASE  = [0.16, 0.26, 0.38, 0.52];
export const LEVEL_VY_RANGE = [0.04, 0.05, 0.06, 0.08];

export function makeBall(
  id: string,
  isRed: boolean,
  x: number,
  level: number,
): FallingBall {
  const lvl = Math.min(level, 3);
  const vy = LEVEL_VY_BASE[lvl] + Math.random() * LEVEL_VY_RANGE[lvl];
  const vx = level >= 2 ? (Math.random() - 0.5) * 1.4 : 0;
  const amplitude = level >= 3 ? 18 + Math.random() * 30 : 0;
  return {
    id,
    isRed,
    x,
    y: -BALL_RADIUS * 2,
    baseX: x,
    vx,
    vy,
    r: BALL_RADIUS,
    amplitude,
    frequency: 0.022 + Math.random() * 0.018,
    phase: Math.random() * Math.PI * 2,
    t: 0,
  };
}

// Number of balls spawned on a red hit: 1 red + (count-1) blue distractors
export function splitCount(level: number): number {
  return Math.min(1 + level, 4);
}
