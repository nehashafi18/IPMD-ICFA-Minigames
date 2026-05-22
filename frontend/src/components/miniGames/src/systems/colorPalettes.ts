// Centralized palette system — all colors reference back to an art style ID

export const PALETTE_MAP: Record<string, { bg: string; surface: string; accent: string; muted: string; text: string }> = {
  watercolor:     { bg: '#0d1f2d', surface: 'rgba(168,216,234,0.12)', accent: '#a8d8ea', muted: 'rgba(168,216,234,0.3)', text: '#dff0f8' },
  sparkles:       { bg: '#1a1400', surface: 'rgba(255,215,0,0.1)',    accent: '#ffd700', muted: 'rgba(255,215,0,0.25)',   text: '#fff8d0' },
  'colored-pencil': { bg: '#1a0d0e', surface: 'rgba(255,154,158,0.1)', accent: '#ff9a9e', muted: 'rgba(255,154,158,0.25)', text: '#ffe8ea' },
  'soft-pastel':  { bg: '#160e1f', surface: 'rgba(201,177,208,0.1)', accent: '#c9b1d0', muted: 'rgba(201,177,208,0.25)', text: '#efe0f5' },
  'ink-wash':     { bg: '#0a0a14', surface: 'rgba(107,107,138,0.12)', accent: '#8080a0', muted: 'rgba(107,107,138,0.3)',  text: '#d0d0e8' },
  'oil-paint':    { bg: '#1a0a00', surface: 'rgba(224,123,57,0.1)',  accent: '#e07b39', muted: 'rgba(224,123,57,0.25)',  text: '#fde8d0' },
  'cloud-softness': { bg: '#0e0f1e', surface: 'rgba(197,206,247,0.1)', accent: '#c5cef7', muted: 'rgba(197,206,247,0.25)', text: '#e8ecff' },
  glitter:        { bg: '#160020', surface: 'rgba(224,64,251,0.1)',  accent: '#e040fb', muted: 'rgba(224,64,251,0.25)',  text: '#f8d0ff' },
};

export const DEFAULT_PALETTE = PALETTE_MAP['soft-pastel'];

export const getPalette = (artStyleId: string) =>
  PALETTE_MAP[artStyleId] ?? DEFAULT_PALETTE;

// Returns a CSS linear-gradient string for two colors
export const makeGradient = (a: string, b: string, angle = 135) =>
  `linear-gradient(${angle}deg, ${a}, ${b})`;
