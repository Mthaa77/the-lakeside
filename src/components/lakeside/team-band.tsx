'use client';

/**
 * THE LAKESIDE — THE FAMILY BAND (official team, from the venue brochure)
 * Six people, six roles verbatim from the official 2026 & 2027 wedding
 * packages brochure. No portraits yet — gilded monogram medallions instead,
 * elegant by design rather than placeholder-looking.
 * TODO(CLIENT): team portraits + written consent before swapping in photos.
 */

import { Reveal } from './reveal';
import { OrnamentDivider, Rings } from './ornaments';
import { Heart } from 'lucide-react';
import { SITE } from '@/config/site';

/** Initials for the medallion — deterministic from the name. */
function initials(name: string): string {
  if (name === 'Chef Jenna') return 'CJ';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TeamBand() {
  return (
    <section id="team" aria-label="The Lakeside family" className="marble-texture relative overflow-hidden bg-marble-50">
      <div aria-hidden="true" className="champagne-wash pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -top-24 left-1/3 h-72 w-[36rem] opacity-40" />
      <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -bottom-24 right-0 h-64 w-80 opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal variant="cine" className="mx-auto max-w-2xl text-center">
          <OrnamentDivider tone="brass" center="rings" className="mb-8" />
          <p className="eyebrow eyebrow-dash text-brass-600">Family-run, in person</p>
          <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900 sm:text-5xl">
            The family{' '}
            <em className="gold-gradient-text gold-gradient-text--deep gold-gradient-text--live">stays beside you</em>.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
            Not a switchboard, not a sales desk — the owners themselves, the kitchen
            and the coordinators who walk every wedding from first viewing to last
            dance. The same faces at your tasting, your mock-up and your day.
          </p>
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SITE.owners.map((p, i) => (
            <Reveal as="li" key={p.name} delay={i * 60}>
              <article className="group relative h-full overflow-hidden rounded-[6px] border border-marble-200 bg-white/85 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brass-500/50 hover:shadow-[0_28px_60px_-28px_rgba(16,38,30,0.45)]">
                {/* corner glint */}
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-16 w-16 translate-x-6 -translate-y-6 rotate-45 bg-gradient-to-br from-gold-300/40 to-transparent transition-transform duration-500 group-hover:translate-x-4 group-hover:translate-y-[-4px]"
                />
                <div className="flex items-center gap-4">
                  {/* Gilded monogram medallion */}
                  <span
                    aria-hidden="true"
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-300 via-brass-500 to-brass-700 p-[1.5px] shadow-[0_10px_22px_-10px_rgba(184,155,106,0.9)] transition-transform duration-300 group-hover:scale-105"
                  >
                    <span className="grid h-full w-full place-items-center rounded-full bg-marble-50">
                      <span className="font-display text-lg font-medium tracking-wide text-brass-700">
                        {initials(p.name)}
                      </span>
                    </span>
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl leading-tight text-pine-900">{p.name}</h3>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-brass-700">
                      {p.role}
                    </p>
                  </div>
                </div>
                <div aria-hidden="true" className="brass-hairline mt-4 opacity-50" />
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{p.line}</p>
              </article>
            </Reveal>
          ))}
        </ul>

        {/* Family seal line */}
        <Reveal className="mt-10">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-[4px] border border-brass-500/30 bg-gradient-to-br from-gold-300/[0.12] via-marble-50 to-brass-500/[0.08] px-6 py-5 text-center sm:flex-row sm:text-left">
            <Rings className="h-6 w-auto shrink-0 text-brass-600" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-ink-900">
              <strong className="font-semibold text-brass-700">Our promise —</strong> with a
              passion for perfection, we make your day effortless and filled with joyous
              memories that last a lifetime.
            </p>
            <Heart className="h-4 w-4 shrink-0 text-ruby-500 sm:ml-auto" aria-hidden="true" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
