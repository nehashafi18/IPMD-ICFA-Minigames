export type InteractionType =
  | 'color-warm' | 'color-cool' | 'brightness-up' | 'brightness-down'
  | 'saturation-up' | 'saturation-down'
  | 'sound-rain' | 'sound-ocean' | 'sound-forest' | 'sound-wind'
  | 'sound-calm' | 'sound-energetic' | 'sound-heartbeat' | 'sound-off'
  | 'visual-stars' | 'visual-sun' | 'visual-clouds' | 'visual-flowers'
  | 'visual-orbs' | 'visual-butterflies'
  | 'speed-slower' | 'speed-faster'
  | 'wind-more' | 'wind-less'
  | 'breathing';

interface Message { text: string; emoji: string; }

const RESPONSES: Partial<Record<InteractionType, Message[]>> = {
  'color-warm': [
    { text: 'The scene just got a little warmer.', emoji: '🌅' },
    { text: 'Warm colors can feel like a cozy blanket.', emoji: '🧡' },
  ],
  'color-cool': [
    { text: 'Cool tones can feel calm and spacious.', emoji: '🌊' },
    { text: 'The world feels a bit cooler now.', emoji: '💙' },
  ],
  'brightness-up': [
    { text: 'You made the world brighter.', emoji: '✨' },
    { text: 'More light came in.', emoji: '☀️' },
  ],
  'brightness-down': [
    { text: 'Things feel a little quieter now.', emoji: '🌙' },
    { text: 'You dimmed the light — it feels softer.', emoji: '🕯️' },
  ],
  'sound-rain': [
    { text: 'Rain sounds make the world feel quieter and thoughtful.', emoji: '🌧️' },
  ],
  'sound-ocean': [
    { text: 'Ocean waves have a steady, calming rhythm.', emoji: '🌊' },
  ],
  'sound-forest': [
    { text: 'Nature sounds can help the mind feel less busy.', emoji: '🌿' },
  ],
  'sound-calm': [
    { text: 'Gentle music can help feelings settle.', emoji: '🎵' },
  ],
  'sound-energetic': [
    { text: 'You picked something lively — the world feels more awake.', emoji: '⚡' },
  ],
  'sound-heartbeat': [
    { text: 'A heartbeat rhythm can feel grounding.', emoji: '💓' },
  ],
  'visual-stars': [
    { text: 'Stars appeared in your world.', emoji: '✦' },
  ],
  'visual-sun': [
    { text: 'You brought sunlight into the scene.', emoji: '☀️' },
    { text: 'Light is coming through.', emoji: '🌤' },
  ],
  'visual-flowers': [
    { text: 'Things are growing in your world.', emoji: '🌸' },
  ],
  'visual-butterflies': [
    { text: 'Butterflies arrived.', emoji: '🦋' },
  ],
  'visual-orbs': [
    { text: 'Glowing lights appeared.', emoji: '✦' },
  ],
  'speed-slower': [
    { text: 'Everything slowed down. Notice how that feels.', emoji: '🌀' },
    { text: 'The pace changed — things feel calmer.', emoji: '🍃' },
  ],
  'speed-faster': [
    { text: 'The energy picked up a little.', emoji: '💫' },
  ],
  'breathing': [
    { text: 'Breathing exercises help the body feel safer.', emoji: '🫁' },
    { text: 'Nice. You tried the breathing guide.', emoji: '🌬️' },
  ],
};

const GENERIC: Message[] = [
  { text: 'You changed your world.', emoji: '🌍' },
  { text: 'You\'re exploring what feels right.', emoji: '🔍' },
  { text: 'Notice how the scene responds.', emoji: '👁️' },
  { text: 'There\'s no wrong choice here.', emoji: '💜' },
];

const REPEATED: Message = {
  text: 'You keep coming back to this. Notice what draws you.',
  emoji: '🔄',
};

export class EmotionAdapter {
  private history: InteractionType[] = [];
  private counts: Partial<Record<InteractionType, number>> = {};
  private lastMessage = '';

  record(type: InteractionType): Message | null {
    this.counts[type] = (this.counts[type] ?? 0) + 1;
    this.history.push(type);

    if ((this.counts[type] ?? 0) >= 3) return REPEATED;

    const pool = RESPONSES[type] ?? GENERIC;
    const candidates = pool.filter((m) => m.text !== this.lastMessage);
    const msg = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
    this.lastMessage = msg.text;
    return msg;
  }

  getSummary(): string {
    const usedSounds  = this.history.some((h) => h.startsWith('sound-'));
    const usedColors  = this.history.some((h) => h.startsWith('color-') || h.startsWith('brightness-'));
    const usedBreath  = this.history.includes('breathing');
    const usedSlower  = this.history.includes('speed-slower');
    const usedVisuals = this.history.some((h) => h.startsWith('visual-'));

    const parts: string[] = [];
    if (usedColors)  parts.push('experimenting with color');
    if (usedSounds)  parts.push('exploring sounds');
    if (usedVisuals) parts.push('adding to your scene');
    if (usedSlower)  parts.push('slowing things down');
    if (usedBreath)  parts.push('trying the breathing guide');

    if (parts.length === 0) return 'You spent time with your feelings today.';
    if (parts.length === 1) return `You spent time ${parts[0]}.`;
    const last = parts.pop();
    return `You spent time ${parts.join(', ')} and ${last}.`;
  }

  reset() {
    this.history = [];
    this.counts  = {};
    this.lastMessage = '';
  }
}
