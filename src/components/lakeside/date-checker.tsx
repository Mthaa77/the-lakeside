'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — DATE CHECKER
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom month calendar (plain divs/buttons — full control of day-cell states)
 * covering 2026-10 → 2027-12. NO invented availability: every day renders
 * 'unknown' ("Ask us", subtle sand-300 dot) until /api/availability exists.
 *
 * API hook-up: a useEffect fetches GET /api/availability and merges
 * { days: [{ day: '2026-11-07', state: 'booked' | 'limited' | 'available', note }] }
 * — wrapped in try/catch so any failure leaves every day 'unknown'.
 *
 * Events:
 *  - listens 'lakeside:prefill-date' (detail: { date }) → selects + navigates.
 *  - dispatches 'lakeside:estimate-date' (detail: { date }) via "Estimate this
 *    date" so the page can scroll to the estimator.
 */

import * as React from 'react';
import { BookmarkCheck, BookmarkPlus, CalendarDays, X } from 'lucide-react';

import {
  classifyDate,
  weekdayEligible,
  minAdultsFor,
  dayLabel,
  formatZAR,
} from '@/lib/pricing-engine';
import { PRICING } from '@/config/pricing';
import { WA_LINK } from '@/config/site';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ── Constants & helpers ─────────────────────────────────────────────────────

type AvailabilityState = 'unknown' | 'available' | 'limited' | 'held' | 'booked';
type AvailabilityDay = { day: string; state: AvailabilityState; note?: string };

/** Calendar range: October 2026 → December 2027. */
const MIN_IDX = 2026 * 12 + 9; // year*12 + (monthIndex)
const MAX_IDX = 2027 * 12 + 11;

const WEEKDAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const DAY_NAMES_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATE_LABEL: Record<AvailabilityState, string> = {
  unknown: 'Ask us',
  available: 'Available',
  limited: 'Limited',
  held: 'Held',
  booked: 'Booked',
};

const STATE_PILL: Record<AvailabilityState, string> = {
  unknown: 'border-sand-300 bg-sand-200/60 text-pine-900',
  available: 'border-pine-600/30 bg-pine-600/10 text-pine-700',
  limited: 'border-brass-500/40 bg-brass-500/10 text-brass-700',
  held: 'border-lake-600/40 bg-lake-600/10 text-lake-700',
  booked: 'border-ink-600/25 bg-ink-600/10 text-ink-600',
};

const SHORTLIST_KEY = 'lakeside-shortlist';
const SHORTLIST_MAX = 3;
const SHORTLIST_EVENT = 'lakeside:shortlist-changed';

const pad = (n: number) => String(n).padStart(2, '0');
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_NAMES_FULL[dow]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]?.slice(0, 3)} ${y}`;
}

/** Monday-first grid of ISO dates (null = leading/trailing blanks). */
function buildCells(y: number, m: number): (string | null)[] {
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const lead = (firstDow + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Merges availability from the API. Until /api/availability responds (or if it
 * ever fails) every day stays 'unknown' → "Ask us".
 * Re-fetches when the team edits a day in the availability board
 * (CustomEvent 'lakeside:availability-changed' from the hidden digest panel),
 * and when the visitor returns to the tab (throttled to once per 60s) so a
 * long-open page still shows the team's latest board.
 */
function useAvailability(): Record<string, AvailabilityDay> {
  const [days, setDays] = React.useState<Record<string, AvailabilityDay>>({});

  React.useEffect(() => {
    let cancelled = false;
    let lastFetch = 0;
    const load = async () => {
      lastFetch = Date.now();
      try {
        const res = await fetch('/api/availability', { cache: 'no-store' });
        if (!res.ok) return; // no endpoint yet → all days remain 'unknown'
        const data = (await res.json()) as { days?: AvailabilityDay[] };
        if (cancelled || !Array.isArray(data.days)) return;
        const map: Record<string, AvailabilityDay> = {};
        for (const d of data.days) {
          if (d && typeof d.day === 'string' && ISO_DATE_RE.test(d.day)) {
            map[d.day] = d;
          }
        }
        setDays(map);
      } catch {
        /* offline / 404 / bad JSON → failure means all days stay 'unknown' */
      }
    };
    // Returning to a stale tab re-checks the board (max once per minute).
    const onFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetch > 60_000) load();
    };
    load();
    window.addEventListener('lakeside:availability-changed', load);
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('lakeside:availability-changed', load);
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return days;
}

/** Listens for 'lakeside:prefill-date' { detail: { date } } from other blocks. */
function usePrefillDate(onDate: (iso: string) => void) {
  const cbRef = React.useRef(onDate);
  React.useEffect(() => {
    cbRef.current = onDate;
  });
  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ date?: string }>).detail;
      if (!detail?.date || !ISO_DATE_RE.test(detail.date)) return;
      cbRef.current(detail.date);
    };
    window.addEventListener('lakeside:prefill-date', handler);
    return () => window.removeEventListener('lakeside:prefill-date', handler);
  }, []);
}

/**
 * Saved-date shortlist ("compare your dates") — localStorage-backed, max 3,
 * synced across both checker instances via 'lakeside:shortlist-changed'.
 * Purely client-side convenience; never invents availability.
 */
function useShortlist() {
  const [dates, setDates] = React.useState<string[]>([]);

  const read = React.useCallback((): string[] => {
    try {
      const raw = window.localStorage.getItem(SHORTLIST_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw) as unknown;
      if (!Array.isArray(arr)) return [];
      return arr.filter((d): d is string => typeof d === 'string' && ISO_DATE_RE.test(d)).slice(0, SHORTLIST_MAX);
    } catch {
      return [];
    }
  }, []);

  React.useEffect(() => {
    setDates(read());
    const sync = () => setDates(read());
    window.addEventListener(SHORTLIST_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SHORTLIST_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [read]);

  const toggle = React.useCallback(
    (iso: string) => {
      const current = read();
      const next = current.includes(iso)
        ? current.filter((d) => d !== iso)
        : [...current, iso].slice(0, SHORTLIST_MAX);
      try {
        window.localStorage.setItem(SHORTLIST_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — non-essential */
      }
      setDates(next);
      window.dispatchEvent(new CustomEvent(SHORTLIST_EVENT));
    },
    [read],
  );

  return { dates, toggle };
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function DateChecker({ compact = false }: { compact?: boolean }) {
  return compact ? <CompactChecker /> : <FullChecker />;
}

// ── Full (inline) checker ───────────────────────────────────────────────────

function FullChecker() {
  const days = useAvailability();
  const [view, setView] = React.useState({ y: 2026, m: 10 });
  const [selected, setSelected] = React.useState('');
  const [today, setToday] = React.useState('');
  const shortlist = useShortlist();

  React.useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  usePrefillDate((iso) => {
    const [y, m] = iso.split('-').map(Number);
    const idx = y * 12 + (m - 1);
    if (idx >= MIN_IDX && idx <= MAX_IDX) setView({ y, m });
    setSelected(iso);
  });

  const estimateThis = React.useCallback((iso: string) => {
    window.dispatchEvent(new CustomEvent('lakeside:estimate-date', { detail: { date: iso } }));
  }, []);

  return (
    <section className="glass-card-light rounded-[4px] p-6 text-pine-900 md:p-8" aria-label="Check your wedding date">
      <header className="mb-6">
        <p className="eyebrow text-brass-600">Wedding dates 2026 – 2027</p>
        <h3 className="mt-1 font-display text-2xl md:text-3xl">Check your date</h3>
        <p className="mt-2 max-w-prose text-sm text-ink-600">
          Tap a day to see its day-type, venue hire and minimums. Days show
          “Ask us” until the team confirms real availability.
        </p>
      </header>

      <div className="max-w-sm">
        <MonthNav view={view} onViewChange={setView} />
        <CalendarGrid
          view={view}
          days={days}
          today={today}
          selected={selected}
          onSelect={setSelected}
        />
        <Legend />
      </div>

      {selected ? (
        <div className="mt-5 max-w-sm">
          <DateCard
            iso={selected}
            onEstimate={estimateThis}
            saved={shortlist.dates.includes(selected)}
            onToggleSave={shortlist.toggle}
            shortlistFull={shortlist.dates.length >= SHORTLIST_MAX}
            days={days}
            onSelect={(next) => {
              const [y, m] = next.split('-').map(Number);
              const idx = y * 12 + (m - 1);
              if (idx >= MIN_IDX && idx <= MAX_IDX) setView({ y, m });
              setSelected(next);
            }}
          />
        </div>
      ) : (
        <p className="mt-5 text-sm text-ink-600">Select a date to see its pricing details.</p>
      )}

      <div className="mt-6 max-w-2xl">
        <ShortlistPanel dates={shortlist.dates} onRemove={shortlist.toggle} onEstimate={estimateThis} />
      </div>

      <p className="mt-5 text-xs text-ink-600/80">
        Availability is only confirmed by the team — the calendar shows pricing,
        not live bookings.
      </p>
    </section>
  );
}

// ── Compact (popover pill) checker ──────────────────────────────────────────

function CompactChecker() {
  const days = useAvailability();
  const [view, setView] = React.useState({ y: 2026, m: 10 });
  const [selected, setSelected] = React.useState('');
  const [today, setToday] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const shortlist = useShortlist();

  React.useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  usePrefillDate((iso) => {
    const [y, m] = iso.split('-').map(Number);
    const idx = y * 12 + (m - 1);
    if (idx >= MIN_IDX && idx <= MAX_IDX) setView({ y, m });
    setSelected(iso);
  });

  const estimateThis = React.useCallback((iso: string) => {
    window.dispatchEvent(new CustomEvent('lakeside:estimate-date', { detail: { date: iso } }));
    setOpen(false);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          className="rounded-[4px] bg-pine-900 text-marble-50 hover:bg-pine-800"
          aria-haspopup="dialog"
        >
          {selected ? `Your date: ${shortDate(selected)}` : 'Check your date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[23rem] rounded-[4px] border-marble-200 p-4 text-pine-900"
      >
        <p className="eyebrow text-brass-600">Check your date</p>
        <div className="mt-3">
          <MonthNav compact view={view} onViewChange={setView} />
          <CalendarGrid
            view={view}
            days={days}
            today={today}
            selected={selected}
            onSelect={setSelected}
          />
          <Legend />
        </div>
        {selected ? (
          <div className="mt-4">
            <DateCard
              iso={selected}
              onEstimate={estimateThis}
              saved={shortlist.dates.includes(selected)}
              onToggleSave={shortlist.toggle}
              shortlistFull={shortlist.dates.length >= SHORTLIST_MAX}
              compact
              days={days}
              onSelect={(next) => {
                const [y, m] = next.split('-').map(Number);
                const idx = y * 12 + (m - 1);
                if (idx >= MIN_IDX && idx <= MAX_IDX) setView({ y, m });
                setSelected(next);
              }}
            />
          </div>
        ) : null}
        <p className="mt-3 text-[11px] leading-snug text-ink-600/80">
          Availability is only confirmed by the team — the calendar shows
          pricing, not live bookings.
        </p>
      </PopoverContent>
    </Popover>
  );
}

// ── Calendar pieces ─────────────────────────────────────────────────────────

function MonthNav({
  view,
  onViewChange,
  compact = false,
}: {
  view: { y: number; m: number };
  onViewChange: (v: { y: number; m: number }) => void;
  compact?: boolean;
}) {
  const idx = view.y * 12 + (view.m - 1);
  const go = (nextIdx: number) => {
    onViewChange({ y: Math.floor(nextIdx / 12), m: (nextIdx % 12) + 1 });
  };
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-[4px] border-marble-200 text-pine-900 hover:bg-marble-100"
        onClick={() => go(idx - 1)}
        disabled={idx <= MIN_IDX}
        aria-label="Previous month"
      >
        ‹
      </Button>
      <p className={cn('font-display text-pine-900', compact ? 'text-base' : 'text-lg')} aria-live="polite">
        {MONTH_NAMES[view.m - 1]} {view.y}
      </p>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-[4px] border-marble-200 text-pine-900 hover:bg-marble-100"
        onClick={() => go(idx + 1)}
        disabled={idx >= MAX_IDX}
        aria-label="Next month"
      >
        ›
      </Button>
    </div>
  );
}

function CalendarGrid({
  view,
  days,
  today,
  selected,
  onSelect,
}: {
  view: { y: number; m: number };
  days: Record<string, AvailabilityDay>;
  today: string;
  selected: string;
  onSelect: (iso: string) => void;
}) {
  const cells = React.useMemo(() => buildCells(view.y, view.m), [view.y, view.m]);
  return (
    <div>
      <div
        className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-600"
        aria-hidden
      >
        {WEEKDAY_HEADERS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) =>
          iso === null ? (
            <span key={`blank-${i}`} aria-hidden />
          ) : (
            <DayCell
              key={iso}
              iso={iso}
              state={days[iso]?.state ?? 'unknown'}
              note={days[iso]?.note}
              today={today}
              selected={selected === iso}
              onSelect={onSelect}
            />
          ),
        )}
      </div>
    </div>
  );
}

const DOT_STYLES: Record<AvailabilityState, string> = {
  unknown: 'bg-sand-300',
  available: 'bg-pine-600',
  limited: 'bg-brass-500',
  held: 'bg-lake-600',
  booked: 'bg-ink-600/30',
};

function DayCell({
  iso,
  state,
  note,
  today,
  selected,
  onSelect,
}: {
  iso: string;
  state: AvailabilityState;
  note?: string;
  today: string;
  selected: boolean;
  onSelect: (iso: string) => void;
}) {
  const dayNum = Number(iso.slice(8, 10));
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const isPast = today !== '' && iso < today;
  const stateLabel =
    state === 'unknown'
      ? 'ask us'
      : state === 'limited'
        ? 'limited availability'
        : state === 'held'
          ? 'held for another couple'
          : state;

  return (
    <button
      type="button"
      onClick={() => onSelect(iso)}
      disabled={isPast}
      aria-pressed={selected}
      aria-label={`${DAY_NAMES_FULL[dow]} ${d} ${MONTH_NAMES[m - 1]} ${y} — ${stateLabel}${note ? `: ${note}` : ''}`}
      title={note ?? (state === 'unknown' ? 'Ask us' : stateLabel)}
      className={cn(
        'relative flex size-11 items-center justify-center rounded-[4px] border text-sm transition-colors',
        selected
          ? 'border-brass-500 bg-pine-900 font-semibold text-marble-50'
          : 'border-transparent text-pine-900 hover:border-brass-500/50 hover:bg-marble-100',
        state === 'booked' && !selected && 'text-ink-600/40 line-through',
        isPast && 'cursor-not-allowed opacity-30 hover:border-transparent hover:bg-transparent',
      )}
    >
      {dayNum}
      <span
        aria-hidden
        className={cn(
          'absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full',
          selected ? 'bg-brass-400' : DOT_STYLES[state],
        )}
      />
    </button>
  );
}

function Legend() {
  const items: { label: string; dot: string }[] = [
    { label: 'Available', dot: DOT_STYLES.available },
    { label: 'Limited', dot: DOT_STYLES.limited },
    { label: 'Held', dot: DOT_STYLES.held },
    { label: 'Ask us', dot: DOT_STYLES.unknown },
    { label: 'Booked', dot: DOT_STYLES.booked },
  ];
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('size-2 rounded-full', it.dot)} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

// ── Selected-date card ──────────────────────────────────────────────────────

function DateCard({
  iso,
  onEstimate,
  saved,
  onToggleSave,
  shortlistFull,
  compact = false,
  days = {},
  onSelect,
}: {
  iso: string;
  onEstimate: (iso: string) => void;
  saved: boolean;
  onToggleSave: (iso: string) => void;
  shortlistFull: boolean;
  compact?: boolean;
  days?: Record<string, AvailabilityDay>;
  onSelect?: (iso: string) => void;
}) {
  const c = React.useMemo(() => classifyDate(iso), [iso]);
  const min = minAdultsFor(c);
  const hire = PRICING.venueHire[c.hireKey];
  const eligible = weekdayEligible(c);

  // Wedding-day countdown (same chip as the estimator results header).
  const daysToGo = Math.round(
    (new Date(`${iso}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
  );

  const chips: string[] = [
    `${capitalize(dayLabel(c))} — venue hire ${formatZAR(hire)}`,
    `Minimum ${min} paying adults`,
  ];
  if (eligible) {
    chips.push(
      `Weekday all-inclusive available — from ${formatZAR(PRICING.weekday.tiers[20])} for 20 guests`,
    );
  }
  if (c.isWinter) chips.push('Winter (June – August) — ask about specials');
  if (c.isDecember) chips.push('December — the weekend rate card applies');
  if (!c.yearConfigured) chips.push('Beyond 2027 — price on request');

  const wa = WA_LINK(
    `Hi The Lakeside! Is ${prettyDate(iso)} available for a wedding? Please could you confirm availability and next steps?`,
  );

  const saveBlocked = !saved && shortlistFull;

  // Nearby same-weekday dates when the team has marked this day booked/held.
  // Real data only: state comes from the team's availability board; days without
  // a row stay “Ask us”. Past dates and dates outside the calendar window are excluded.
  const state = days[iso]?.state ?? 'unknown';
  const nearby = React.useMemo(() => {
    if (state !== 'booked' && state !== 'held') return [];
    const [y, m, d] = iso.split('-').map(Number);
    const base = Date.UTC(y, m - 1, d);
    const dow = new Date(base).getUTCDay();
    const todayIso = new Date().toISOString().slice(0, 10);
    const out: { iso: string; state: AvailabilityState }[] = [];
    for (let w = 1; w <= 8 && out.length < 4; w++) {
      for (const dir of [1, -1] as const) {
        if (out.length >= 4) break;
        const t = new Date(base + dir * w * 7 * 86_400_000);
        if (t.getUTCDay() !== dow) continue; // month-edge guard
        const cand = t.toISOString().slice(0, 10);
        if (cand <= todayIso) continue;
        const idx = t.getUTCFullYear() * 12 + t.getUTCMonth();
        if (idx < MIN_IDX || idx > MAX_IDX) continue;
        if (out.some((n) => n.iso === cand)) continue;
        out.push({ iso: cand, state: days[cand]?.state ?? 'unknown' });
      }
      // keep chronological order within the pair
      out.sort((a, b) => a.iso.localeCompare(b.iso));
    }
    return out;
  }, [iso, state, days]);
  const [ny, nm, nd] = iso.split('-').map(Number);
  const weekdayName = DAY_NAMES_FULL[new Date(Date.UTC(ny, nm - 1, nd)).getUTCDay()];

  return (
    <div
      aria-live="polite"
      className="rounded-[4px] border border-marble-200 border-t-2 border-t-brass-500 bg-white/70 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-brass-600">Your date</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h4 className="font-display text-xl">{prettyDate(iso)}</h4>
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
                STATE_PILL[state],
              )}
              title={`The team's current state for this date — availability is confirmed by a person, never by this calendar`}
            >
              {STATE_LABEL[state]}
            </span>
            {daysToGo > 0 ? (
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
                  daysToGo <= 100
                    ? 'border-ember-500/60 bg-ember-500/10 text-ember-600'
                    : 'border-brass-500/50 bg-brass-500/10 text-pine-900',
                )}
                title={
                  daysToGo <= 100
                    ? 'Under 100 days — a good moment to confirm final numbers with the team'
                    : undefined
                }
              >
                {daysToGo === 1 ? '1 day to go' : `${daysToGo} days to go`}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleSave(iso)}
          disabled={saveBlocked}
          aria-pressed={saved}
          title={
            saved
              ? 'Remove from your shortlist'
              : saveBlocked
                ? 'Shortlist is full — remove a date first'
                : 'Save to compare with other dates'
          }
          className={cn(
            'inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-xs font-medium transition-colors',
            saved
              ? 'border-brass-500 bg-brass-500/15 text-brass-700'
              : 'border-marble-200 bg-white text-pine-900 hover:border-brass-500 hover:bg-brass-500/10',
            saveBlocked && 'cursor-not-allowed opacity-50',
          )}
        >
          {saved ? (
            <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      <ul className="mt-3 space-y-1.5">
        {chips.map((chip) => (
          <li key={chip} className="flex items-start gap-2 text-sm text-pine-900">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brass-500" />
            {chip}
          </li>
        ))}
      </ul>
      {!saved && shortlistFull ? (
        <p role="status" className="mt-3 rounded-[4px] border border-brass-500/40 bg-sand-200/60 px-3 py-2 text-xs text-pine-900">
          Your shortlist holds three dates — remove one below to save this instead.
        </p>
      ) : null}
      {nearby.length > 0 ? (
        <div className="mt-3 rounded-[4px] border border-marble-200 bg-marble-50/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
            {state === 'booked'
              ? `The team has marked this date booked — nearby ${weekdayName}s`
              : `The team currently holds this date — nearby ${weekdayName}s`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nearby.map((n) => {
              const cand = classifyDate(n.iso);
              return (
                <button
                  key={n.iso}
                  type="button"
                  onClick={() => onSelect?.(n.iso)}
                  className={cn(
                    'inline-flex min-h-[44px] items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs transition-colors',
                    'border-marble-200 text-pine-900 hover:border-brass-500 hover:bg-brass-500/10',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/70 focus-visible:ring-offset-1',
                  )}
                  aria-label={`Show ${prettyDate(n.iso)} — ${STATE_LABEL[n.state]}`}
                >
                  <span aria-hidden className={cn('size-2 shrink-0 rounded-full', DOT_STYLES[n.state])} />
                  <span className="font-medium tabular-nums">{shortDate(n.iso)}</span>
                  <span className="text-ink-600">· {STATE_LABEL[n.state]}</span>
                  <span className="hidden text-ink-600/70 sm:inline">· hire {formatZAR(PRICING.venueHire[cand.hireKey])}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-ink-600/80">
            States come from the team’s live board — every date is confirmed by a person, never by this calendar.
          </p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => onEstimate(iso)}
          className="rounded-[4px] bg-pine-900 text-marble-50 hover:bg-pine-800"
        >
          Estimate this date
        </Button>
        <Button asChild variant="outline" className="rounded-[4px] border-pine-900/30 text-pine-900 hover:bg-marble-100">
          <a href={wa} target="_blank" rel="noopener noreferrer">
            Ask if it’s free
          </a>
        </Button>
        {!compact ? (
          <p className="w-full text-xs text-ink-600/80 sm:w-auto sm:self-center">
            Saving dates lets you compare day types side by side.
          </p>
        ) : null}
      </div>
    </div>
  );
}

// ── Shortlist panel (compare saved dates) ────────────────────────────────

function ShortlistPanel({
  dates,
  onRemove,
  onEstimate,
}: {
  dates: string[];
  onRemove: (iso: string) => void;
  onEstimate: (iso: string) => void;
}) {
  if (dates.length === 0) {
    return (
      <p className="rounded-[4px] border border-dashed border-marble-200 px-4 py-3 text-sm text-ink-600">
        No saved dates yet — tap a day, then “Save” to compare up to three
        dates side by side.
      </p>
    );
  }

  const rows = [...dates]
    .sort((a, b) => a.localeCompare(b))
    .map((iso) => {
      const c = classifyDate(iso);
      return {
        iso,
        label: dayLabel(c),
        hire: PRICING.venueHire[c.hireKey],
        min: minAdultsFor(c),
        eligible: weekdayEligible(c),
        winter: c.isWinter,
        december: c.isDecember,
      };
    });

  return (
    <div aria-label="Saved dates shortlist">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-brass-600" aria-hidden="true" />
        <h4 className="font-display text-lg text-pine-900">Your shortlist</h4>
        <span className="text-xs text-ink-600">
          {dates.length} of {SHORTLIST_MAX}
        </span>
      </div>
      <ul className="divide-y divide-marble-200 overflow-hidden rounded-[4px] border border-marble-200 bg-white/70">
        {rows.map((row) => (
          <li
            key={row.iso}
            className="flex flex-col gap-3 border-l-2 border-l-brass-500 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-display text-base text-pine-900">{prettyDate(row.iso)}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-600">
                <span className="font-medium capitalize text-pine-900">{row.label}</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">venue hire {formatZAR(row.hire)}</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">min {row.min} adults</span>
                {row.eligible ? (
                  <span className="rounded-full bg-pine-600/10 px-2 py-0.5 font-medium text-pine-700">
                    Weekday all-inclusive
                  </span>
                ) : null}
                {row.winter ? (
                  <span className="rounded-full bg-lake-600/10 px-2 py-0.5 text-lake-700">Winter</span>
                ) : null}
                {row.december ? (
                  <span className="rounded-full bg-brass-500/15 px-2 py-0.5 text-brass-700">December</span>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onEstimate(row.iso)}
                className="inline-flex min-h-[44px] items-center rounded-[4px] bg-pine-900 px-3.5 py-1.5 text-xs font-medium text-marble-50 transition-colors hover:bg-pine-800"
              >
                Estimate
              </button>
              <button
                type="button"
                onClick={() => onRemove(row.iso)}
                aria-label={`Remove ${prettyDate(row.iso)} from your shortlist`}
                className="inline-flex size-11 items-center justify-center rounded-[4px] text-ink-600 transition-colors hover:bg-ember-500/10 hover:text-ember-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Remove</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-600/80">
        Saved on this device only. Availability stays “ask us” until the team confirms.
      </p>
    </div>
  );
}
