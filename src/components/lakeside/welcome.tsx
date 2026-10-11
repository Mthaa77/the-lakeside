'use client';

/**
 * THE LAKESIDE — WELCOME (round 18, new)
 * A premium marble "receiving room" directly under the hero: family welcome
 * copy with a drop cap and signature, a drifting collage of estate photos in
 * gilded frames, floating Est-1995 seal, and a gold-numeral stats row.
 * Ambient gold + ruby blooms keep the round-18 palette present without noise.
 */

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { Reveal } from './reveal';
import { OrnamentDivider } from './ornaments';
import { cn } from '@/lib/utils';

const STATS = [
  { n: '1995', label: 'Family-run since' },
  { n: '200', label: 'Guests on the lawn' },
  { n: '3', label: 'Ceremony spaces' },
  { n: '1', label: 'Very still lake' },
] as const;

/** Small spinning gold seal — shared visual language with the hero. */
function MiniSeal({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-16 w-16', className)} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="seal-spin h-full w-full">
        <defs>
          <path id="seal-mini-arc" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
        </defs>
        <text
          className="fill-brass-600"
          style={{
            fontSize: '11.5px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 600,
            fontFamily: 'var(--font-body), sans-serif',
          }}
        >
          <textPath href="#seal-mini-arc">Est. 1995 · Est. 1995 ·</textPath>
        </text>
      </svg>
      <span className="wax-dot absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}

export function Welcome() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // Gentle counter-drift of the collage pieces while the section crosses the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const mainY = useTransform(scrollYProgress, [0, 1], ['4%', '-4%']);
  const sideY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);
  const chipY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%']);

  return (
    <section
      id="welcome"
      ref={ref}
      aria-label="Welcome to The Lakeside"
      className="marble-texture relative overflow-hidden bg-marble-50 py-20 sm:py-28"
    >
      {/* Ambient blooms */}
      <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] opacity-60" />
      <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -left-32 bottom-0 h-[380px] w-[380px] opacity-25" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Reveal variant="cine" className="mx-auto max-w-2xl text-center">
          <OrnamentDivider tone="brass" center="rings" className="mb-6" />
          <p className="eyebrow eyebrow-dash text-brass-600">Welcome to The Lakeside</p>
          <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900 sm:text-5xl">
            Thirty years. One lake.{' '}
            <em className="gold-gradient-text gold-gradient-text--deep gold-gradient-text--live">Your day.</em>
          </h2>
        </Reveal>

        <div className="mt-14 grid items-center gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-10">
          {/* Copy column */}
          <div className="lg:col-span-5">
            <Reveal delay={80}>
              <p className="text-pretty text-base leading-relaxed text-ink-600 sm:text-lg">
                <span className="font-display float-left mr-3 mt-1 text-6xl font-medium leading-[0.8] text-brass-600">
                  S
                </span>
                ince 1995 our family has flung open these gates for couples starting
                their own. The kettle goes on in the Beauty Room, the zebras wander the
                far lawn, and by golden hour the water turns to hammered brass.
              </p>
              <p className="mt-5 text-pretty text-base leading-relaxed text-ink-600">
                Nothing here is hired in: the glass chapel was raised on its shore, the
                marble floor was polished for first dances, and every member of the team
                knows exactly which door catches the evening light. You arrive engaged —
                you leave with a home.
              </p>
            </Reveal>

            {/* Signature */}
            <Reveal delay={160} className="mt-8 flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-full border border-brass-500/40 bg-white shadow-sm" aria-hidden="true">
                <Heart className="h-4 w-4 text-ruby-500" />
              </span>
              <div>
                <p className="font-display text-xl text-pine-900">The Lakeside family</p>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-600">
                  Keepers of the estate
                </p>
              </div>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={220} className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#explore"
                className="btn-shine inline-flex min-h-[44px] items-center gap-2 rounded-full bg-pine-900 px-6 text-sm font-medium text-marble-50 transition-colors hover:bg-pine-700"
              >
                Wander the estate <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#gallery"
                className="group inline-flex min-h-[44px] items-center gap-2 rounded-full border border-brass-500/50 px-6 text-sm font-medium text-pine-900 transition-colors hover:border-ruby-500 hover:text-ruby-600"
              >
                See the gallery
              </a>
            </Reveal>

            {/* Stats — gold numerals over marble */}
            <Reveal delay={280} className="mt-12">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-brass-500/25 pt-8 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-display text-4xl font-medium leading-none">
                      <span className="gold-gradient-text gold-gradient-text--deep">{s.n}</span>
                    </dd>
                    <dd className="mt-2 text-[11px] uppercase leading-snug tracking-[0.12em] text-ink-600">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* Collage column */}
          <div className="relative lg:col-span-7">
            <div className="relative mx-auto max-w-xl lg:max-w-none lg:pl-14 lg:pr-8">
              {/* Main frame — the glass chapel */}
              <motion.figure
                style={reduced ? undefined : { y: mainY }}
                className="gold-border-light relative overflow-hidden rounded-[4px] shadow-[0_40px_80px_-40px_rgba(16,38,30,0.55)]"
              >
                <img
                  src="/img/LS-067-s.webp"
                  alt="The Glass Chapel exterior: floor-to-ceiling glass doors open onto the lawn, a couple on the steps"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-pine-900/85 to-transparent px-4 pb-3 pt-10 text-[11px] uppercase tracking-[0.14em] text-gold-200">
                  <span>The Glass Chapel</span>
                  <span aria-hidden="true">No. 04</span>
                </figcaption>
              </motion.figure>

              {/* Overlap top-right — golden hour with the giraffe */}
              <motion.figure
                style={reduced ? undefined : { y: sideY }}
                className="absolute -top-8 right-0 hidden w-[36%] rotate-2 overflow-hidden rounded-[4px] border-2 border-white shadow-[0_24px_50px_-24px_rgba(16,38,30,0.6)] sm:block"
              >
                <img
                  src="/img/LS-055-s.webp"
                  alt="Golden-hour portrait on the grassland with a giraffe behind"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
              </motion.figure>

              {/* Overlap bottom-left — the petal confetti exit */}
              <motion.figure
                style={reduced ? undefined : { y: chipY }}
                className="absolute -bottom-10 left-0 hidden w-[38%] -rotate-3 overflow-hidden rounded-[4px] border-2 border-white shadow-[0_28px_56px_-24px_rgba(16,38,30,0.65)] sm:block"
              >
                <img
                  src="/img/LS-050-s.webp"
                  alt="A confetti of white petals as the couple exit the glass chapel"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              </motion.figure>

              {/* Floating mini seal — top-left of the main frame */}
              <motion.div
                style={reduced ? undefined : { y: sideY }}
                className="absolute -left-2 -top-6 rounded-full bg-marble-50/90 p-1.5 shadow-[0_14px_30px_-14px_rgba(16,38,30,0.5)] backdrop-blur lg:-left-2"
                aria-hidden="true"
              >
                <MiniSeal />
              </motion.div>

              {/* Ruby family-run chip — bottom-right */}
              <motion.div
                style={reduced ? undefined : { y: chipY }}
                className="absolute -bottom-6 right-2 flex items-center gap-2 rounded-full gold-border-light bg-white px-4 py-2 shadow-[0_16px_36px_-18px_rgba(16,38,30,0.55)]"
              >
                <span className="wax-dot" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-wide text-pine-900">
                  Family-owned &amp; run
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
