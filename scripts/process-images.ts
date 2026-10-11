import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SRC = 'lakeside-assets/images';
const OUT = 'public/img';
mkdirSync(OUT, { recursive: true });

type Item = {
  key: string; file: string; slug: string;
  w: number; h: number; aspect: number;
  origKB: number; webpKB: number; smallKB: number;
  orientation: 'landscape' | 'portrait' | 'square' | 'panorama';
  alt: string;
};

// Short descriptive alt text derived from manifest names (human review TODO)
const ALT_HINTS: Record<string, string> = {
  'LS-001': 'The Lakeside logo',
  'LS-003': 'The Lakeside awards',
  'LS-016': 'The Lakeside venue overview with lake and trees',
  'LS-048': 'Glass House chapel exterior',
  'LS-054': 'Walkway to the Glass Chapel',
  'LS-055': 'Private game reserve style grounds',
  'LS-067': 'Glass House chapel interior',
  'LS-071': 'White Marble Reception hall',
  'LS-072': 'Reception hall panoramic view',
};

async function main() {
  const items: Item[] = [];
  for (const f of readdirSync(SRC)) {
    const p = join(SRC, f);
    if (!statSync(p).isFile()) continue;
    const key = f.slice(0, 6); // LS-001
    if (!key.startsWith('LS-')) continue;
    try {
      const meta = await sharp(p).metadata();
      if (!meta.width || !meta.height) continue;
      const origKB = Math.round(statSync(p).size / 1024);
      const slug = key;
      const webpPath = join(OUT, `${slug}.webp`);
      const smallPath = join(OUT, `${slug}-s.webp`);
      const blurPath = join(OUT, `${slug}-blur.webp`);

      // main: max 1600 wide
      let pipeline = sharp(p).rotate();
      if (meta.width > 1600) pipeline = pipeline.resize({ width: 1600, withoutEnlargement: true });
      await pipeline.webp({ quality: 82 }).toFile(webpPath);
      // small: 800
      await sharp(p).rotate().resize({ width: 800, withoutEnlargement: true }).webp({ quality: 78 }).toFile(smallPath);
      // blur: 24px
      await sharp(p).rotate().resize({ width: 24 }).webp({ quality: 40 }).toFile(blurPath);

      const webpKB = Math.round(statSync(webpPath).size / 1024);
      const smallKB = Math.round(statSync(smallPath).size / 1024);
      const aspect = meta.width / meta.height;
      const orientation = aspect > 2 ? 'panorama' : aspect > 1.05 ? 'landscape' : aspect > 0.95 ? 'square' : 'portrait';

      items.push({
        key, file: f, slug, w: meta.width, h: meta.height,
        aspect: Math.round(aspect * 100) / 100,
        origKB, webpKB, smallKB, orientation,
        alt: ALT_HINTS[key] ?? '',
      });
    } catch (e) { /* skip non-images */ }
  }
  items.sort((a, b) => a.key.localeCompare(b.key));
  writeFileSync('src/content/image-manifest.json', JSON.stringify(items, null, 2));
  const totalKB = items.reduce((s, i) => s + i.webpKB, 0);
  console.log(`Processed ${items.length} images. Total webp: ${Math.round(totalKB / 1024)}MB`);
  console.log('Panoramas/landscape >= 1200px (hero candidates):');
  items.filter(i => i.orientation !== 'portrait' && i.w >= 1200).slice(0, 40).forEach(i =>
    console.log(`  ${i.key} ${i.w}x${i.h} ${i.webpKB}KB ${i.alt || i.file.slice(7)}`));
}
main();
