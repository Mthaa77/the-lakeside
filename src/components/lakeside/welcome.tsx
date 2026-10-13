'use client';

/**
 * THE LAKESIDE — WELCOME (round 33, the receiving room)
 * A premium marble "receiving room" directly under the hero. Round 33 seats
 * the client's official embossed brand seal at the head of the section —
 * flanked by brass hairlines like a letterpress stamp — and lets the logo's
 * own "EST. 1995" fact into the copy for the first time (the seal is the
 * client's official brand mark, so the founding year is now client-verified).
 * Round 29 still holds: family welcome copy with a drop cap, a three-beat
 * promise of how the day unfolds, the owners' signature, a drifting collage
 * of estate photos in gilded frames, and a verified-facts stats row.
 */

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { Reveal } from './reveal';
import { BrandSeal } from './seal';
import { cn } from '@/lib/utils';

const STATS = [
  { n: '200', label: 'Guests, up to' },
  { n: '14 ha', label: 'Gardens, lawns & water' },
  { n: '9', label: 'Rooms, up to 18 guests' },
  { n: 'Auto', label: 'Backup generator' },
] as const;

/** How the day unfolds — three beats, all verified estate facts. */
const DAY_BEATS = [
  { t: 'Late morning', d: 'Vows in the glass chapel, pines and still water behind you.' },
  { t: 'Golden hour', d: 'Portraits on the deck, the lawns and the lake doing the rest.' },
  { t: 'Evening', d: 'Dinner under the chandeliers, sparklers out on the lawn.' },
] as const;

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

      {/* Ghost of the brand seal — an embossed watermark pressed into the marble,
          echoing the stamp at the head of the section (round 33) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-2 hidden opacity-[0.05] mix-blend-multiply lg:block"
      >
        <BrandSeal tone="stamp" className="size-[400px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header — the official brand seal, stamped into the marble between
            brass hairlines (round 33). The logo itself carries "EST. 1995". */}
        <Reveal variant="cine" className="mx-auto max-w-2xl text-center">
          <div className="mb-7 flex items-center justify-center gap-5 sm:gap-7">
            <span aria-hidden="true" className="h-px w-14 bg-gradient-to-r from-transparent to-brass-500/50 sm:w-24" />
            <BrandSeal tone="stamp" className="size-24 sm:size-28" />
            <span aria-hidden="true" className="h-px w-14 bg-gradient-to-l from-transparent to-brass-500/50 sm:w-24" />
          </div>
          <p className="eyebrow eyebrow-dash text-brass-600">Welcome to The Lakeside</p>
          <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900 sm:text-5xl">
            A family-run estate{' '}
            <em className="gold-gradient-text gold-gradient-text--deep gold-gradient-text--live">on the water.</em>
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
            Fourteen hectares of gardens, pines and still water in the countryside
            east of Pretoria — welcoming weddings since 1995. A 30-minute drive
            from the city, a world away.
          </p>
        </Reveal>

        <div className="mt-14 grid items-center gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-10">
          {/* Copy column */}
          <div className="lg:col-span-5">
            <Reveal delay={80}>
              <p className="text-pretty text-base leading-relaxed text-ink-600 sm:text-lg">
                <span className="font-display float-left mr-3 mt-1 text-6xl font-medium leading-[0.8] text-brass-600">
                  T
                </span>
                he Lakeside is run by a small family team: Penelope and Callie,
                Chef Jenna and the coordinators who stay with you from the first
                viewing to the last dance.
              </p>
              <p className="mt-5 text-pretty text-base leading-relaxed text-ink-600">
                Family-run since 1995 — three decades of weddings on this water,
                and a name on the gate that still answers its own phone.
              </p>
              <p className="mt-5 text-pretty text-base leading-relaxed text-ink-600">
                Glass chapel opening its stacking doors over the lake, lemon trees
                along the lawn, a heritage house more than a century old and
                antelope grazing at a stone&rsquo;s throw — exclusive to you for the
                day, with nine rooms kept for your wedding party after.
              </p>
            </Reveal>

            {/* How the day unfolds — the promise in three beats */}
            <Reveal delay={140} className="mt-9">
              <p className="eyebrow text-brass-600">How the day unfolds</p>
              <ol className="mt-4">
                {DAY_BEATS.map((b, i) => (
                  <li key={b.t} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < DAY_BEATS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[5px] top-4 h-full w-px bg-gradient-to-b from-brass-500/50 to-brass-500/10"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-[11px] shrink-0 rotate-45 border border-brass-500 bg-marble-50 shadow-[0_0_0_3px_rgba(184,155,106,0.15)]"
                    />
                    <div>
                      <p className="text-sm font-semibold tracking-wide text-pine-900">{b.t}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{b.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            {/* Signature — named owners; team photo needs consent first.
                TODO(CLIENT): team photos + written consent before adding portraits. */}
            <Reveal delay={160} className="mt-8 flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-full border border-brass-500/40 bg-white shadow-sm" aria-hidden="true">
                <Heart className="h-4 w-4 text-ruby-500" />
              </span>
              <div>
                <p className="font-display text-xl text-pine-900">Penelope &amp; Callie</p>
                <p className="text-xs uppercase tracking-[0.14em] text-ink-600">
                  Owners, The Lakeside
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
                  width={2048}
                  height={1366}
                  className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-pine-900/85 to-transparent px-4 pb-3 pt-10 text-[11px] uppercase tracking-[0.14em] text-gold-200">
                  <span>The Glass Chapel</span>
                  <span aria-hidden="true">No. 04</span>
                </figcaption>
              </motion.figure>

              {/* Overlap top-right — golden hour on the lawns.
                  Alt wording deliberately names no animal: giraffes are not
                  on the venue's wildlife list. TODO(CLIENT): confirm where
                  this photo was taken; if not on the estate, retire it. */}
              <motion.figure
                style={reduced ? undefined : { y: sideY }}
                className="absolute -top-8 right-0 hidden w-[36%] rotate-2 overflow-hidden rounded-[4px] border-2 border-white shadow-[0_24px_50px_-24px_rgba(16,38,30,0.6)] sm:block"
              >
                <img
                  src="/img/LS-055-s.webp"
                  alt="Golden-hour portrait of a couple on the open grassland"
                  loading="lazy"
                  decoding="async"
                  width={1074}
                  height={1288}
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
                  width={1600}
                  height={1067}
                  className="aspect-[4/3] w-full object-cover"
                />
              </motion.figure>

              {/* The official brand seal — a stamped coin on a paper chip,
                  top-left of the main frame (round 33) */}
              <motion.div
                style={reduced ? undefined : { y: sideY }}
                className="absolute -left-2 -top-7 rounded-full bg-marble-50/95 p-1.5 shadow-[0_18px_36px_-16px_rgba(16,38,30,0.55)] ring-1 ring-brass-500/25 backdrop-blur lg:-left-1"
                aria-hidden="true"
              >
                <BrandSeal className="size-14 sm:size-16" />
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
