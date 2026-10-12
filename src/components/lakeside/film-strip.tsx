'use client';

/**
 * THE LAKESIDE — FILM STRIP (round 18, new)
 * A full-bleed 35mm film band that puts more estate photography on the
 * homepage: two marquee rows drifting in opposite directions, framed in gold
 * on a dark film-stock background with sprocket rails and edge fade masks.
 * Pauses on hover; static under reduced motion. Strictly decorative rhythm —
 * the gallery keeps the interactive duty.
 */

import curated from '@/content/curated-images.json';

type CuratedImage = {
  key: string;
  category: string;
  use: string[];
  alt: string;
  w: number;
  h: number;
  aspect: number;
};

const IMAGES = curated as CuratedImage[];

/** Deterministic picks: skip the logo strip, two distinct runs of frames. */
const POOL = IMAGES.filter((i) => i.use.includes('thumb') && i.key !== 'LS-001');
const ROW_A = POOL.slice(1, 15);
const ROW_B = POOL.slice(15, 29);

function Frame({ item, priority }: { item: CuratedImage; priority?: boolean }) {
  return (
    <figure className="group relative shrink-0 overflow-hidden rounded-[3px] border border-gold-300/30 bg-pine-900 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.75)] transition-colors duration-300 hover:border-gold-300/70">
      <img
        src={`/img/${item.key}-s.webp`}
        alt={item.alt}
        width={item.w}
        height={Math.round(item.w / item.aspect)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className="h-36 w-auto object-cover transition-[filter,transform] duration-500 group-hover:scale-[1.04] group-hover:brightness-110 sm:h-44"
        style={{ aspectRatio: `${Math.min(1.9, Math.max(0.55, item.aspect))}` }}
      />
      {/* gloss sweep on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
    </figure>
  );
}

function MarqueeRow({
  items,
  dir,
  label,
}: {
  items: CuratedImage[];
  dir: 'left' | 'right';
  label: string;
}) {
  return (
    <div className="overflow-hidden">
      {/* The track is focusable so keyboard visitors can pause the drift
          (focus-within pause in globals.css); copy 1 is aria-hidden + inert. */}
      <div
        className={dir === 'left' ? 'marquee-track marquee-track--left' : 'marquee-track marquee-track--right'}
        role="img"
        aria-label={label}
        tabIndex={0}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 gap-4 pr-4"
            aria-hidden={copy === 1 || undefined}
            inert={copy === 1 || undefined}
          >
            {items.map((item, i) => (
              <Frame key={`${copy}-${item.key}`} item={item} priority={copy === 0 && i < 2} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FilmStrip() {
  if (ROW_A.length === 0) return null;

  return (
    <section
      aria-label="Snapshots from the estate — scrolling film strip"
      className="film-strip relative overflow-hidden bg-[#0b1a15] py-5 sm:py-7"
    >
      {/* Sprocket rails */}
      <div aria-hidden="true" className="film-sprockets opacity-80" />

      {/* Slate header */}
      <div aria-hidden="true" className="mx-auto flex max-w-[1600px] items-center justify-between px-4 pb-4 pt-2 text-[10px] uppercase tracking-[0.3em] text-gold-200/70 sm:px-6">
        <span>Reel 02 · Snapshots</span>
        <span className="hidden sm:inline">The Lakeside · Family-Run</span>
        <span className="flex items-center gap-1.5">
          <span className="wax-dot size-[7px]" />
          35mm
        </span>
      </div>

      <div className="relative space-y-4">
        <MarqueeRow items={ROW_A} dir="left" label="A drifting strip of estate photographs: chapel, lake and celebrations" />
        <div aria-hidden="true" className="brass-hairline opacity-60" />
        <MarqueeRow items={ROW_B} dir="right" label="A second strip: receptions, wildlife and golden-hour portraits" />

        {/* Edge fades into the film stock */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[#0b1a15] to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[#0b1a15] to-transparent" />
      </div>

      <div aria-hidden="true" className="film-sprockets mt-5 opacity-80 sm:mt-6" />
    </section>
  );
}
