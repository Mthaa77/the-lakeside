/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Round 33 — brand asset preparation from the client's official logo.
 * Source: upload/Upgrade_2K_20261013015531.jpg (2048×2048 embossed seal on cream paper)
 *
 * Outputs:
 *   public/brand/lakeside-seal.jpg   960px square, artwork-tight crop + margin (web medallion)
 *   public/brand/icon-32.png         circular alpha favicon
 *   public/brand/icon-180.png        circular alpha apple icon
 *   public/brand/icon-192.png        circular alpha pwa icon
 *   public/brand/icon-512.png        circular alpha pwa icon
 *
 * The artwork bounding box is auto-detected (cream paper vs. inked artwork),
 * squared around its centre with a small margin so the embossed ring is never clipped.
 */
const sharp = require('sharp');

const SRC = 'upload/Upgrade_2K_20261013015531.jpg';
const SCAN = 128; // low-res scan resolution

(async () => {
  // ── 1. Detect artwork bounds at scan resolution ────────────────────────────
  const { data, info } = await sharp(SRC).resize(SCAN, SCAN).raw().toBuffer({ resolveWithObject: true });
  const rows = new Array(SCAN).fill(0);
  const cols = new Array(SCAN).fill(0);
  for (let y = 0; y < SCAN; y++) {
    for (let x = 0; x < SCAN; x++) {
      const i = (y * SCAN + x) * info.channels;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = (r + g + b) / 3;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      // cream paper ≈ lum 225–250 & low sat; artwork = golds (saturated) + greens (dark)
      if (lum < 192 || sat > 0.3) { rows[y]++; cols[x]++; }
    }
  }
  const bounds = (arr) => {
    let lo = 0, hi = arr.length - 1;
    while (lo < arr.length && arr[lo] < 3) lo++;
    while (hi >= 0 && arr[hi] < 3) hi--;
    return [lo, hi];
  };
  const [cx0, cx1] = bounds(cols);
  const [cy0, cy1] = bounds(rows);
  console.log('scan bounds:', { x: [cx0, cx1], y: [cy0, cy1] });

  // Square around the artwork centre (circle → square bbox), then margin.
  const bw = cx1 - cx0 + 1;
  const bh = cy1 - cy0 + 1;
  const side = Math.max(bw, bh);
  const ccx = (cx0 + cx1) / 2;
  const ccy = (cy0 + cy1) / 2;
  const MARGIN = 0.055; // 5.5% cream rim inside the medallion
  const cropSide = side * (1 + MARGIN * 2);

  // Scale to full resolution
  const scale = 2048 / SCAN;
  let size = Math.min(Math.round(cropSide * scale), 2048);
  let left = Math.round(ccx * scale - size / 2);
  let top = Math.round(ccy * scale - size / 2);
  // Clamp to the source frame
  left = Math.max(0, Math.min(left, 2048 - size));
  top = Math.max(0, Math.min(top, 2048 - size));
  console.log('crop:', { left, top, size });

  // ── 2. Web medallion (JPG — CSS rounded-full does the circular crop) ───────
  await sharp(SRC)
    .extract({ left, top, width: size, height: size })
    .resize(960, 960)
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile('public/brand/lakeside-seal.jpg');
  console.log('wrote public/brand/lakeside-seal.jpg');

  // ── 3. Icons — circular alpha mask ──────────────────────────────────────────
  const circleMask = (s) =>
    Buffer.from(
      `<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#fff"/></svg>`
    );
  for (const s of [32, 180, 192, 512]) {
    await sharp(SRC)
      .extract({ left, top, width: size, height: size })
      .resize(s, s)
      .composite([{ input: circleMask(s), blend: 'dest-in' }])
      .png()
      .toFile(`public/brand/icon-${s}.png`);
    console.log(`wrote public/brand/icon-${s}.png`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
