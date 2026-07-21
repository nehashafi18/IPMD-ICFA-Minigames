export type ParticleType =
  | 'sparkles' | 'dots' | 'rain' | 'bubbles' | 'stars'
  | 'leaves' | 'streaks' | 'swirls' | 'fireflies' | 'burst';

export interface EmotionDef {
  id: string;
  label: string;
  definition: string;
  emoji: string;
  cardColor: string;       // gradient start
  cardColorEnd: string;    // gradient end
  textColor: string;
  // Scene properties
  bgGradient: string;
  blobColors: [string, string, string];
  particleType: ParticleType;
  particleColor: string;
  particleSpeed: number;   // 0.1–3.0
  windX: number;           // horizontal drift
  svgElements: string[];   // 'clouds' | 'sun' | 'rain' | 'stars' | 'moon' | 'leaves' | 'sparkles'
  defaultSound: string | null;
}

export const EMOTIONS: EmotionDef[] = [
  {
    id: 'happy',
    label: 'Happy',
    definition: 'When everything feels bright and good inside.',
    emoji: '😊',
    cardColor: '#FFB300', cardColorEnd: '#FF8F00', textColor: '#4A2C00',
    bgGradient: 'radial-gradient(ellipse at 30% 20%, #FFE082 0%, #FFB300 45%, #E65100 100%)',
    blobColors: ['#FFE04488', '#FF980088', '#FFF59D88'],
    particleType: 'sparkles', particleColor: '#FFD700', particleSpeed: 1.3, windX: 0.2,
    svgElements: ['sun', 'sparkles'], defaultSound: null,
  },
  {
    id: 'excited',
    label: 'Excited',
    definition: 'When your body feels buzzy and you can\'t wait for something.',
    emoji: '🤩',
    cardColor: '#F06292', cardColorEnd: '#C2185B', textColor: '#3A0020',
    bgGradient: 'radial-gradient(ellipse at 70% 25%, #F48FB1 0%, #E91E63 40%, #880E4F 100%)',
    blobColors: ['#FF80AB88', '#EA80FC88', '#FF6D0088'],
    particleType: 'burst', particleColor: '#FF4081', particleSpeed: 2.4, windX: 0.5,
    svgElements: ['sparkles'], defaultSound: null,
  },
  {
    id: 'calm',
    label: 'Calm',
    definition: 'When your body feels quiet and your mind feels peaceful.',
    emoji: '😌',
    cardColor: '#26C6DA', cardColorEnd: '#0097A7', textColor: '#002F35',
    bgGradient: 'radial-gradient(ellipse at 50% 35%, #B2EBF2 0%, #00BCD4 40%, #006064 100%)',
    blobColors: ['#80DEEA88', '#00BCD488', '#B2EBF288'],
    particleType: 'bubbles', particleColor: '#80DEEA', particleSpeed: 0.35, windX: 0,
    svgElements: ['stars', 'leaves'], defaultSound: 'ocean',
  },
  {
    id: 'nervous',
    label: 'Nervous',
    definition: 'When something is about to happen and your tummy feels jumpy.',
    emoji: '😬',
    cardColor: '#D4E157', cardColorEnd: '#9E9D24', textColor: '#33310A',
    bgGradient: 'radial-gradient(ellipse at 40% 60%, #F9FBE7 0%, #C6CA53 40%, #827717 100%)',
    blobColors: ['#F0F4C388', '#DCE775AA', '#AFB42BAA'],
    particleType: 'dots', particleColor: '#CDDC39', particleSpeed: 1.9, windX: 0.3,
    svgElements: ['clouds'], defaultSound: null,
  },
  {
    id: 'frustrated',
    label: 'Frustrated',
    definition: 'When something keeps not working no matter how hard you try.',
    emoji: '😤',
    cardColor: '#FF7043', cardColorEnd: '#BF360C', textColor: '#3A0A00',
    bgGradient: 'radial-gradient(ellipse at 60% 20%, #FFCCBC 0%, #FF5722 45%, #BF360C 100%)',
    blobColors: ['#FF8A6588', '#FF572288', '#FFCC8088'],
    particleType: 'streaks', particleColor: '#FF7043', particleSpeed: 2.1, windX: 0.8,
    svgElements: ['clouds'], defaultSound: null,
  },
  {
    id: 'angry',
    label: 'Angry',
    definition: 'When something feels really unfair and you feel hot inside.',
    emoji: '😠',
    cardColor: '#EF5350', cardColorEnd: '#B71C1C', textColor: '#2A0000',
    bgGradient: 'radial-gradient(ellipse at 20% 30%, #EF9A9A 0%, #D32F2F 50%, #4A0000 100%)',
    blobColors: ['#EF535088', '#B71C1C88', '#FF5252AA'],
    particleType: 'burst', particleColor: '#FF1744', particleSpeed: 2.8, windX: 1.2,
    svgElements: ['streaks'], defaultSound: null,
  },
  {
    id: 'sad',
    label: 'Sad',
    definition: 'When something makes your heart feel heavy or hurting.',
    emoji: '😢',
    cardColor: '#5C8FA8', cardColorEnd: '#263238', textColor: '#E8F5FF',
    bgGradient: 'radial-gradient(ellipse at 50% 70%, #B0BEC5 0%, #546E7A 40%, #263238 100%)',
    blobColors: ['#78909C88', '#546E7A88', '#B0BEC588'],
    particleType: 'rain', particleColor: '#90CAF9', particleSpeed: 1.4, windX: 0.1,
    svgElements: ['clouds', 'rain'], defaultSound: 'rain',
  },
  {
    id: 'lonely',
    label: 'Lonely',
    definition: 'When you wish someone was with you but no one is around.',
    emoji: '🥺',
    cardColor: '#8E6DAE', cardColorEnd: '#1A0033', textColor: '#F3E5FF',
    bgGradient: 'radial-gradient(ellipse at 80% 20%, #CE93D8 0%, #6A1B9A 45%, #1A0033 100%)',
    blobColors: ['#CE93D888', '#6A1B9A88', '#4A148C66'],
    particleType: 'stars', particleColor: '#CE93D8', particleSpeed: 0.25, windX: 0,
    svgElements: ['moon', 'stars'], defaultSound: null,
  },
  {
    id: 'tired',
    label: 'Tired',
    definition: 'When your body and brain feel like they need to rest.',
    emoji: '😴',
    cardColor: '#9575CD', cardColorEnd: '#311B92', textColor: '#EDE7F6',
    bgGradient: 'radial-gradient(ellipse at 40% 80%, #D1C4E9 0%, #7E57C2 45%, #311B92 100%)',
    blobColors: ['#B39DDB88', '#7E57C288', '#D1C4E966'],
    particleType: 'leaves', particleColor: '#B39DDB', particleSpeed: 0.3, windX: 0.1,
    svgElements: ['moon', 'leaves'], defaultSound: null,
  },
  {
    id: 'confused',
    label: 'Confused',
    definition: 'When something doesn\'t make sense no matter how you look at it.',
    emoji: '😕',
    cardColor: '#4DB6AC', cardColorEnd: '#5C6BC0', textColor: '#E0F7FA',
    bgGradient: 'radial-gradient(ellipse at 60% 50%, #A5D6A7 0%, #4DB6AC 30%, #5C6BC0 65%, #4A148C 100%)',
    blobColors: ['#80CBC488', '#7986CB88', '#A5D6A788'],
    particleType: 'swirls', particleColor: '#80CBC4', particleSpeed: 1.0, windX: 0.4,
    svgElements: ['clouds', 'stars'], defaultSound: null,
  },
  {
    id: 'worried',
    label: 'Worried',
    definition: 'When your brain keeps thinking something bad might happen.',
    emoji: '😟',
    cardColor: '#78909C', cardColorEnd: '#37474F', textColor: '#ECEFF1',
    bgGradient: 'radial-gradient(ellipse at 30% 40%, #CFD8DC 0%, #607D8B 40%, #37474F 100%)',
    blobColors: ['#90A4AE88', '#607D8B88', '#CFD8DC88'],
    particleType: 'dots', particleColor: '#90A4AE', particleSpeed: 1.6, windX: 0.3,
    svgElements: ['clouds'], defaultSound: null,
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    definition: 'When there is too much happening and it feels like too much to handle.',
    emoji: '😵',
    cardColor: '#455A64', cardColorEnd: '#0D0D0D', textColor: '#ECEFF1',
    bgGradient: 'radial-gradient(ellipse at 50% 50%, #424242 0%, #1A1A2E 50%, #0D0D0D 100%)',
    blobColors: ['#42424288', '#1A237E88', '#21212188'],
    particleType: 'burst', particleColor: '#78909C', particleSpeed: 2.6, windX: 1.0,
    svgElements: ['clouds', 'rain'], defaultSound: null,
  },
  {
    id: 'curious',
    label: 'Curious',
    definition: 'When you really want to know more about something.',
    emoji: '🤔',
    cardColor: '#00ACC1', cardColorEnd: '#4A148C', textColor: '#E0F7FA',
    bgGradient: 'radial-gradient(ellipse at 70% 40%, #80DEEA 0%, #00ACC1 30%, #7B1FA2 80%, #1A0033 100%)',
    blobColors: ['#80DEEA88', '#00BCD488', '#AB47BC88'],
    particleType: 'fireflies', particleColor: '#80DEEA', particleSpeed: 0.9, windX: 0.2,
    svgElements: ['stars', 'sparkles'], defaultSound: null,
  },
];

export const EMOTION_MAP: Record<string, EmotionDef> =
  Object.fromEntries(EMOTIONS.map((e) => [e.id, e]));

export interface BodyZone {
  id: string;
  label: string;
  example: string;
}

export const BODY_ZONES: BodyZone[] = [
  { id: 'head',       label: 'Head',       example: 'Racing thoughts, foggy mind' },
  { id: 'chest',      label: 'Chest',      example: 'Heavy, tight, fluttery' },
  { id: 'stomach',    label: 'Stomach',    example: 'Butterflies, knots, sick' },
  { id: 'hands',      label: 'Hands',      example: 'Tense, shaky, sweaty' },
  { id: 'wholebody',  label: 'Whole body', example: 'Warm all over, completely drained' },
];

export const WHAT_HELPED_OPTIONS = [
  { id: 'colors',    label: 'Colors',    icon: '🎨' },
  { id: 'music',     label: 'Music',     icon: '🎵' },
  { id: 'breathing', label: 'Breathing', icon: '🫁' },
  { id: 'movement',  label: 'Movement',  icon: '💨' },
  { id: 'nature',    label: 'Nature',    icon: '🌿' },
  { id: 'creating',  label: 'Creating',  icon: '✏️' },
];

export type SoundId = 'rain' | 'ocean' | 'forest' | 'wind' | 'calm' | 'energetic' | 'heartbeat';

export const SOUNDS: { id: SoundId; label: string }[] = [
  { id: 'rain',       label: 'Rain' },
  { id: 'ocean',      label: 'Ocean' },
  { id: 'forest',     label: 'Forest' },
  { id: 'wind',       label: 'Wind' },
  { id: 'calm',       label: 'Calm music' },
  { id: 'energetic',  label: 'Energetic' },
  { id: 'heartbeat',  label: 'Heartbeat' },
];

export const VISUAL_ELEMENTS = [
  { id: 'extra-stars',   label: 'Stars',   icon: '✦' },
  { id: 'sunlight',      label: 'Sunlight', icon: '☀' },
  { id: 'extra-clouds',  label: 'Clouds',  icon: '☁' },
  { id: 'flowers',       label: 'Flowers', icon: '❀' },
  { id: 'orbs',          label: 'Glowing orbs', icon: '◎' },
  { id: 'butterflies',   label: 'Butterflies', icon: '❋' },
];
