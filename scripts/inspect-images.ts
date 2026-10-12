/**
 * THE LAKESIDE — image inventory & hero-candidate audit.
 *
 * Prints width, height and file size for every image in /public/img and
 * flags anything narrower than 1600px (unfit for full-bleed hero use).
 * Hero candidates are images >= 2400px wide, landscape, in /img (not -s/-blur).
 *
 * Run: bun run scripts/inspect-images.ts
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const DIR = join(process.cwd(), 'public', 'img');
const HERO_MIN_FULL = 1600; // px — minimum for full-bleed hero duty
const HERO_MIN_BEST = 2400; // px — the width the hero deserves

async function main() {
  const files = readdirSync(DIR).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort();
  const rows: { file: string; w: number; h: number; kb: number }[] = [];

  for (const f of files) {
    try {
      const meta = await sharp(join(DIR, f)).metadata();
      rows.push({
        file: f,
        w: meta.width ?? 0,
        h: meta.height ?? 0,
        kb: Math.round(statSync(join(DIR, f)).size / 1024),
      });
    } catch {
      // unreadable — skip
    }
  }

  console.log(`Found ${rows.length} images in /public/img\n`);

  const fullBleed = rows.filter((r) => !r.file.includes('-s.') && !r.file.includes('-blur.'));
  console.log(`Full-size variants: ${fullBleed.length}\n`);

  console.log('— All full-size variants (width x height · KB) —');
  for (const r of fullBleed.sort((a, b) => b.w - a.w)) {
    const flag = r.w < HERO_MIN_FULL ? '  ⚠ <1600' : '';
    console.log(`${String(r.w).padStart(5)}x${String(r.h).padStart(5)}  ${String(r.kb).padStart(5)}KB  ${r.file}${flag}`);
  }

  const narrow = fullBleed.filter((r) => r.w < HERO_MIN_FULL);
  console.log(`\n⚠ Narrower than ${HERO_MIN_FULL}px (not hero-safe): ${narrow.length}`);
  for (const r of narrow) console.log(`   ${r.file} (${r.w}px)`);

  const best = fullBleed.filter((r) => r.w >= HERO_MIN_BEST);
  console.log(`\n★ Hero-worthy (>= ${HERO_MIN_BEST}px wide): ${best.length}`);
  for (const r of best.sort((a, b) => b.w - a.w)) {
    const ar = r.w / r.h;
    console.log(`   ${r.file}  ${r.w}x${r.h}  ar=${ar.toFixed(2)}  ${r.kb}KB${ar >= 1.2 ? '  ✓ landscape' : ''}`);
  }

  const between = fullBleed.filter((r) => r.w >= HERO_MIN_FULL && r.w < HERO_MIN_BEST);
  console.log(`\n= Usable but not ideal (${HERO_MIN_FULL}–${HERO_MIN_BEST - 1}px): ${between.length}`);
  for (const r of between.sort((a, b) => b.w - a.w).slice(0, 12)) {
    console.log(`   ${r.file}  ${r.w}x${r.h}  ${r.kb}KB`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
