'use client';

/**
 * THE LAKESIDE — SHARED-ESTIMATE RESTORE
 * When someone opens /?q=SHORTID (a link copied from the estimator), fetch
 * the saved estimate and offer to restore it — same restrained banner style
 * as the return-visitor nudge. No login; the shortId is the capability.
 * On "Open" it dispatches 'lakeside:restore-quote' which the estimator
 * listens for, then cleans the URL so a refresh doesn't nag again.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Share2 } from 'lucide-react';

type QuotePayload = {
  shortId: string;
  createdAt: string;
  inputs: { date?: string; adults?: number; children?: number; topUp?: boolean };
  result: { packageName?: string; total?: number; deposit?: number | null };
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

function prettyDate(iso?: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DOW[dow]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

function zar(n?: number): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 })
    .format(n)
    .replace('ZAR', 'R');
}

export function SharedQuote() {
  const [quote, setQuote] = useState<QuotePayload | null>(null);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = (params.get('q') ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(q)) return;

    let cancelled = false;
    fetch(`/api/quotes?shortId=${encodeURIComponent(q)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('not found');
        const json = await res.json();
        if (!cancelled && json?.quote) {
          setQuote(json.quote as QuotePayload);
          setVisible(true);
        }
      })
      .catch(() => {
        // Broken or expired link — stay quiet, the page works as normal.
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    setVisible(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.replaceState(null, '', url.toString());
  }

  function open() {
    if (!quote) return;
    window.dispatchEvent(
      new CustomEvent('lakeside:restore-quote', {
        detail: {
          date: quote.inputs?.date,
          adults: quote.inputs?.adults,
          children: quote.inputs?.children,
          topUp: quote.inputs?.topUp,
        },
      }),
    );
    dismiss();
  }

  const when = prettyDate(quote?.inputs?.date);

  return (
    <AnimatePresence>
      {visible && quote && (
        <motion.aside
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? undefined : { y: 24, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-8rem)] max-w-md -translate-x-1/2 lg:bottom-6 lg:w-[calc(100%-2rem)]"
          role="status"
          aria-label="A shared estimate"
        >
          <div className="glass-card-light flex items-center gap-3 rounded-[6px] p-4 shadow-[0_24px_60px_-24px_rgba(16,38,30,0.45)]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine-900 text-brass-400">
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-pine-900">
                {when ? `Shared estimate for ${when}` : 'A shared estimate'}
              </p>
              <p className="truncate text-xs text-ink-600">
                {quote.result?.packageName ?? 'Saved estimate'}
                {quote.inputs?.adults ? ` · ${quote.inputs.adults} guests` : ''}
                {quote.result?.total != null ? ` · ${zar(quote.result.total)}` : ''}
                {' · as saved'}
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 rounded-full bg-pine-900 text-marble-50 hover:bg-pine-700"
              onClick={open}
            >
              Open
            </Button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss shared estimate"
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
