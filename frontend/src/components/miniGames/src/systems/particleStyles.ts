export interface ParticleConfig {
  id: string;
  color: string;
  secondaryColor: string;
  count: number;
  size: [number, number];     // [min, max] px
  speed: [number, number];    // [min, max] px/frame
  lifetime: [number, number]; // [min, max] ms
  shape: 'circle' | 'star' | 'sparkle' | 'blob' | 'dot';
  gravity: number;            // 0 = float, positive = fall
  spread: number;             // radial spread in degrees
  fade: boolean;
  scale: boolean;             // grow then shrink
  rotate: boolean;
}

export const PARTICLE_CONFIGS: Record<string, ParticleConfig> = {
  watercolor: {
    id: 'watercolor',
    color: '#a8d8ea',
    secondaryColor: '#f7cac9',
    count: 12,
    size: [8, 20],
    speed: [0.5, 1.5],
    lifetime: [1200, 2000],
    shape: 'blob',
    gravity: -0.02,
    spread: 360,
    fade: true,
    scale: true,
    rotate: false,
  },
  sparkles: {
    id: 'sparkles',
    color: '#ffd700',
    secondaryColor: '#fff9c4',
    count: 20,
    size: [4, 12],
    speed: [1, 3],
    lifetime: [800, 1400],
    shape: 'sparkle',
    gravity: 0.05,
    spread: 360,
    fade: true,
    scale: true,
    rotate: true,
  },
  'colored-pencil': {
    id: 'colored-pencil',
    color: '#ff9a9e',
    secondaryColor: '#fad0c4',
    count: 10,
    size: [6, 14],
    speed: [0.8, 2],
    lifetime: [1000, 1600],
    shape: 'dot',
    gravity: 0.03,
    spread: 180,
    fade: true,
    scale: false,
    rotate: false,
  },
  'soft-pastel': {
    id: 'soft-pastel',
    color: '#c9b1d0',
    secondaryColor: '#b5d5e8',
    count: 15,
    size: [6, 16],
    speed: [0.4, 1.2],
    lifetime: [1400, 2200],
    shape: 'circle',
    gravity: -0.01,
    spread: 360,
    fade: true,
    scale: true,
    rotate: false,
  },
  'ink-wash': {
    id: 'ink-wash',
    color: '#6b6b8a',
    secondaryColor: '#3d3d4f',
    count: 8,
    size: [10, 24],
    speed: [0.3, 1.0],
    lifetime: [1600, 2600],
    shape: 'blob',
    gravity: 0.01,
    spread: 120,
    fade: true,
    scale: true,
    rotate: false,
  },
  glitter: {
    id: 'glitter',
    color: '#e040fb',
    secondaryColor: '#ffd700',
    count: 30,
    size: [3, 8],
    speed: [1.5, 4],
    lifetime: [600, 1200],
    shape: 'star',
    gravity: 0.08,
    spread: 360,
    fade: true,
    scale: true,
    rotate: true,
  },
  'cloud-softness': {
    id: 'cloud-softness',
    color: '#e8eaf6',
    secondaryColor: '#c5cef7',
    count: 8,
    size: [12, 30],
    speed: [0.2, 0.8],
    lifetime: [2000, 3500],
    shape: 'circle',
    gravity: -0.03,
    spread: 360,
    fade: true,
    scale: true,
    rotate: false,
  },
};

export const getParticleConfig = (artStyleId: string): ParticleConfig =>
  PARTICLE_CONFIGS[artStyleId] ?? PARTICLE_CONFIGS['soft-pastel'];
