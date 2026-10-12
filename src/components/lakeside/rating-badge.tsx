/**
 * THE LAKESIDE — RATING BADGE
 * "4.8 on Google · about 390 reviews" — visual proof only, no AggregateRating
 * structured data. Two gates in site.ts decide visibility: the client has
 * confirmed the numbers (`show`) and `checkedAt` is younger than 60 days
 * (`RATING_FRESH`) — a stale rating hides itself.
 *
 * Server component: no state, deterministic output, safe anywhere.
 */

import { Star } from 'lucide-react';
import { SITE, RATING_FRESH } from '@/config/site';
import { cn } from '@/lib/utils';

/** "2026-10-12" → "12 Oct 2026" — pure string ops, identical on both sides. */
function checkedLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

export function RatingBadge({
  tone = 'dark',
  className,
}: {
  /** "dark" = over pine/hero surfaces; "light" = over marble. */
  tone?: 'dark' | 'light';
  className?: string;
}) {
  if (!RATING_FRESH) return null;

  const dark = tone === 'dark';
  const label = `${SITE.rating.value} on ${SITE.rating.source}, about ${SITE.rating.count} reviews, checked ${checkedLabel(SITE.rating.checkedAt)}`;

  const inner = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full',
          dark ? 'bg-gold-300/15' : 'bg-brass-500/15',
        )}
      >
        <Star className={cn('h-3 w-3', dark ? 'text-gold-300' : 'text-brass-600')} fill="currentColor" />
      </span>
      <span className={cn('font-semibold', dark ? 'text-marble-50' : 'text-pine-900')}>
        {SITE.rating.value}&nbsp;on&nbsp;{SITE.rating.source}
      </span>
      <span className={cn('font-normal', dark ? 'text-marble-50/70' : 'text-ink-600')}>
        · about {SITE.rating.count} reviews
      </span>
    </>
  );

  const shell = cn(
    'inline-flex min-h-[32px] items-center gap-2 rounded-full px-3 text-[12px] tracking-wide backdrop-blur',
    dark
      ? 'border border-gold-300/25 bg-white/[0.07] shadow-[0_10px_28px_-16px_rgba(0,0,0,0.7)]'
      : 'border border-brass-500/35 bg-white/85 shadow-[0_10px_28px_-18px_rgba(16,38,30,0.45)]',
    className,
  );

  // TODO(CLIENT): add the Google Business Profile URL in site.ts → profileUrl
  const href = SITE.rating.profileUrl;

  return (
    <span title={label}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} — opens the Google Business Profile in a new tab`}
          className={cn(shell, 'transition-colors', dark ? 'hover:border-gold-300/50' : 'hover:border-brass-500/70')}
        >
          {inner}
        </a>
      ) : (
        <span role="img" aria-label={label} className={shell}>
          {inner}
        </span>
      )}
    </span>
  );
}
