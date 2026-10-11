'use client';

/**
 * THE LAKESIDE — BACK TO TOP
 * Appears after two viewport-heights of scroll; brand-styled brass circle.
 * A hairline ring fills with scroll progress so the control doubles as a
 * "how far through the page am I" indicator. Sits above the mobile action
 * bar on small screens. Honours reduced motion.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0); // 0…1 through the document
  const reduced = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setShow(window.scrollY > window.innerHeight * 2);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // SVG progress ring (44px button, ring inset 2px → r=19; 2πr ≈ 119.38).
  const RING = 2 * Math.PI * 19;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={reduced ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={() =>
            window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
          }
          aria-label={`Back to top — ${Math.round(progress * 100)}% through the page`}
          className="fixed bottom-[5.75rem] right-4 z-40 flex size-11 items-center justify-center rounded-full border border-pine-900/15 bg-marble-50/95 text-pine-900 shadow-[0_12px_32px_-12px_rgba(16,38,30,0.5)] backdrop-blur transition-colors hover:bg-brass-500 hover:text-white lg:bottom-6 lg:right-6"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 44 44"
            className="absolute inset-1 h-auto w-auto"
            style={{ inset: '2px' }}
          >
            <circle
              cx="22"
              cy="22"
              r="19"
              fill="none"
              className="stroke-pine-900/10"
              strokeWidth="2"
            />
            <circle
              cx="22"
              cy="22"
              r="19"
              fill="none"
              className="stroke-brass-500"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - progress)}
              transform="rotate(-90 22 22)"
            />
          </svg>
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
