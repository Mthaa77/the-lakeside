'use client';

/**
 * THE LAKESIDE — CINEMATIC INTERLUDE
 * A full-bleed "golden hour" parallax band that cuts in like a film scene:
 * the image drifts against the scroll inside an oversized frame, film grain
 * and a lens vignette sit over it, and a brass frame corners the composition.
 * Sits between the white "beyond weddings" grid and the dark proposals band —
 * its bottom scrim melts into pine-800 so the cut reads as one continuous shot.
 */

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Reveal } from './reveal';
import { ArrowRight } from 'lucide-react';

export function CinematicInterlude() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-9%', '9%']);
  const soft = useTransform(scrollYProgress, [0, 0.5, 1], [0.55, 0.32, 0.55]);

  return (
    <section
      ref={ref}
      aria-label="Golden hour at The Lakeside"
      className="relative isolate overflow-hidden bg-pine-800"
    >
      <div className="relative flex min-h-[72vh] items-center md:min-h-[88vh]">
        {/* Parallax frame — oversized so the drift never shows an edge */}
        <motion.div
          className="absolute inset-[-10%]"
          style={reduced ? undefined : { y }}
        >
          <img
            src="/img/LS-007.webp"
            alt="The glass chapel and the white pavilion mirrored in the still lake at golden hour, a couple on the lawn"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </motion.div>

        {/* Scrims: readability + melt into the proposals band below */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-pine-900"
          style={reduced ? { opacity: 0.45 } : { opacity: soft }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-pine-900/35 via-transparent to-pine-800" />
        <div className="cine-vignette" aria-hidden="true" />
        <div className="cine-grain cine-grain--live" aria-hidden="true" />
        <div className="frame-corners absolute inset-3 md:inset-5" aria-hidden="true">
          <span className="fc-b absolute inset-0" />
        </div>

        {/* The line */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <Reveal variant="cine" className="mx-auto max-w-3xl">
            <p className="eyebrow eyebrow-dash text-brass-400">The golden hour</p>
            <h2 className="mt-5 font-display text-balance text-[clamp(2.2rem,5.5vw,4.25rem)] font-medium leading-[1.05] text-marble-50">
              Golden hour lives here.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-marble-50/85 sm:text-lg">
              Sunset toasts on the deck. First dance under the chandeliers. Sparklers
              on the lawn. The estate holds the light a little longer for its couples.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="brass-hairline w-10" aria-hidden="true" />
              <span className="size-1.5 rotate-45 border border-brass-400" aria-hidden="true" />
              <span className="brass-hairline w-10" aria-hidden="true" />
            </div>
            <a
              href="#gallery"
              className="group mt-8 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-brass-400 transition-colors hover:text-brass-500"
            >
              Wander the gallery
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
