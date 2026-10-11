'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — WEDDING ORNAMENTS (round 21, hydration-hardened in round 25)
 * ─────────────────────────────────────────────────────────────────────────────
 * A small family of hand-drawn wedding motifs shared across the homepage:
 * interlocked rings, botanical sprigs, rotating seals, gilded corner frames
 * and ornamental dividers. Every piece is decorative (aria-hidden by the
 * caller) and pure SVG/CSS — no images, no extra requests.
 *
 * Gradient/path ids are STATIC and declared once by <OrnamentDefs /> (mount
 * it first inside <body>). Every Rings / CircularSeal instance references
 * those shared definitions, so there is no per-instance id to hydrate —
 * the useId-based ids used to shift between the server payload and the
 * hydrated tree on dev first-loads and trip React hydration warnings.
 */

import { cn } from '@/lib/utils';

// ── Shared static definitions ────────────────────────────────────────────────

/**
 * Mount ONCE (layout body, before children). Declares the shared gold band
 * + gem gradients and the circular-seal text path that every ornament
 * instance references. Pure static markup — identical on server and client.
 */
export function OrnamentDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute' }}
    >
      <defs>
        <linearGradient id="lsrings-band" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F6E8C8" />
          <stop offset="42%" stopColor="#DFC28C" />
          <stop offset="74%" stopColor="#B89B6A" />
          <stop offset="100%" stopColor="#8A6C3E" />
        </linearGradient>
        <linearGradient id="lsrings-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#F6E8C8" />
          <stop offset="100%" stopColor="#D9C8A9" />
        </linearGradient>
        <path
          id="lsseal-path"
          d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
          fill="none"
        />
      </defs>
    </svg>
  );
}

// ── Interlocked wedding rings ────────────────────────────────────────────────

/**
 * Two overlapping bands with a solitaire gem on the right ring.
 * Inherits colour via `currentColor` on the hairlines; the bands and gem
 * always render in the brand gold gradient.
 */
export function Rings({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 52 34"
      fill="none"
      aria-hidden="true"
      className={cn('h-6 w-auto', className)}
    >
      <defs />
      {/* left band */}
      <circle
        cx="19"
        cy="20"
        r="11"
        stroke="url(#lsrings-band)"
        strokeWidth="2.1"
      />
      {/* right band (wedding ring) */}
      <circle
        cx="33"
        cy="20"
        r="11"
        stroke="url(#lsrings-band)"
        strokeWidth="2.1"
      />
      {/* solitaire gem sitting on the right band */}
      <path
        d="M33 2.6 L36.4 7.2 L33 11.4 L29.6 7.2 Z"
        fill="url(#lsrings-gem)"
        stroke="#B89B6A"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Botanical sprig ──────────────────────────────────────────────────────────

/**
 * A delicate laurel-style sprig drawn with a single stroke weight so it
 * reads as engraved stationery. Colours via currentColor.
 */
export function FloralSprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 26"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className={cn('h-5 w-auto', className)}
    >
      {/* main stem */}
      <path d="M4 20 C 20 8, 46 6, 68 14" />
      {/* leaf pairs along the stem */}
      <path d="M18 13.5 C 16.4 9.2, 18.2 6.2, 21.6 4.8 C 22.6 8.6, 21.2 11.6, 18 13.5 Z" />
      <path d="M30 9.8 C 29.2 5.4, 31.4 2.8, 35 2 C 35.4 5.8, 33.6 8.8, 30 9.8 Z" />
      <path d="M44 8.6 C 44.6 4.4, 47.4 2.4, 51 2.2 C 50.6 6, 48.2 8.6, 44 8.6 Z" />
      <path d="M24 14.8 C 21.6 18.2, 18.4 19.4, 14.6 18.8 C 16.4 15.4, 19.8 13.9, 24 14.8 Z" />
      <path d="M38 11.8 C 36.2 15.4, 33.2 17, 29.4 16.6 C 31.4 13.2, 34.6 11.6, 38 11.8 Z" />
      <path d="M54 11.4 C 53.4 15.2, 50.8 17.2, 47 17.4 C 48.4 13.8, 51 11.8, 54 11.4 Z" />
      {/* terminal bud */}
      <circle cx="66.4" cy="13.4" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Ornamental divider ───────────────────────────────────────────────────────

type DividerTone = 'brass' | 'gold';
type DividerCenter = 'rings' | 'diamond' | 'floral' | 'heart';

const TONE_RULE: Record<DividerTone, string> = {
  brass: 'from-transparent via-brass-500/70 to-transparent',
  gold: 'from-transparent via-gold-300/70 to-transparent',
};
const TONE_CENTER: Record<DividerTone, string> = {
  brass: 'text-brass-600',
  gold: 'text-gold-300',
};

/**
 * Hairline — motif — hairline. The stationery divider used between sections:
 * `brass` tone for marble surfaces, `gold` for the dark theatre surfaces.
 */
export function OrnamentDivider({
  tone = 'brass',
  center = 'rings',
  className,
}: {
  tone?: DividerTone;
  center?: DividerCenter;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex items-center justify-center gap-4', className)}
    >
      <span
        className={cn(
          'h-px w-16 bg-gradient-to-r sm:w-24',
          TONE_RULE[tone]
        )}
      />
      {center === 'rings' && (
        <Rings className={cn('h-6 w-auto drop-shadow-[0_2px_6px_rgba(184,155,106,0.35)]', TONE_CENTER[tone])} />
      )}
      {center === 'diamond' && (
        <span className={cn('size-[7px] rotate-45 border border-current bg-[#F6F3EE]', TONE_CENTER[tone])} />
      )}
      {center === 'floral' && (
        <FloralSprig className={cn('h-6 w-auto', TONE_CENTER[tone])} />
      )}
      {center === 'heart' && (
        <svg viewBox="0 0 24 22" className={cn('h-4 w-auto', TONE_CENTER[tone])} fill="currentColor" aria-hidden="true">
          <path d="M12 20.2 C 5.4 15.6, 1.6 11.4, 1.6 7.2 C 1.6 4, 4 1.6, 7 1.6 C 9 1.6, 10.9 2.7, 12 4.5 C 13.1 2.7, 15 1.6, 17 1.6 C 20 1.6, 22.4 4, 22.4 7.2 C 22.4 11.4, 18.6 15.6, 12 20.2 Z" />
        </svg>
      )}
      <span
        className={cn(
          'h-px w-16 bg-gradient-to-l sm:w-24',
          TONE_RULE[tone]
        )}
      />
    </div>
  );
}

// ── Rotating circular seal ───────────────────────────────────────────────────

/**
 * Slow-spinning circular text seal with the interlocked rings at its heart.
 * `dark` seats it on a frosted light disc (for dark surfaces), `light` on a
 * marble disc (for light surfaces).
 */
export function CircularSeal({
  text,
  className,
  theme = 'dark',
}: {
  text: string;
  className?: string;
  theme?: 'dark' | 'light';
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative grid size-24 place-items-center rounded-full backdrop-blur-sm',
        theme === 'dark'
          ? 'bg-white/8 shadow-[inset_0_0_0_1px_rgba(237,214,164,0.28),0_18px_40px_-18px_rgba(0,0,0,0.7)]'
          : 'bg-marble-50/90 shadow-[inset_0_0_0_1px_rgba(184,155,106,0.35),0_18px_40px_-18px_rgba(16,38,30,0.5)]',
        className
      )}
    >
      <svg viewBox="0 0 100 100" className="seal-spin absolute inset-0 h-full w-full">
        <text
          className={theme === 'dark' ? 'fill-gold-200/90' : 'fill-brass-600'}
          style={{
            fontSize: '10.5px',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            fontWeight: 600,
            fontFamily: 'var(--font-body), sans-serif',
          }}
        >
          <textPath href="#lsseal-path">{text}</textPath>
        </text>
      </svg>
      <Rings className="h-7 w-auto text-gold-300" />
    </div>
  );
}

// ── Gilded corner frame ──────────────────────────────────────────────────────

/**
 * Four engraved corner ticks (hairline + diamond) that dress the inside
 * corners of a media frame. Place inside a `relative` parent.
 */
export function CornerMarks({
  className,
  inset = '12px',
  tone = 'gold',
}: {
  className?: string;
  /** any CSS length — distance from the parent edges */
  inset?: string;
  tone?: 'gold' | 'brass';
}) {
  const color = tone === 'gold' ? 'border-gold-300/60' : 'border-brass-500/70';
  const dot = tone === 'gold' ? 'bg-gold-300' : 'bg-brass-500';
  const corner = (
    'absolute size-5 border-0 pointer-events-none'
  );
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)} style={{ inset }}>
      <span className={cn(corner, 'left-0 top-0 border-l border-t', color)}>
        <span className={cn('absolute -left-[2.5px] -top-[2.5px] size-[5px] rotate-45', dot)} />
      </span>
      <span className={cn(corner, 'right-0 top-0 border-r border-t', color)}>
        <span className={cn('absolute -right-[2.5px] -top-[2.5px] size-[5px] rotate-45', dot)} />
      </span>
      <span className={cn(corner, 'bottom-0 left-0 border-b border-l', color)}>
        <span className={cn('absolute -bottom-[2.5px] -left-[2.5px] size-[5px] rotate-45', dot)} />
      </span>
      <span className={cn(corner, 'bottom-0 right-0 border-b border-r', color)}>
        <span className={cn('absolute -bottom-[2.5px] -right-[2.5px] size-[5px] rotate-45', dot)} />
      </span>
    </div>
  );
}
