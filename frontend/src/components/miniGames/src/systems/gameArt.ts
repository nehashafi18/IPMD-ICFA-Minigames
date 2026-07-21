// Generated fine-art assets produced by scripts/generate-game-art.mjs.
// Paths are served from frontend/public/games/** at runtime.

export type ArtStyleId =
  | 'watercolor'
  | 'sparkles'
  | 'colored-pencil'
  | 'soft-pastel'
  | 'ink-wash'
  | 'oil-paint'
  | 'cloud-softness'
  | 'glitter';

export const ART_STYLE_IMAGES: Record<ArtStyleId, string> = {
  'watercolor': '/games/art-styles/watercolor.png',
  'sparkles': '/games/art-styles/sparkles.png',
  'colored-pencil': '/games/art-styles/colored-pencil.png',
  'soft-pastel': '/games/art-styles/soft-pastel.png',
  'ink-wash': '/games/art-styles/ink-wash.png',
  'oil-paint': '/games/art-styles/oil-paint.png',
  'cloud-softness': '/games/art-styles/cloud-softness.png',
  'glitter': '/games/art-styles/glitter.png',
};

export type PowerUpId = 'line' | 'bomb' | 'super';

export const POWER_UP_IMAGES: Record<PowerUpId, string> = {
  line: '/games/power-ups/line.png',
  bomb: '/games/power-ups/bomb.png',
  super: '/games/power-ups/super.png',
};

// Simple, clearly identifiable subjects — easy to recognise for all players.
const MEMORY_SUBJECTS = [
  'cat', 'dog', 'bird', 'fish', 'butterfly',
  'apple', 'strawberry', 'watermelon', 'banana', 'orange',
  'flower', 'tree', 'leaf', 'mushroom', 'cactus',
  'star', 'moon', 'sun', 'rainbow', 'heart',
] as const;

export interface MemorySceneMeta {
  id: string;
  name: string;
  image: string;
}

export const MEMORY_SCENES: MemorySceneMeta[] = MEMORY_SUBJECTS.map((subject) => ({
  id: subject,
  name: subject.charAt(0).toUpperCase() + subject.slice(1),
  image: `/games/memory/${subject}.png`,
}));

export const MEMORY_IMAGES: Record<string, string> = MEMORY_SCENES.reduce(
  (acc, scene) => ({ ...acc, [scene.id]: scene.image }),
  {} as Record<string, string>,
);

export const TRANSITION_BACKDROPS: string[] = [
  '/games/transition/scene-1.png',
  '/games/transition/scene-2.png',
  '/games/transition/scene-3.png',
];

export type DetectiveSceneId = 'garden' | 'gallery' | 'market' | 'museum';

export const DETECTIVE_SCENE_IMAGES: Record<DetectiveSceneId, string> = {
  garden:  '/games/art-detective/garden.png',
  gallery: '/games/art-detective/gallery.png',
  market:  '/games/art-detective/market.png',
  museum:  '/games/art-detective/museum.png',
};
