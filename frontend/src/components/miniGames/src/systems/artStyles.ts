export interface ArtStyle {
  id: string;
  name: string;
  emoji: string;
  primary: string;
  secondary: string;
  gradient: [string, string];
  glow: string;
  textureClass: string;
  borderStyle: string;
  description: string;
  emotionId: string;
}

export const ART_STYLES: ArtStyle[] = [
  {
    id: 'watercolor',
    name: 'Watercolor',
    emoji: '💧',
    primary: '#a8d8ea',
    secondary: '#f7cac9',
    gradient: ['#a8d8ea', '#f7cac9'],
    glow: 'rgba(168,216,234,0.7)',
    textureClass: 'watercolor',
    borderStyle: 'rounded-3xl border-2 border-blue-200/40',
    description: 'Soft flowing edges, pigment blooms',
    emotionId: 'watercolor-calm',
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    emoji: '✨',
    primary: '#ffd700',
    secondary: '#fff0a0',
    gradient: ['#ffd700', '#fff9c4'],
    glow: 'rgba(255,215,0,0.8)',
    textureClass: 'sparkles',
    borderStyle: 'rounded-2xl border-2 border-yellow-300/50',
    description: 'Glitter, glow, floating light',
    emotionId: 'sparkle-joy',
  },
  {
    id: 'colored-pencil',
    name: 'Colored Pencil',
    emoji: '✏️',
    primary: '#ff9a9e',
    secondary: '#fad0c4',
    gradient: ['#ff9a9e', '#fad0c4'],
    glow: 'rgba(255,154,158,0.6)',
    textureClass: 'colored-pencil',
    borderStyle: 'rounded-xl border-2 border-pink-300/40',
    description: 'Grainy, hand-drawn sketch lines',
    emotionId: 'rose-love',
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel',
    emoji: '🎨',
    primary: '#c9b1d0',
    secondary: '#b5d5e8',
    gradient: ['#c9b1d0', '#b5d5e8'],
    glow: 'rgba(201,177,208,0.6)',
    textureClass: 'soft-pastel',
    borderStyle: 'rounded-3xl border border-purple-200/30',
    description: 'Chalky soft tones, dreamy matte finish',
    emotionId: 'pastel-sadness',
  },
  {
    id: 'ink-wash',
    name: 'Ink Wash',
    emoji: '🖌️',
    primary: '#3d3d4f',
    secondary: '#6b6b8a',
    gradient: ['#2a2a3e', '#6b6b8a'],
    glow: 'rgba(107,107,138,0.6)',
    textureClass: 'ink-wash',
    borderStyle: 'rounded-2xl border border-indigo-400/30',
    description: 'East-Asian ink bleeding into paper',
    emotionId: 'ink-wash',
  },
  {
    id: 'oil-paint',
    name: 'Oil Paint',
    emoji: '🖼️',
    primary: '#e07b39',
    secondary: '#c45c26',
    gradient: ['#e07b39', '#8b3a0f'],
    glow: 'rgba(224,123,57,0.6)',
    textureClass: 'oil-paint',
    borderStyle: 'rounded-xl border-2 border-orange-400/40',
    description: 'Rich impasto strokes, deep warm tones',
    emotionId: 'warm-golden-hope',
  },
  {
    id: 'cloud-softness',
    name: 'Cloud Softness',
    emoji: '☁️',
    primary: '#e8eaf6',
    secondary: '#c5cef7',
    gradient: ['#e8eaf6', '#b3c5f5'],
    glow: 'rgba(197,206,247,0.7)',
    textureClass: 'cloud-softness',
    borderStyle: 'rounded-full border border-blue-200/30',
    description: 'Ethereal, pillowy, barely-there',
    emotionId: 'soft-cloud',
  },
  {
    id: 'glitter',
    name: 'Glitter',
    emoji: '💫',
    primary: '#e040fb',
    secondary: '#ab47bc',
    gradient: ['#e040fb', '#7b1fa2'],
    glow: 'rgba(224,64,251,0.7)',
    textureClass: 'glitter',
    borderStyle: 'rounded-2xl border-2 border-purple-400/50',
    description: 'Iridescent shimmer, prismatic sparkle',
    emotionId: 'sparkle-joy',
  },
];

export const getArtStyleById = (id: string) =>
  ART_STYLES.find((a) => a.id === id) ?? ART_STYLES[0];
