'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — CONSENT NOTICE (POPIA-aware, honest)
 * ─────────────────────────────────────────────────────────────────────────────
 * The site deliberately uses NO ad trackers and NO analytics cookies. It does
 * keep a few convenience things in the visitor's own browser (localStorage):
 * saved estimates, the date shortlist and this preference itself.
 *
 * This notice says exactly that — once — and remembers the answer:
 *   localStorage 'lakeside-consent' = 'device-only-v1'
 *   CustomEvent 'lakeside:consent-changed' fires so other widgets can react.
 *
 * Coordination: lower-screen surfaces wait for this notice to be answered before
 * shows, so the two floating cards never stack (same screen corner).
 *
 * TODO(CLIENT): if GA4 / Meta Pixel / Clarity is ever added, this notice must
 * grow a real opt-in (see docs/TODO-CLIENT.md "Cookie/consent banner").
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { readConsent, recordConsent } from '@/lib/consent';

export function ConsentNotice() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Deferred one frame so the first client render matches SSR (rule-safe).
    const raf = requestAnimationFrame(() => {
      if (!readConsent()) setShow(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const accept = () => {
    recordConsent();
    setShow(false);
  };

  // "Maybe later" hides the notice for this page view only — it does NOT
  // record an answer, so the notice returns next visit until it's accepted.
  const later = () => setShow(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? undefined : { y: 24, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-8rem)] max-w-md -translate-x-1/2 lg:bottom-24 lg:left-6 lg:w-[21rem] lg:max-w-none lg:translate-x-0"
          role="region"
          aria-label="How this site uses your device"
        >
          <div className="glass-card-light rounded-[6px] p-4 shadow-[0_24px_60px_-24px_rgba(16,38,30,0.45)]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-900 text-brass-400">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-pine-900">Your data, your device</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">
                  Saved dates and preferences on this site live in your
                  browser only. No ad trackers, no analytics cookies — nothing
                  leaves your device unless you send a form yourself.{' '}
                  <a
                    href="#privacy"
                    className="font-medium text-pine-900 underline underline-offset-2 hover:text-brass-600"
                  >
                    Privacy &amp; POPIA
                  </a>
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={accept}
                    className="rounded-full bg-pine-900 text-marble-50 hover:bg-pine-700"
                  >
                    That&apos;s fine
                  </Button>
                  <button
                    type="button"
                    onClick={later}
                    className="inline-flex min-h-[36px] items-center rounded-full px-3 text-xs font-medium text-ink-600 transition-colors hover:bg-pine-900/5 hover:text-pine-900"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={later}
                aria-label="Dismiss privacy notice"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-pine-900/5"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
