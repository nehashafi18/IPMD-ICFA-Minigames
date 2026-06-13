// Converts an emoji character to a Twemoji SVG URL (served from the GitHub
// repo via jsDelivr, which hosts the actual SVG asset files).
// Strips text-variation selectors (U+FE0F / U+FE0E) that Twemoji omits from
// its filenames, but preserves ZWJ (U+200D) and other combiners.
export function emojiUrl(emoji: string): string {
  const codepoints: string[] = [];
  for (let i = 0; i < emoji.length; ) {
    const cp = emoji.codePointAt(i)!;
    if (cp !== 0xFE0F && cp !== 0xFE0E) {
      codepoints.push(cp.toString(16));
    }
    i += cp > 0xFFFF ? 2 : 1;
  }
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints.join('-')}.svg`;
}
