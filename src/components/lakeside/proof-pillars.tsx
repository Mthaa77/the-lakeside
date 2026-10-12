'use client';

/**
 * THE LAKESIDE — PROOF BAR + THREE PILLARS (cinematic edition)
 * Proof: family-run facts only (no invented ratings).
 * Pillars: Glass Chapel → Marble Reception → Wild Lakeside, each framed like
 * a film still — scroll-linked parallax inside the frame, brass corner ticks
 * and a numbered film-slate caption.
 */

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Reveal } from './reveal';
import { ArrowRight, ShieldCheck, Users, Zap, Heart } from 'lucide-react';

const PROOF = [
  { icon: Heart, label: 'Family-run' },
  { icon: Users, label: 'Exclusive use of the entire estate' },
  { icon: Zap, label: 'Backup generator that starts itself' },
  { icon: ShieldCheck, label: 'One coordinator, 08h00 to 22h00' },
];

const PILLARS = [
  {
    key: 'chapel',
    eyebrow: 'The Glass Chapel',
    title: 'Married inside a window.',
    line: 'Floor-to-ceiling glass among the pines and lemon trees — stacking doors that open to the summer breeze, warm and closed against the winter chill.',
    img: '/img/LS-067.webp',
    w: 2048,
    h: 1366,
    alt: 'The Glass Chapel exterior: floor-to-ceiling glass doors open onto the lawn, a couple on the steps',
    href: '#explore',
    focus: 'chapel',
  },
  {
    key: 'reception',
    eyebrow: 'The White Marble Reception',
    title: 'Dinner on the water&rsquo;s edge.',
    line: 'Polished marble under scissor trusses and brass chandeliers, a deck over the lake, and a lounge with a fireplace for the quiet hours.',
    img: '/img/LS-071.webp',
    w: 1073,
    h: 1600,
    alt: 'The White Marble Reception: polished marble floor, scissor trusses, brass chandeliers and glass walls over the water',
    href: '#explore',
    focus: 'reception',
    raw: true,
  },
  {
    key: 'wildlife',
    eyebrow: 'The Wild Lakeside',
    title: 'Zebra on the horizon.',
    line: 'Zebra, sable, gemsbok, waterbuck, golden wildebeest and emus share the lawns. Guests love it; glass stays inside.',
    img: '/img/LS-061.webp',
    w: 1600,
    h: 1066,
    alt: 'Bride and groom watching zebra graze beside the lawn',
    href: '#explore',
    focus: 'wildlife',
  },
];

/** One cinematic still: parallax drift inside the frame + brass corners + slate. */
function PillarImage({ p, index }: { p: (typeof PILLARS)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <div
      ref={ref}
      className="frame-corners group relative aspect-[16/11] overflow-hidden rounded-[6px] shadow-[0_32px_80px_-32px_rgba(16,38,30,0.4)]"
    >
      {/* Overscan so the drift never shows an edge */}
      <motion.div className="absolute inset-[-9%]" style={reduced ? undefined : { y }}>
        <img
          src={p.img}
          alt={p.alt}
          width={p.w}
          height={p.h}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pine-900/40 via-transparent to-transparent" />
      <span className="fc-b absolute inset-0" aria-hidden="true" />
      {/* Film-slate caption */}
      <span
        aria-hidden="true"
        className="glass-card absolute bottom-4 left-4 rounded-[4px] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-marble-50"
      >
        {String(index + 1).padStart(2, '0')} — {p.eyebrow}
      </span>
    </div>
  );
}

export function ProofPillars() {
  return (
    <>
      {/* Proof bar */}
      <section aria-label="Why couples trust The Lakeside" className="border-b border-marble-200 bg-marble-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-7 sm:px-6 lg:grid-cols-4 lg:px-8">
          {PROOF.map((p, i) => (
            <Reveal key={p.label} delay={i * 70} className="flex items-center gap-3">
              <p.icon className="h-5 w-5 shrink-0 text-brass-600" aria-hidden="true" />
              <span className="text-sm font-medium leading-snug text-ink-900">{p.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Three pillars */}
      <section id="estate" aria-label="The estate: three signatures" className="marble-texture bg-marble-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Reveal variant="cine" className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-brass-600">The estate</p>
            <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900 sm:text-5xl">
              The chapel. The water.{' '}
              <em className="gold-gradient-text gold-gradient-text--deep">The wild.</em>
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
              One estate, entirely yours. Every space sits within a short walk on the
              water&rsquo;s edge — and every space is in view of the wildlife.
            </p>
          </Reveal>

          <div className="mt-14 space-y-16 lg:space-y-24">
            {PILLARS.map((p, i) => (
              <Reveal key={p.key}>
                <article
                  className={`grid items-center gap-8 lg:grid-cols-12 lg:gap-12 ${
                    i % 2 === 1 ? '' : ''
                  }`}
                >
                  <div className={`lg:col-span-7 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <PillarImage p={p} index={i} />
                  </div>
                  <div className={`lg:col-span-5 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <p className="eyebrow text-brass-600">{p.eyebrow}</p>
                    {p.raw ? (
                      <h3
                        className="mt-3 font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl"
                        dangerouslySetInnerHTML={{ __html: p.title }}
                      />
                    ) : (
                      <h3 className="mt-3 font-display text-3xl font-medium leading-tight text-pine-900 sm:text-4xl">
                        {p.title}
                      </h3>
                    )}
                    <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">{p.line}</p>
                    <a
                      href={p.href}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-pine-900 underline decoration-brass-500 decoration-2 underline-offset-4 transition-colors hover:text-brass-600"
                    >
                      Explore in the estate map
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
