/**
 * Image pyramid tile generator.
 *
 * Creates zoom levels from a source image so the frontend can do true deep
 * zoom — each tile is a native-resolution crop, never an upscale.
 *
 * Tile URL scheme: /api/art-detective/tiles/:sceneId/:z/:tx/:ty
 *
 * Coordinate conventions
 * ─────────────────────────────────────────────────────────────────────────────
 * Level Z  :  image is scaled to  W * 2^(Z - maxZoom)  ×  H * 2^(Z - maxZoom)
 *             i.e. maxZoom = native resolution,  Z=0 = smallest thumbnail
 * Tile (tx,ty) covers level pixels  [tx*TILE_SIZE .. (tx+1)*TILE_SIZE - 1]
 */

import fs   from 'fs';
import path from 'path';
// @ts-ignore — sharp ships its own types but tsconfig may not pick them up
import sharp from 'sharp';

export const TILE_SIZE  = 256;
export const PUBLIC_DIR = path.resolve('public');
const DETECTIVE_DIR     = path.join(PUBLIC_DIR, 'detective');

export interface ZoomLevelMeta {
  z:      number;
  width:  number;   // level image width  in pixels
  height: number;   // level image height in pixels
  tilesX: number;
  tilesY: number;
}

export interface TileManifest {
  sceneId:    string;
  width:      number;   // native image width
  height:     number;   // native image height
  tileSize:   number;
  maxZoom:    number;   // index of native-resolution level
  levels:     ZoomLevelMeta[];
}

/**
 * Slice a source image into a tile pyramid and write the manifest.
 * Returns the manifest.
 */
export async function createImagePyramid(
  sourcePath: string,
  sceneId:    string,
): Promise<TileManifest> {
  const tilesDir = path.join(DETECTIVE_DIR, sceneId, 'tiles');
  fs.mkdirSync(tilesDir, { recursive: true });

  const meta   = await (sharp(sourcePath) as any).metadata();
  const origW: number  = meta.width  as number;
  const origH: number  = meta.height as number;

  // Number of levels: 0 = 1-tile thumbnail, maxZoom = native resolution
  const maxDim  = Math.max(origW, origH);
  const maxZoom = Math.max(0, Math.ceil(Math.log2(maxDim / TILE_SIZE)));

  const levels: ZoomLevelMeta[] = [];

  for (let z = 0; z <= maxZoom; z++) {
    const scale  = Math.pow(2, z - maxZoom);   // fraction of native resolution
    const levelW = Math.max(TILE_SIZE, Math.round(origW * scale));
    const levelH = Math.max(TILE_SIZE, Math.round(origH * scale));
    const tilesX = Math.ceil(levelW / TILE_SIZE);
    const tilesY = Math.ceil(levelH / TILE_SIZE);

    const levelDir = path.join(tilesDir, String(z));
    fs.mkdirSync(levelDir, { recursive: true });

    // Resize once, then crop into tiles
    const resized = (sharp(sourcePath) as any).resize(levelW, levelH, { fit: 'fill' });

    for (let tx = 0; tx < tilesX; tx++) {
      for (let ty = 0; ty < tilesY; ty++) {
        const left   = tx * TILE_SIZE;
        const top    = ty * TILE_SIZE;
        const width  = Math.min(TILE_SIZE, levelW - left);
        const height = Math.min(TILE_SIZE, levelH - top);

        await resized
          .clone()
          .extract({ left, top, width, height })
          .jpeg({ quality: 88, progressive: true })
          .toFile(path.join(levelDir, `${tx}_${ty}.jpg`));
      }
    }

    levels.push({ z, width: levelW, height: levelH, tilesX, tilesY });
  }

  const manifest: TileManifest = {
    sceneId, width: origW, height: origH,
    tileSize: TILE_SIZE, maxZoom, levels,
  };

  fs.writeFileSync(
    path.join(DETECTIVE_DIR, sceneId, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );

  return manifest;
}

export function tilePath(sceneId: string, z: number, tx: number, ty: number): string {
  return path.join(DETECTIVE_DIR, sceneId, 'tiles', String(z), `${tx}_${ty}.jpg`);
}

export function manifestPath(sceneId: string): string {
  return path.join(DETECTIVE_DIR, sceneId, 'manifest.json');
}
