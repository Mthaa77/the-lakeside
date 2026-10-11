/**
 * One-off: generate the Lakeside hero loop video.
 * First-last frame mode — the SAME dusk estate frame (LS-016.webp) is used as
 * both the opening and closing frame, so the 10s clip loops seamlessly.
 * Run from the project root:  bun scripts/gen-hero-video.ts
 */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'node:fs';

const FRAME = '/home/z/my-project/public/img/LS-016.webp';
const OUT = '/home/z/my-project/.video-task.json';

const dataUri = `data:image/webp;base64,${fs.readFileSync(FRAME).toString('base64')}`;

const zai = await ZAI.create();

const task = await zai.video.generations.create({
  image_url: [dataUri, dataUri],
  prompt: [
    'Cinematic live establishing shot of a lakeside wedding estate at dusk, exactly matching the provided frame.',
    'The camera drifts forward extremely slowly toward the glass gabled chapel and white reception pavilion, then settles gently back to exactly the opening framing so the clip loops seamlessly.',
    'Soft ripples shimmer across the water and the mirror reflection wavers subtly; warm golden light glows inside the pavilion windows; thin mist drifts low over the lake; tall trees sway almost imperceptibly in an evening breeze.',
    'Photorealistic, elegant, calm, premium wedding-film look, natural dusk colours. No people walking, no text, no watermark, no camera shake, no cuts.',
  ].join(' '),
  quality: 'quality',
  size: '1920x1080',
  fps: 30,
  duration: 10,
  with_audio: false,
});

console.log(JSON.stringify(task, null, 2));
fs.writeFileSync(OUT, JSON.stringify(task, null, 2));
