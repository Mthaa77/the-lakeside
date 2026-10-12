'use client';

/**
 * THE LAKESIDE — DEMO DISCLOSURE STRIP
 * A slim, dismissible strip pinned above the navbar: this is a concept demo
 * by Carter Digitals, not the official venue website. Honest by design —
 * it never claims endorsement, and it stays dismissible per visitor.
 *
 * Hydration-safe by construction: the dismissal flag is read through
 * useSyncExternalStore, whose SERVER snapshot is "dismissed" (hidden) and
 * whose CLIENT snapshot is the real localStorage value — no first-paint
 * mismatch, no setState-in-effect.
 */

import { useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const KEY = 'lakeside-demo-strip-dismissed';

/** Module-level listener registry — dismiss() notifies every mounted strip. */
let listeners: Array<() => void> = [];

function subscribe(cb: () => void) {
  listeners.push(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
    window.removeEventListener('storage', cb);
  };
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false; // private mode etc. — strip simply shows
  }
}

/** Server + hydration snapshot: visible. The strip is in the SSR HTML
 *  immediately; visitors who dismissed it see it collapse after hydration. */
function getServerSnapshot(): boolean {
  return false;
}

function dismiss() {
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    // ignore — session-only dismissal
  }
  listeners.forEach((l) => l());
}

export function DemoStrip() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      role="note"
      aria-label="Demo notice"
      className={cn(
        'relative bg-pine-950 text-gold-200/90 transition-all duration-500',
        dismissed && 'pointer-events-none h-0 overflow-hidden opacity-0',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-10 py-2 text-center sm:px-6">
        <p className="text-[10.5px] leading-snug tracking-wide sm:text-[11px]">
          Concept demo prepared by <span className="font-semibold text-gold-300">Carter Digitals</span>.
          Not the official The Lakeside website. Prices and details to be confirmed by The Lakeside.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss the demo notice"
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-gold-200/60 transition-colors hover:bg-white/10 hover:text-gold-200 sm:right-4"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
