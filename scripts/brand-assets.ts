import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'fs';

// ── Favicon set from the logo (white background plate, padded) ──────────────
async function favicons() {
  const logo = 'lakeside-assets/images/LS-001_the-lakeside-logo.png';
  const meta = await sharp(logo).metadata();
  console.log('logo', meta.width, 'x', meta.height);

  for (const size of [512, 192, 180, 32]) {
    const pad = Math.max(4, Math.round(size * 0.08));
    await sharp(logo)
      .resize({ width: size - pad * 2, fit: 'inside' })
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#F6F3EE' })
      .png()
      .toFile(`public/brand/icon-${size}.png`);
  }
  // favicon.ico-style 32px is served via icon-32.png link rel=icon
  console.log('favicons done');
}

// ── Static OG image 1200x630: hero photo + brand overlay ───────────────────
async function ogImage() {
  const hero = 'lakeside-assets/images/LS-016_our-venue-ls.png';
  const W = 1200, H = 630;

  // Photo cover-crop
  const photo = await sharp(hero)
    .resize(W, H, { fit: 'cover', position: 'attention' })
    .modulate({ brightness: 0.82, saturation: 1.02 })
    .toBuffer();

  // Brand lockup from the logo (contains its own white bg → place as a card)
  const logoPng = await sharp('lakeside-assets/images/LS-001_the-lakeside-logo.png')
    .resize({ width: 420, fit: 'inside' })
    .png()
    .toBuffer();

  const svgOverlay = Buffer.from(`
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#10261E" stop-opacity="0.25"/>
        <stop offset="0.55" stop-color="#10261E" stop-opacity="0.45"/>
        <stop offset="1" stop-color="#10261E" stop-opacity="0.88"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="72" y="${H - 210}" font-family="Georgia, 'Times New Roman', serif" font-size="58" fill="#F6F3EE">Say I do where the glass</text>
    <text x="72" y="${H - 140}" font-family="Georgia, 'Times New Roman', serif" font-size="58" fill="#F6F3EE">meets the lake.</text>
    <text x="72" y="${H - 78}" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="6" fill="#B89B6A">TIEGERPOORT · PRETORIA EAST</text>
    <rect x="72" y="${H - 300}" width="180" height="2" fill="#B89B6A"/>
  </svg>`);

  await sharp(photo)
    .composite([
      { input: svgOverlay, top: 0, left: 0 },
      { input: logoPng, top: 48, left: 72 },
    ])
    .jpeg({ quality: 88 })
    .toFile('public/brand/og.jpg');

  console.log('og.jpg done');
}

(async () => {
  writeFileSync('public/brand/.keep', '');
  await favicons();
  await ogImage();
  console.log('readback', readFileSync('public/brand/og.jpg').length, 'bytes');
})();
