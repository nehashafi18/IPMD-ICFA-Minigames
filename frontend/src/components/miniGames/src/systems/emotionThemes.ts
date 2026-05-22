export interface EmotionTheme {
  id: string;
  name: string;
  emoji: string;
  primary: string;
  secondary: string;
  gradient: [string, string];
  glow: string;
  textColor: string;
  particleColor: string;
  animationEnergy: 'gentle' | 'medium' | 'lively';
  soundType: 'chime' | 'soft' | 'sparkle' | 'deep' | 'airy';
  description: string;
}

export const EMOTIONS: EmotionTheme[] = [
  {
    id: 'watercolor-calm',
    name: 'Watercolor Calm',
    emoji: '🎨',
    primary: '#a8d8ea',
    secondary: '#e8b4d8',
    gradient: ['#a8d8ea', '#e8b4d8'],
    glow: 'rgba(168,216,234,0.6)',
    textColor: '#1a3a4a',
    particleColor: '#a8d8ea',
    animationEnergy: 'gentle',
    soundType: 'soft',
    description: 'Flowing blues and pinks, like pigment bleeding into wet paper',
  },
  {
    id: 'sparkle-joy',
    name: 'Sparkle Joy',
    emoji: '✨',
    primary: '#ffd700',
    secondary: '#ffb3e6',
    gradient: ['#ffd700', '#ffb3e6'],
    glow: 'rgba(255,215,0,0.7)',
    textColor: '#4a3000',
    particleColor: '#ffd700',
    animationEnergy: 'lively',
    soundType: 'sparkle',
    description: 'Golden glitter and warm pink light, pure delight',
  },
  {
    id: 'soft-cloud',
    name: 'Soft Cloud',
    emoji: '☁️',
    primary: '#e8eaf6',
    secondary: '#b3c5f5',
    gradient: ['#e8eaf6', '#b3c5f5'],
    glow: 'rgba(232,234,246,0.5)',
    textColor: '#2a3060',
    particleColor: '#c5cef7',
    animationEnergy: 'gentle',
    soundType: 'airy',
    description: 'Soft lavender clouds drifting in a dreamlike sky',
  },
  {
    id: 'deep-navy-sadness',
    name: 'Deep Navy',
    emoji: '🌊',
    primary: '#2c3e7a',
    secondary: '#4a6fa5',
    gradient: ['#1a2356', '#4a6fa5'],
    glow: 'rgba(74,111,165,0.5)',
    textColor: '#c8d8f0',
    particleColor: '#4a6fa5',
    animationEnergy: 'gentle',
    soundType: 'deep',
    description: 'The quiet weight of deep ocean blue — reflective and still',
  },
  {
    id: 'warm-golden-hope',
    name: 'Warm Golden Hope',
    emoji: '🌅',
    primary: '#f4a261',
    secondary: '#e9c46a',
    gradient: ['#f4a261', '#e9c46a'],
    glow: 'rgba(244,162,97,0.6)',
    textColor: '#3a1a00',
    particleColor: '#f4c469',
    animationEnergy: 'medium',
    soundType: 'chime',
    description: 'Amber and gold, the warmth of sunrise and new beginnings',
  },
  {
    id: 'pastel-sadness',
    name: 'Pastel Sadness',
    emoji: '🌸',
    primary: '#c9b1d0',
    secondary: '#a0c4d8',
    gradient: ['#c9b1d0', '#a0c4d8'],
    glow: 'rgba(201,177,208,0.5)',
    textColor: '#2a1a3a',
    particleColor: '#c9b1d0',
    animationEnergy: 'gentle',
    soundType: 'soft',
    description: 'Muted purples and blues, the gentle melancholy of fading petals',
  },
  {
    id: 'ink-wash',
    name: 'Ink Wash',
    emoji: '🖌️',
    primary: '#3d3d4f',
    secondary: '#6b6b8a',
    gradient: ['#1a1a2e', '#6b6b8a'],
    glow: 'rgba(107,107,138,0.5)',
    textColor: '#e0dff0',
    particleColor: '#8080a0',
    animationEnergy: 'medium',
    soundType: 'soft',
    description: 'Monochromatic ink bleeding through rice paper, meditative',
  },
  {
    id: 'rose-love',
    name: 'Rose Love',
    emoji: '🌹',
    primary: '#e8a0b4',
    secondary: '#f5d0dc',
    gradient: ['#e8a0b4', '#f5d0dc'],
    glow: 'rgba(232,160,180,0.6)',
    textColor: '#3a0a1a',
    particleColor: '#e8a0b4',
    animationEnergy: 'medium',
    soundType: 'chime',
    description: 'Soft roses and blush, the tender warmth of love',
  },
];

export const getEmotionById = (id: string) =>
  EMOTIONS.find((e) => e.id === id) ?? EMOTIONS[0];
