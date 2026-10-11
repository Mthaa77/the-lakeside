'use client';

/**
 * THE LAKESIDE — LOGOMARK (round 23)
 * A resolution-independent typographic lockup that mirrors the venue's
 * brand block — THE / LAKESIDE / EST. 1995 / WEDDINGS & EVENTS — without
 * the white raster chip, so it sits cleanly on any surface.
 *
 * Scaling: set a font-size on the wrapper (e.g. text-[8px]); every internal
 * size/track is in em, so the whole lockup scales as one piece.
 * Variants: "dark" = for dark surfaces (marble/gold ink),
 *           "light" = for light surfaces (pine/brass ink).
 * Deterministic markup — SSR-safe, no ids, no randomness.
 */

import { cn } from '@/lib/utils';

export function LogoMark({
  variant = 'dark',
  className,
}: {
  variant?: 'dark' | 'light';
  className?: string;
}) {
  const dark = variant === 'dark';
  return (
    <span
      role="img"
      aria-label="The Lakeside — Weddings & Events, est. 1995"
      className={cn('block select-none text-center leading-none', className)}
    >
      {/* THE */}
      <span
        aria-hidden="true"
        className={cn(
          'block text-[0.62em] font-semibold uppercase tracking-[0.55em]',
          dark ? 'text-gold-300' : 'text-brass-600',
        )}
      >
        The
      </span>

      {/* LAKESIDE */}
      <span
        aria-hidden="true"
        className={cn(
          'mt-[0.34em] block font-display text-[1.72em] font-medium uppercase tracking-[0.24em]',
          dark ? 'text-marble-50' : 'text-pine-900',
        )}
      >
        Lakeside
      </span>

      {/* — EST. 1995 — */}
      <span aria-hidden="true" className="mt-[0.5em] flex items-center justify-center gap-[0.7em]">
        <span className={cn('h-px w-[2.6em]', dark ? 'bg-gold-300/45' : 'bg-brass-500/45')} />
        <span
          className={cn(
            'text-[0.55em] font-semibold uppercase tracking-[0.42em]',
            dark ? 'text-gold-300/85' : 'text-brass-600',
          )}
        >
          Est. 1995
        </span>
        <span className={cn('h-px w-[2.6em]', dark ? 'bg-gold-300/45' : 'bg-brass-500/45')} />
      </span>

      {/* WEDDINGS & EVENTS */}
      <span
        aria-hidden="true"
        className={cn(
          'mt-[0.5em] block text-[0.66em] font-medium uppercase tracking-[0.46em]',
          dark ? 'text-brass-400' : 'text-brass-600',
        )}
      >
        Weddings &amp; Events
      </span>
    </span>
  );
}
