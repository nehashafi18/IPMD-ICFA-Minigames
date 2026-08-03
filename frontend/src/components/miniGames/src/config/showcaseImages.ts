// Auto-discovers every image in  frontend/src/assets/new-showcase/
// Drop files there with ANY filename — no renaming needed.
// Captions are derived from filenames (hyphens/underscores → spaces).

export interface ShowcaseImage {
  src: string;
  caption: string;
}

function toCaption(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/^\d+\s*/, '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Artwork';
}

const _modules = import.meta.glob<{ default: string }>(
  '../../../../assets/new-showcase/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true },
);

export const SHOWCASE_IMAGES: ShowcaseImage[] = Object.entries(_modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod]) => ({
    src:     mod.default,
    caption: toCaption(path.split('/').pop() ?? ''),
  }));
