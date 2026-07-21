export interface HiddenItem {
  id:       string;
  label:    string;
  assetSrc: string;
  cx:       number;
  cy:       number;
  w:        number;
  h:        number;
  rotation: number;
}

export interface SceneData {
  id:              string;
  levelNum:        number;
  title:           string;
  hint:            string;
  imageSrc:        string;
  imageW:          number;
  imageH:          number;
  timeSeconds:     number;
  difficultyLabel: string;
  difficultyNote:  string;
  items:           HiddenItem[];
}

export const STATIC_SCENES: SceneData[] = [

  // ── Level 1: Enchanted Forest ─────────────────────────────────────────────
  {
    id:              'forest',
    levelNum:        1,
    title:           'The Enchanted Forest',
    hint:            'Look for the brass dial and the glowing lantern.',
    imageSrc:        '/detective/forest.jpg',
    imageW:          1536,
    imageH:          1024,
    timeSeconds:     300,
    difficultyLabel: 'Easy',
    difficultyNote:  'Find 2 objects. Take your time — no rush!',
    items: [
      { id: 'compass_1', label: 'Compass', assetSrc: '/detective/objects/compass.png', cx: 1180, cy: 680, w: 220, h: 220, rotation: 0 },
      { id: 'lantern_1', label: 'Lantern', assetSrc: '/detective/objects/lantern.png', cx:  740, cy: 260, w: 200, h: 260, rotation: 0 },
    ],
  },

  // ── Level 2: Fairy Village ───────────────────────────────────────────────
  {
    id:              'village',
    levelNum:        2,
    title:           'The Fairy Village',
    hint:            'Something glows. Something opens.',
    imageSrc:        '/detective/village.jpg',
    imageW:          1536,
    imageH:          1024,
    timeSeconds:     240,
    difficultyLabel: 'Easy',
    difficultyNote:  'Find 2 objects hidden in the village.',
    items: [
      { id: 'lantern_2', label: 'Lantern', assetSrc: '/detective/objects/lantern.png', cx:  220, cy: 360, w: 180, h: 240, rotation: 0 },
      { id: 'potion_1',  label: 'Potion',  assetSrc: '/detective/objects/potion.png',  cx:  780, cy: 700, w: 180, h: 220, rotation: 0 },
    ],
  },

  // ── Level 3: Enchanted Garden ────────────────────────────────────────────
  {
    id:              'garden',
    levelNum:        3,
    title:           'The Enchanted Garden',
    hint:            'A pocket watch and a butterfly.',
    imageSrc:        '/detective/garden.jpg',
    imageW:          1536,
    imageH:          1024,
    timeSeconds:     240,
    difficultyLabel: 'Medium',
    difficultyNote:  'Find 2 objects in the garden.',
    items: [
      { id: 'watch_1',     label: 'Pocket Watch', assetSrc: '/detective/objects/pocket-watch.png', cx:  480, cy: 820, w: 220, h: 220, rotation: 0 },
      { id: 'butterfly_1', label: 'Butterfly',    assetSrc: '/detective/objects/butterfly.png',    cx: 1040, cy: 440, w: 260, h: 210, rotation: 0 },
    ],
  },

  // ── Level 4: Castle Library ──────────────────────────────────────────────
  {
    id:              'library',
    levelNum:        4,
    title:           'The Castle Library',
    hint:            'A compass and a pocket watch on the shelves.',
    imageSrc:        '/detective/library.jpg',
    imageW:          1536,
    imageH:          1024,
    timeSeconds:     200,
    difficultyLabel: 'Medium',
    difficultyNote:  'Find 2 objects among the books.',
    items: [
      { id: 'compass_2', label: 'Compass',      assetSrc: '/detective/objects/compass.png',      cx:  960, cy: 840, w: 200, h: 200, rotation: 0 },
      { id: 'watch_2',   label: 'Pocket Watch', assetSrc: '/detective/objects/pocket-watch.png', cx:  330, cy: 580, w: 210, h: 210, rotation: 0 },
    ],
  },

  // ── Level 5: Royal Castle Interior ──────────────────────────────────────
  {
    id:              'kingdom',
    levelNum:        5,
    title:           'The Royal Castle Interior',
    hint:            'A compass and a royal seal.',
    imageSrc:        '/detective/kingdom.jpg',
    imageW:          1536,
    imageH:          1024,
    timeSeconds:     180,
    difficultyLabel: 'Medium',
    difficultyNote:  'Find 2 objects in the castle.',
    items: [
      { id: 'compass_k',    label: 'Compass',    assetSrc: '/detective/objects/compass.png',    cx: 1260, cy: 800, w: 180, h: 180, rotation: 0 },
      { id: 'royal_seal_1', label: 'Royal Seal', assetSrc: '/detective/objects/royal-seal.png', cx:  370, cy: 650, w: 180, h: 180, rotation: 0 },
    ],
  },
];
