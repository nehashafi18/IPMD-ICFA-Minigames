/**
 * Generates Art Detective scene images via the Stable Diffusion backend.
 *
 * Generates at 768×512 with 40 inference steps, then upscales 2× with LANCZOS
 * to 1536×1024 for crisp full-screen display without pixelation.
 *
 * Usage:  node scripts/generate-detective-art.mjs
 *         SD_URL=http://localhost:8000 node scripts/generate-detective-art.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = path.join(__dirname, '../public/games/art-detective');
const SD_BASE   = (process.env.SD_URL ?? 'http://localhost:8000');
const GENERATE  = `${SD_BASE}/generate-text-to-image`;

fs.mkdirSync(OUT_DIR, { recursive: true });

// Spot-the-difference / I Spy scholastic illustration style prompts
// Each scene is richly detailed, with clearly hidden target items embedded naturally.
const SCENES = [
  {
    name: 'garden',
    // Level 1 — Easy: large butterflies hidden among flowers
    prompt: [
      'spot the difference activity book illustration, enchanted magical garden scene,',
      'colorful rose bushes tulip beds sunflower fields, stone fountain with lily pads,',
      'oak trees with red apples, winding cobblestone path, garden gate with vines,',
      'mushrooms toadstools, garden lanterns, bird bath, watering cans and flower pots,',
      'three large colorful butterflies with patterned wings resting on flowers,',
      'ladybugs bumblebees dragonflies visible throughout,',
      'golden afternoon light with soft shadows,',
      'flat cartoon illustration style, Highlights magazine hidden pictures, I Spy book art style,',
      'bold clean outlines, vivid saturated colors, intricate detailed scene,',
      'children\'s activity book illustration, professional quality, wide landscape composition',
    ].join(' '),
    negative_prompt: [
      'realistic, photorealistic, 3d render, painting texture, oil painting,',
      'watercolor wash, blurry, low quality, grainy, pixelated, noisy,',
      'dark, gloomy, horror, text, watermark, signature, logo, cropped,',
      'deformed, bad anatomy, ugly, distorted, abstract',
    ].join(' '),
  },
  {
    name: 'gallery',
    // Level 2 — Medium: 4 warm-coloured paintings among cool ones
    prompt: [
      'spot the difference activity book illustration, grand classical art museum gallery interior,',
      'tall cream walls with ornate crown molding, hardwood parquet floor,',
      'eight paintings in elaborate gilded frames on the walls,',
      'four paintings showing warm scenes (glowing sunset, orange autumn forest, red poppies, golden desert),',
      'four paintings showing cool scenes (blue ocean, snowy mountains, green forest, purple twilight),',
      'marble columns, chandelier with candles, velvet rope barriers, museum bench in center,',
      'potted plants in corners, bronze sculptures on pedestals, framed medallions on walls,',
      'spot the warm paintings hidden among the cool ones,',
      'flat cartoon illustration style, Highlights magazine hidden pictures, I Spy book art style,',
      'bold clean outlines, vivid saturated colors, intricate detailed scene,',
      'children\'s activity book illustration, professional quality, wide landscape composition',
    ].join(' '),
    negative_prompt: [
      'realistic, photorealistic, 3d render, blurry, low quality, grainy, pixelated, noisy,',
      'dark, gloomy, horror, text, watermark, signature, logo, cropped,',
      'deformed, bad anatomy, ugly, distorted, abstract',
    ].join(' '),
  },
  {
    name: 'market',
    // Level 3 — Hard: 5 cats hiding in a busy night market
    prompt: [
      'spot the difference activity book illustration, vibrant colorful night market scene,',
      'paper lanterns and string lights hanging everywhere, multiple food stalls with striped awnings,',
      'baskets of colorful fruit, steaming noodle pots, sacks of spices, jars of sweets,',
      'five cats cleverly hidden throughout the scene: one under a table, one inside a basket,',
      'one on top of an awning, one between boxes, one peering from behind lanterns,',
      'silhouetted market visitors, cobblestone ground, market bell tower in background,',
      'dark purple night sky with bright moon and twinkling stars,',
      'flat cartoon illustration style, Highlights magazine hidden pictures, I Spy book art style,',
      'bold clean outlines, vivid saturated neon colors, intricate detailed scene,',
      'children\'s activity book illustration, professional quality, wide landscape composition',
    ].join(' '),
    negative_prompt: [
      'realistic, photorealistic, 3d render, blurry, low quality, grainy, pixelated, noisy,',
      'horror, text, watermark, signature, logo, cropped,',
      'deformed, bad anatomy, ugly, distorted, abstract',
    ].join(' '),
  },
  {
    name: 'museum',
    // Level 4 — Expert: 3 circular objects among many square/rectangular items
    prompt: [
      'spot the difference activity book illustration, victorian steampunk museum of wonders interior,',
      'dark wooden shelves packed with artifacts, antique books, glass specimen jars, fossils,',
      'square paintings in rectangular frames on brick walls, rectangular display cases,',
      'three perfectly circular standout objects: large terrestrial globe on brass pedestal (left),',
      'ornate grandfather clock face with roman numerals (center), brass ship porthole window (right),',
      'hourglasses magnifying glasses mechanical gears telescopes sextants scattered around,',
      'amber gas lamp sconces, arched gothic window with moonlight, suits of armor,',
      'shelves of scrolls inkwells quill pens brass instruments,',
      'flat cartoon illustration style, Highlights magazine hidden pictures, I Spy book art style,',
      'bold clean outlines, rich amber teal dark colors, intricate detailed crowded scene,',
      'children\'s activity book illustration, professional quality, wide landscape composition',
    ].join(' '),
    negative_prompt: [
      'realistic, photorealistic, 3d render, blurry, low quality, grainy, pixelated, noisy,',
      'horror, text, watermark, signature, logo, cropped,',
      'deformed, bad anatomy, ugly, distorted, abstract',
    ].join(' '),
  },
];

async function generate(scene) {
  const outPath = path.join(OUT_DIR, `${scene.name}.png`);
  console.log(`\n→ Generating "${scene.name}" …`);
  console.log(`  Prompt length: ${scene.prompt.length} chars`);

  const body = JSON.stringify({
    prompt:              scene.prompt,
    negative_prompt:     scene.negative_prompt,
    width:               768,
    height:              512,
    num_inference_steps: 40,
    guidance_scale:      8.5,
    upscale_factor:      2,    // → 1536×1024 final PNG
  });

  const res = await fetch(GENERATE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SD backend error (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.success) throw new Error(`Generation failed: ${JSON.stringify(data)}`);

  // Fetch the upscaled PNG bytes from the backend's /outputs static route
  const imgUrl = `${SD_BASE}${data.image_url}`;
  const imgRes = await fetch(imgUrl);
  if (!imgRes.ok) throw new Error(`Could not fetch image from ${imgUrl}`);

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  ✓ Saved ${data.width}×${data.height}px → ${outPath}`);
}

async function main() {
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│  Art Detective — scene image generator          │');
  console.log('│  768×512 SD → 1536×1024 LANCZOS upscale        │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log(`SD backend: ${SD_BASE}`);
  console.log(`Output dir: ${OUT_DIR}`);

  // Confirm backend is reachable
  try {
    const ping = await fetch(`${SD_BASE}/`);
    const info = await ping.json();
    console.log(`\n✓ Backend: device=${info.device}  model_loaded=${info.model_loaded}`);
    console.log('  (First generation will load the model — allow 1-2 min on CPU)\n');
  } catch (e) {
    console.error('✗ SD backend unreachable:', e.message);
    console.error(`  Start: cd sd-backend && .venv/bin/uvicorn app:app --port 8000`);
    process.exit(1);
  }

  for (const scene of SCENES) {
    const start = Date.now();
    await generate(scene);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ⏱  ${elapsed}s`);
  }

  console.log('\n✓ All 4 scenes generated.');
  console.log('  Run `npm run build` inside frontend/ to bundle them into the game.\n');
}

main().catch((e) => { console.error('\n✗ Error:', e.message); process.exit(1); });
