'use client';

/**
 * THE LAKESIDE — RETURN-VISITOR NUDGE
 * If a previous estimate is saved in localStorage, invite the visitor to
 * pick it up again. Restrained, dismissible, never a popup modal.
 * Spec 10.18: "Pick up your estimate for 14 March 2027?"
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { readConsent } from '@/lib/consent';
import { X, History } from 'lucide-react';

type Quote = { date?: string; adults?: number; package?: string; total?: number };

function prettyDate(iso?: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

export function QuoteNudge() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [dismissed, setDismissed] = useState(true); // start hidden; effect may reveal
  const reduced = useReducedMotion();

  useEffect(() => {
    // The consent notice shares this screen corner — the nudge waits until the
    // visitor has answered it (or until storage says they already have).
    const check = () => {
      if (!readConsent()) {
        setDismissed(true);
        return;
      }
      try {
        const raw = window.localStorage.getItem('lakeside-quote');
        if (!raw) return;
        const q = JSON.parse(raw) as Quote;
        if (q && q.total) {
          setQuote(q);
          setDismissed(false);
        }
      } catch {
        /* no quote or storage blocked — stay quiet */
      }
    };
    // Deferred one frame so the first client render matches SSR (rule-safe).
    const raf = requestAnimationFrame(check);
    window.addEventListener('lakeside:consent-changed', check);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('lakeside:consent-changed', check);
    };
  }, []);

  const when = prettyDate(quote?.date);

  return (
    <AnimatePresence>
      {!dismissed && quote && when && (
        <motion.aside
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? undefined : { y: 24, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-8rem)] max-w-md -translate-x-1/2 lg:bottom-24 lg:left-6 lg:w-md lg:max-w-sm lg:translate-x-0"
          role="status"
          aria-label="Your saved estimate"
        >
          <div className="glass-card-light flex items-center gap-3 rounded-[6px] p-4 shadow-[0_24px_60px_-24px_rgba(16,38,30,0.45)]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-900 text-brass-400">
              <History className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-pine-900">
                Pick up your estimate for {when}?
              </p>
              <p className="truncate text-xs text-ink-600">
                {quote.package ?? 'Your estimate'} · {quote.adults ?? '?'} guests ·{' '}
                {quote.total != null
                  ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(quote.total).replace('ZAR', 'R')
                  : 'estimate saved'}
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 rounded-full bg-pine-900 text-marble-50 hover:bg-pine-700"
              onClick={() => {
                document.getElementById('estimate')?.scrollIntoView({ behavior: 'smooth' });
                setDismissed(true);
              }}
            >
              Open
            </Button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss estimate reminder"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-pine-900/5"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
