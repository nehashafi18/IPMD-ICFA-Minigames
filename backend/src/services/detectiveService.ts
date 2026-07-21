/**
 * Art Detective scene generation pipeline.
 *
 * SD generates the ENTIRE scene including the hidden objects.
 * Hidden objects are naturally integrated — camouflaged within the scene.
 * A vision model (Gemini) then locates them and returns pixel bounding boxes.
 *
 * Response shape:
 *   { sceneId, sceneImage, imageWidth, imageHeight, hiddenObjects[], manifest }
 *
 * hiddenObjects use PIXEL coordinates (not normalized) so the frontend can
 * test clicks directly against { x, y, width, height } in image space.
 */

import fs     from 'fs';
import path   from 'path';
import crypto from 'crypto';
import { generateImageFromPrompt }                 from './artService.js';
import { createImagePyramid, TileManifest, PUBLIC_DIR } from './tileService.js';
import { detectObjects, DetectedObject }           from './objectDetectionService.js';

// ── Scene specs ───────────────────────────────────────────────────────────────
export interface HiddenObjectSpec {
  name:        string;   // internal key, matches what Gemini uses as object_id prefix
  displayName: string;   // shown in game UI
}

export interface SceneSpec {
  levelNum:          number;
  scene:             string;
  targetLabel:       string;
  distractorLabels:  string[];
  targetCount:       number;
  hiddenObjectSpecs: HiddenObjectSpec[];
  sdPrompt:          string;
  sdNegativePrompt:  string;
  sdWidth:           number;
  sdHeight:          number;
}

// ── SDXL prompt packs — generated for 1536×1536, DPM++ 2M Karras ─────────────
// Style: magical whimsical storybook illustration · ultra detailed environment art
// · sharp focus · cinematic lighting · clean composition · child-friendly calming visuals

export const SCENE_SPECS: SceneSpec[] = [
  // ── Level 1: The Sunny Garden ───────────────────────────────────────────────
  {
    levelNum:    1,
    scene:       'garden',
    targetLabel: 'orange monarch butterfly camouflaged among flowers',
    distractorLabels: ['blue morpho butterfly', 'bee', 'ladybug'],
    targetCount: 3,
    hiddenObjectSpecs: [
      { name: 'orange_butterfly_1', displayName: 'Orange Butterfly' },
      { name: 'orange_butterfly_2', displayName: 'Orange Butterfly' },
      { name: 'orange_butterfly_3', displayName: 'Orange Butterfly' },
    ],
    sdWidth: 512, sdHeight: 512,
    sdPrompt:
      'magical whimsical storybook illustration, sunlit cottage garden at golden hour, ' +
      'cobblestone winding path through lush layered flower beds, climbing pink roses on a mossy stone arch, ' +
      'tall lavender bushes, white daisies, orange marigold clusters in foreground, ' +
      'three orange monarch butterflies with closed wings resting camouflaged among the marigold blooms ' +
      '— wing patterns echoing the petals so they blend naturally, ' +
      'one perched on a weathered stone wall half-covered in lichen, ' +
      'one folded against a tiger lily stem, one tucked inside a rose cluster, ' +
      'two blue morpho butterflies clearly visible on lavender for contrast, ' +
      'dappled sunbeam shafts through oak leaf canopy overhead, soft green bokeh background, ' +
      'child-friendly calming visuals, ultra detailed petal and wing textures, sharp focus, ' +
      'cinematic warm side lighting, clean rule-of-thirds composition, ' +
      'studio ghibli background art aesthetic, James Gurney botanical naturalism',
    sdNegativePrompt:
      'blurry, low resolution, noisy, distorted objects, extra limbs, text artifacts, watermark, ' +
      'photorealistic DSLR photo, dark tones, horror elements, cluttered chaotic composition, ' +
      'floating UI labels, separate icon overlays, neon colors, modern urban elements, ' +
      'people, animals other than butterflies',
  },

  // ── Level 2: Under the Sea ──────────────────────────────────────────────────
  {
    levelNum:    2,
    scene:       'underwater',
    targetLabel: 'orange starfish camouflaged in reef',
    distractorLabels: ['purple starfish', 'sea anemone', 'colorful fish', 'coral'],
    targetCount: 3,
    hiddenObjectSpecs: [
      { name: 'orange_starfish_1', displayName: 'Starfish' },
      { name: 'orange_starfish_2', displayName: 'Starfish' },
      { name: 'orange_starfish_3', displayName: 'Starfish' },
    ],
    sdWidth: 512, sdHeight: 512,
    sdPrompt:
      'magical whimsical storybook illustration, shallow tropical reef underwater scene, ' +
      'crystal-clear turquoise water with sunbeam caustics rippling across sandy seafloor, ' +
      'vivid brain coral formations in orange-rust tones, fan corals swaying gently, ' +
      'purple sea anemone tentacles, ' +
      'three orange starfish naturally camouflaged — one resting flush on top of matching orange brain coral ' +
      'where its texture merges, one half-buried in the cream sandy bottom with only arm tips showing, ' +
      'one tucked between orange-tipped anemone tentacles barely distinguishable, ' +
      'two purple starfish conspicuously placed on white coral for distraction, ' +
      'colorful clownfish and angelfish swimming mid-frame, green sea grass clumps in foreground, ' +
      'soft volumetric light shafts from above, child-friendly calming visuals, ' +
      'ultra detailed coral and water textures, sharp focus, cinematic underwater caustic lighting, ' +
      'clean open composition, Studio Ghibli Ponyo aesthetic, illustrated nature documentary style',
    sdNegativePrompt:
      'blurry, low resolution, noisy, distorted objects, extra limbs, text artifacts, watermark, ' +
      'dark murky water, sharks, dangerous sea creatures, horror elements, ' +
      'cluttered busy background, floating labels, neon artificial glow, photorealistic photo',
  },

  // ── Level 3: A Day at the Park ─────────────────────────────────────────────
  {
    levelNum:    3,
    scene:       'park',
    targetLabel: 'red balloon partially hidden among other balloons',
    distractorLabels: ['yellow balloon', 'green balloon', 'blue balloon', 'white balloon'],
    targetCount: 3,
    hiddenObjectSpecs: [
      { name: 'red_balloon_1', displayName: 'Red Balloon' },
      { name: 'red_balloon_2', displayName: 'Red Balloon' },
      { name: 'red_balloon_3', displayName: 'Red Balloon' },
    ],
    sdWidth: 512, sdHeight: 512,
    sdPrompt:
      'magical whimsical storybook illustration, sunny city park on a bright afternoon, ' +
      'manicured green lawns, mature oak trees with full leafy canopies, ' +
      'ornate stone fountain in midground, wooden park benches, winding paved footpath, ' +
      'festive atmosphere with multiple balloon bouquets tied to benches and lamp posts ' +
      '— yellow, blue, green, and white balloons prominently floating, ' +
      'three red balloons intentionally less conspicuous: ' +
      'one partially occluded behind an oak trunk, ' +
      'one overlapping with a dark green bush making it harder to spot, ' +
      'one tied low near an orange flower bed where its colour competes with the flowers, ' +
      'no single balloon colour dominating the scene, ' +
      'children silhouettes playing in soft distant background, ' +
      'soft afternoon diffused light, child-friendly calming visuals, ' +
      'ultra detailed foliage and fabric textures, sharp focus foreground elements, ' +
      'cinematic bright flat lighting, clean open-sky composition, ' +
      'Mary Blair Disney concept art style, illustrated storybook aesthetic',
    sdNegativePrompt:
      'blurry, low resolution, noisy, distorted objects, extra limbs, text artifacts, watermark, ' +
      'night scene, dark tones, horror elements, overly cluttered foreground, ' +
      'floating UI icons, realistic photo, purple or pink balloons, balloons clearly labelled',
  },

  // ── Level 4: The Cosy Bedroom ──────────────────────────────────────────────
  {
    levelNum:    4,
    scene:       'bedroom',
    targetLabel: 'small yellow star integrated into room decor pattern',
    distractorLabels: ['moon decoration', 'heart decoration', 'cloud mobile', 'crescent decal'],
    targetCount: 3,
    hiddenObjectSpecs: [
      { name: 'yellow_star_bookshelf', displayName: 'Star (Books)' },
      { name: 'yellow_star_lampshade', displayName: 'Star (Lamp)' },
      { name: 'yellow_star_rug',       displayName: 'Star (Rug)' },
    ],
    sdWidth: 512, sdHeight: 512,
    sdPrompt:
      'magical whimsical storybook illustration, warm cosy children\'s bedroom interior, ' +
      'soft amber lamplight, neatly arranged wooden bookshelf lined with colourful spines, ' +
      'window with layered curtains featuring a subtle floral-and-geometric pattern, ' +
      'a brass bedside lamp with a cream fabric shade, ' +
      'a plush bed with a patchwork quilt and embroidered pillow covers, ' +
      'decorative woven area rug on hardwood floor, ' +
      'three small yellow five-pointed stars naturally integrated into the room decor as design details ' +
      '— one star shape printed into the pattern of one book spine on the shelf, ' +
      'one star subtly embossed into the lampshade fabric weave, ' +
      'one star woven into the geometric rug border pattern so it reads as part of the design, ' +
      'wall decals of crescent moons and hearts as clear distractors, ' +
      'fairy string lights along ceiling, soft plush stuffed animals on shelf, ' +
      'child-friendly calming visuals, ultra detailed textile and wood grain textures, sharp focus, ' +
      'cinematic warm indoor lamplight, clean balanced interior composition, ' +
      'Beatrix Potter illustrated interior style, Quentin Blake whimsical warmth',
    sdNegativePrompt:
      'blurry, low resolution, noisy, distorted objects, extra limbs, text artifacts, watermark, ' +
      'dark horror bedroom, messy cluttered chaos, glowing neon stars, ' +
      'obvious floating star stickers, photorealistic interior photo, people, faces, modern technology',
  },

  // ── Level 5: Stargazing ─────────────────────────────────────────────────────
  {
    levelNum:    5,
    scene:       'space',
    targetLabel: 'faint shooting star streak blending into starfield',
    distractorLabels: ['static star cluster', 'planet', 'nebula cloud', 'galaxy spiral'],
    targetCount: 3,
    hiddenObjectSpecs: [
      { name: 'shooting_star_1', displayName: 'Shooting Star' },
      { name: 'shooting_star_2', displayName: 'Shooting Star' },
      { name: 'shooting_star_3', displayName: 'Shooting Star' },
    ],
    sdWidth: 512, sdHeight: 512,
    sdPrompt:
      'magical whimsical storybook illustration, deep night sky vista seen from a quiet hilltop, ' +
      'ultra detailed cosmic environment art, vast dark midnight-blue and indigo sky ' +
      'filled with dense twinkling starfield, swirling violet-blue nebula cloud in upper quadrant, ' +
      'one large ringed gas planet glowing amber-gold on the right, ' +
      'one smaller cyan planet left of center, thousands of static white pin-point stars at varying brightness levels, ' +
      'three shooting stars subtly hidden within the starfield ' +
      '— their motion trails faint and short, similar luminosity to nearby star clusters, each angled differently: ' +
      'one barely distinguishable horizontal streak through the dense Milky Way band, ' +
      'one slight diagonal near the nebula edge, one short vertical near the planet, ' +
      'trails soft not dramatic so they require searching, ' +
      'silhouetted rolling hills and a single telescope in foreground, no artificial light pollution, ' +
      'child-friendly calming visuals, sharp focus, cinematic deep-space volumetric lighting, ' +
      'clean layered depth composition, Roger Dean cosmic art style, Moebius science fiction illustration influence',
    sdNegativePrompt:
      'blurry, low resolution, noisy, distorted objects, extra limbs, text artifacts, watermark, ' +
      'bright white background, daylight sky, spaceships, astronauts, UFOs, ' +
      'obvious dramatic comet tails, photorealistic NASA photo, horror elements, ' +
      'floating labels, neon oversaturated colours',
  },
];

// ── Result types ──────────────────────────────────────────────────────────────
export interface BoundingBox {
  x:      number;   // left edge in image pixels
  y:      number;   // top  edge in image pixels
  width:  number;   // in image pixels
  height: number;   // in image pixels
}

export interface HiddenObjectResult {
  name:        string;
  displayName: string;
  boundingBox: BoundingBox;
}

export interface GeneratedScene {
  sceneId:       string;
  sceneImage:    string;          // URL: /api/art-detective/scene-image/:sceneId
  imageWidth:    number;
  imageHeight:   number;
  hiddenObjects: HiddenObjectResult[];
  manifest:      TileManifest;    // kept for deep-zoom tile rendering
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DETECTIVE_DIR = path.join(PUBLIC_DIR, 'detective');

/** Convert normalized [0-1] DetectedObject to pixel-coord HiddenObjectResult. */
function toPixelResult(
  obj:     DetectedObject,
  imgW:    number,
  imgH:    number,
  spec:    HiddenObjectSpec,
): HiddenObjectResult {
  return {
    name:        spec.name,
    displayName: spec.displayName,
    boundingBox: {
      x:      Math.round(obj.x * imgW),
      y:      Math.round(obj.y * imgH),
      width:  Math.round(obj.width  * imgW),
      height: Math.round(obj.height * imgH),
    },
  };
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
export async function generateDetectiveScene(levelNum: number): Promise<GeneratedScene> {
  const spec = SCENE_SPECS.find((s) => s.levelNum === levelNum);
  if (!spec) throw new Error(`No scene spec for level ${levelNum}`);

  const sceneId  = `scene-${spec.scene}-${crypto.randomUUID().slice(0, 8)}`;
  const sceneDir = path.join(DETECTIVE_DIR, sceneId);
  fs.mkdirSync(sceneDir, { recursive: true });

  // ── 1. Generate scene image with SD ────────────────────────────────────────
  console.log(`[detective] Generating level ${levelNum} (${spec.scene})…`);
  const relUrl   = await generateImageFromPrompt(
    spec.sdPrompt,
    spec.sdNegativePrompt,
    null,
    spec.sdWidth,
    spec.sdHeight,
    40,               // steps — SDXL pack spec
    7.0,              // cfg_scale
    'DPM++ 2M Karras',
  );

  const srcPath  = path.join(PUBLIC_DIR, relUrl);
  const fullPath = path.join(sceneDir, 'full.jpg');
  fs.copyFileSync(srcPath, fullPath);
  console.log(`[detective] Image saved: ${fullPath}`);

  // Read actual dimensions from file
  let imgW = spec.sdWidth;
  let imgH = spec.sdHeight;
  try {
    // Use sharp if available for accurate dimensions
    const { default: sharp } = await import('sharp');
    const meta = await (sharp(fullPath) as any).metadata();
    imgW = meta.width  ?? imgW;
    imgH = meta.height ?? imgH;
  } catch {
    // sharp not available — use spec dimensions
  }

  // ── 2. Build tile pyramid for deep zoom ────────────────────────────────────
  console.log('[detective] Building tile pyramid…');
  const manifest = await createImagePyramid(fullPath, sceneId);
  console.log(`[detective] Pyramid: ${manifest.levels.length} levels, maxZoom=${manifest.maxZoom}`);

  // ── 3. Detect hidden objects via Gemini vision ─────────────────────────────
  console.log('[detective] Running vision detection…');
  const detected = await detectObjects({
    imagePath:        fullPath,
    targetLabel:      spec.targetLabel,
    distractorLabels: spec.distractorLabels,
  });

  const targets = detected.filter((o) => o.category === 'target');
  console.log(`[detective] Found ${targets.length} / ${spec.targetCount} targets`);

  // Map targets → pixel-coordinate results
  // Pair detected targets with hiddenObjectSpecs in order found
  const hiddenObjects: HiddenObjectResult[] = spec.hiddenObjectSpecs.map((s, i) => {
    if (i < targets.length) {
      return toPixelResult(targets[i], imgW, imgH, s);
    }
    // Fallback: spread remaining specs evenly across the image
    const cols = spec.hiddenObjectSpecs.length;
    const cellW = Math.round(imgW / cols);
    return {
      name:        s.name,
      displayName: s.displayName,
      boundingBox: {
        x:      i * cellW + Math.round(cellW * 0.2),
        y:      Math.round(imgH * 0.25),
        width:  Math.round(cellW * 0.6),
        height: Math.round(imgH * 0.5),
      },
    };
  });

  // Persist objects for rehydration
  fs.writeFileSync(
    path.join(sceneDir, 'objects.json'),
    JSON.stringify({ hiddenObjects, detected }, null, 2),
  );

  return {
    sceneId,
    sceneImage:   `/api/art-detective/scene-image/${sceneId}`,
    imageWidth:   imgW,
    imageHeight:  imgH,
    hiddenObjects,
    manifest,
  };
}
