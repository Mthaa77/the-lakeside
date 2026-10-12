/**
 * THE LAKESIDE — OG image builder.
 * Crops the hero poster (LS-016, the estate at dusk) to a real 1200x630
 * /public/og.jpg for WhatsApp/LinkedIn/X previews of the demo.
 *
 * Run: bun run scripts/make-og.ts
 */

import sharp from 'sharp';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'public', 'img', 'LS-016.webp');
const OUT = join(process.cwd(), 'public', 'og.jpg');

const W = 1200;
const H = 630;

async function main() {
  // Cover-crop toward the upper-middle: keeps the chapel and its reflection
  // (the estate signature) in frame at 1.9:1.
  await sharp(SRC)
    .resize(W, H, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 84, progressive: true, mozjpeg: true })
    .toFile(OUT);
  console.log(`og.jpg written: ${W}x${H}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
