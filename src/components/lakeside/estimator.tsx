'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — ESTIMATOR
 * ─────────────────────────────────────────────────────────────────────────────
 * variant="full": 5-step guided stepper (Date → Guests → Package → Extras →
 *                 Your estimate). All money comes from the pricing engine —
 *                 this component never calculates.
 * variant="mini": compact one-row widget (date + guests + package + instant
 *                 total) that still runs through the engine.
 *
 * Events:
 *  - listens  'lakeside:estimate-date' (detail: { date }) → sets the date,
 *             auto-selects the package by weekday eligibility, jumps to results.
 *  - listens  'lakeside:restore-quote' (detail: { date, adults, children,
 *             topUp }) → restores a shared/saved estimate, jumps to results.
 *  - writes   localStorage 'lakeside-quote' summary when results are shown
 *             (return-visitor nudge) and POSTs it to /api/quotes for the
 *             share link (?q=SHORTID).
 */

import * as React from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';

import {
  classifyDate,
  weekdayEligible,
  estimate,
  estimateWeekendCard,
  estimateWeekday,
  dayLabel,
  formatZAR,
  type DateClass,
  type PackageOption,
  type EstimateResult,
  type EstimateError,
} from '@/lib/pricing-engine';
import { PRICING, PACKAGE_INCLUSIONS } from '@/config/pricing';
import { WA_LINK } from '@/config/site';
import { cn } from '@/lib/utils';
import { buildIcs, downloadIcs } from '@/lib/ics';
import { AlertTriangle, CalendarPlus, Check, Info, Link2, Mail, Printer, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

export type EstimatorVariant = 'full' | 'mini';

// ── Constants & helpers ─────────────────────────────────────────────────────

const STEPS = ['Date', 'Guests', 'Package', 'Extras', 'Your estimate'] as const;
const MAX_DATE = '2027-12-31';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const DAY_NAMES_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

const pad = (n: number) => String(n).padStart(2, '0');
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_NAMES_FULL[dow]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]?.slice(0, 3)} ${y}`;
}

/** First Saturday on/after the 1st of the month (representative flex date). */
function firstSaturday(y: number, m: number): string {
  const dow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const day = 1 + ((6 - dow + 7) % 7);
  return `${y}-${pad(m)}-${pad(day)}`;
}

/** Rate card for the event year (falls back to 2026 when unconfigured). */
function rateCardFor(dateClass: DateClass | null) {
  return (dateClass && PRICING.years[dateClass.year]) || PRICING.years[2026];
}

// ── Shared UI atoms ─────────────────────────────────────────────────────────

const CHIP_STYLES = {
  default: 'border-marble-200 bg-white/70 text-pine-900',
  brass: 'border-brass-500/40 bg-sand-200/60 text-pine-900',
  pine: 'border-pine-900 bg-pine-900 text-marble-50',
} as const;

function Chip({ label, tone = 'default' }: { label: string; tone?: keyof typeof CHIP_STYLES }) {
  return (
    <li
      className={cn(
        'rounded-[4px] border px-2.5 py-1 text-xs font-medium',
        CHIP_STYLES[tone],
      )}
    >
      {label}
    </li>
  );
}

function DayTypeChips({ c, prefix }: { c: DateClass; prefix?: string }) {
  return (
    <div>
      {prefix ? <p className="mb-1.5 text-xs text-ink-600">{prefix}</p> : null}
      <ul className="flex flex-wrap gap-2">
        <Chip label={capitalize(dayLabel(c))} />
        {c.isWinter ? <Chip label="Winter — ask about specials" tone="brass" /> : null}
        {c.isDecember ? <Chip label="December — weekend rates apply on weekdays" tone="brass" /> : null}
        {weekdayEligible(c) ? <Chip label="Weekday package available" tone="pine" /> : null}
        {!c.yearConfigured ? <Chip label="Beyond 2027 — price on request" tone="brass" /> : null}
      </ul>
    </div>
  );
}

/** Animated count-up money value; instant when reduced motion is preferred. */
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(value);
  const prevRef = React.useRef(value);

  React.useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || prevRef.current === value) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    const controls = animate(prevRef.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prevRef.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className="tabular-nums">{formatZAR(display)}</span>;
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function Estimator({ variant }: { variant: EstimatorVariant }) {
  if (variant === 'mini') return <MiniEstimator />;
  return <FullEstimator />;
}

// ── FULL variant ────────────────────────────────────────────────────────────

type AddonsState = {
  fairyLights: boolean;
  patioHeaters: boolean;
  harvestTable: boolean;
  lateSnacks: boolean;
  animalFeed: boolean;
  nespressoBar: boolean;
};

function FullEstimator() {
  const rootRef = React.useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1); // 1 = forward, -1 = back
  const [quoteShortId, setQuoteShortId] = React.useState('');

  // Direction-aware step navigation (step pills + back/continue)
  const goTo = React.useCallback(
    (next: number) => {
      const clamped = clamp(next, 0, STEPS.length - 1);
      setDirection(clamped >= step ? 1 : -1);
      setStep(clamped);
    },
    [step],
  );

  // Mount-only values (avoid SSR/client mismatch for "today")
  const [today, setToday] = React.useState('');
  React.useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  // Step 1 — date
  const [date, setDate] = React.useState('');
  const [noDateYet, setNoDateYet] = React.useState(false);
  const [flexMonth, setFlexMonth] = React.useState(''); // 'YYYY-MM'

  // Step 2 — guests
  const [adults, setAdults] = React.useState(100);
  const [children, setChildren] = React.useState(0);
  const [danceFloor, setDanceFloor] = React.useState(true);

  // Step 3 — package
  const [pkg, setPkg] = React.useState<PackageOption>('weekend');

  // Step 4 — extras
  const [rooms, setRooms] = React.useState({ heritage: 0, manor: 0, suite: 0 });
  const [nights, setNights] = React.useState(1);
  const [addons, setAddons] = React.useState<AddonsState>({
    fairyLights: false,
    patioHeaters: false,
    harvestTable: false,
    lateSnacks: false,
    animalFeed: false,
    nespressoBar: false,
  });

  // ── Derived date model ────────────────────────────────────────────────────

  const flexRepDate =
    flexMonth && ISO_DATE_RE.test(flexMonth)
      ? firstSaturday(Number(flexMonth.slice(0, 4)), Number(flexMonth.slice(5, 7)))
      : '';
  const effectiveDate = date || flexRepDate;

  const dateClass = React.useMemo(
    () => (effectiveDate ? classifyDate(effectiveDate) : null),
    [effectiveDate],
  );
  const eligible = dateClass ? weekdayEligible(dateClass) : false;

  // ── Guests / capacity model ───────────────────────────────────────────────

  const totalAttendance = adults + children;
  const danceFloorBlocked = totalAttendance > PRICING.capacity.withDanceFloor;
  const danceFloorFinal = danceFloor && !danceFloorBlocked;

  React.useEffect(() => {
    if (danceFloorBlocked && danceFloor) setDanceFloor(false);
  }, [danceFloorBlocked, danceFloor]);

  // Keep package valid if the date changes after selection
  React.useEffect(() => {
    if (pkg === 'weekday' && !eligible) setPkg('weekend');
  }, [pkg, eligible]);

  // ── Engine call (the only place money is computed) ────────────────────────

  const bundle = React.useMemo(() => {
    if (!effectiveDate) return null;
    return estimate({
      date: effectiveDate,
      adults,
      children,
      topUp: pkg === 'weekend-topup',
      danceFloor: danceFloorFinal,
      addons,
      rooms: { ...rooms, nights },
    });
  }, [effectiveDate, adults, children, pkg, danceFloorFinal, addons, rooms, nights]);

  const result: EstimateResult | EstimateError | null = !bundle
    ? null
    : pkg === 'weekday' && bundle.weekday
      ? bundle.weekday
      : bundle.weekend;

  // ── External event: 'lakeside:estimate-date' ──────────────────────────────

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ date?: string }>).detail;
      if (!detail?.date || !ISO_DATE_RE.test(detail.date)) return;
      const c = classifyDate(detail.date);
      setDate(detail.date);
      setNoDateYet(false);
      setPkg(weekdayEligible(c) ? 'weekday' : 'weekend');
      setStep(STEPS.length - 1);
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('lakeside:estimate-date', handler);
    return () => window.removeEventListener('lakeside:estimate-date', handler);
  }, []);

  // ── External event: 'lakeside:estimate-guests' (from the estate explorer) ─

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ guests?: number }>).detail;
      const g = Number(detail?.guests);
      if (!Number.isFinite(g)) return;
      setAdults(Math.min(Math.max(Math.round(g), 20), 200));
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('lakeside:estimate-guests', handler);
    return () => window.removeEventListener('lakeside:estimate-guests', handler);
  }, []);

  // ── External event: 'lakeside:restore-quote' (shared-estimate links) ──────

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{
        date?: string;
        adults?: number;
        children?: number;
        topUp?: boolean;
      }>).detail;
      if (!detail) return;
      if (detail.date && ISO_DATE_RE.test(detail.date)) {
        const c = classifyDate(detail.date);
        setDate(detail.date);
        setNoDateYet(false);
        setFlexMonth('');
        setPkg(
          detail.topUp
            ? 'weekend-topup'
            : weekdayEligible(c)
              ? 'weekday'
              : 'weekend',
        );
      }
      if (Number.isFinite(detail.adults)) setAdults(clamp(Math.round(Number(detail.adults)), 20, 200));
      if (Number.isFinite(detail.children)) setChildren(clamp(Math.round(Number(detail.children)), 0, 100));
      setStep(STEPS.length - 1);
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('lakeside:restore-quote', handler);
    return () => window.removeEventListener('lakeside:restore-quote', handler);
  }, []);

  // ── Local quote summary (return-visitor nudge) ────────────────────────────

  const quoteSummary = React.useMemo(
    () =>
      result && result.ok
        ? { date: effectiveDate, adults, children, package: result.packageName, total: result.total, deposit: result.deposit.amount }
        : null,
    [result, effectiveDate, adults, children],
  );

  React.useEffect(() => {
    if (step !== STEPS.length - 1 || !quoteSummary) return;
    try {
      const entry = JSON.stringify({ ...quoteSummary, savedAt: new Date().toISOString() });
      window.localStorage.setItem('lakeside-quote', entry);
      // Device-local history (max 5, newest first) for the "Your estimates on
      // this device" panel. Same data the nudge uses — nothing leaves the browser.
      const HISTORY_KEY = 'lakeside-quotes-history';
      let list: unknown[] = [];
      try {
        const raw = window.localStorage.getItem(HISTORY_KEY);
        if (raw) list = JSON.parse(raw) as unknown[];
      } catch { /* unreadable history — start fresh */ }
      const sig = `${quoteSummary.date}|${quoteSummary.adults}|${quoteSummary.children}|${quoteSummary.package}`;
      const filtered = (Array.isArray(list) ? list : []).filter((item) => {
        const it = item as { date?: unknown; adults?: unknown; children?: unknown; package?: unknown };
        return `${it.date}|${it.adults}|${it.children}|${it.package}` !== sig;
      });
      filtered.unshift(JSON.parse(entry) as unknown);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 5)));
      window.dispatchEvent(new CustomEvent('lakeside:quotes-history-changed'));
    } catch {
      /* storage unavailable — the nudge is non-essential */
    }
    // Save the quote server-side (fire and forget — the estimate still works offline)
    fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: quoteSummary.date ?? effectiveDate,
        adults,
        children,
        topUp: pkg === 'weekend-topup',
        packageName: quoteSummary.package,
        total: quoteSummary.total,
        deposit: quoteSummary.deposit ?? undefined,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && typeof json.shortId === 'string') setQuoteShortId(json.shortId);
      })
      .catch(() => { /* non-essential */ });
     
  }, [step, quoteSummary]);

  // ── Month/season options for "no date yet" ────────────────────────────────

  const monthOptions = React.useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const now = today
      ? { y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) }
      : { y: 2026, m: 10 };
    if (now.y > 2027) return opts;
    let y = Math.max(2026, now.y);
    let m = 1;
    if (y === 2026) m = now.y === 2026 ? Math.max(10, now.m) : 10;
    if (y === 2027 && now.y === 2027) m = Math.max(1, now.m);
    for (; y <= 2027; y++) {
      for (let mm = y === Math.max(2026, now.y) ? m : 1; mm <= 12; mm++) {
        opts.push({ value: `${y}-${pad(mm)}`, label: `${MONTH_NAMES[mm - 1]} ${y}` });
      }
    }
    return opts;
  }, [today]);

  const flexLabel = monthOptions.find((o) => o.value === flexMonth)?.label ?? '';

  // ── Step navigation ───────────────────────────────────────────────────────

  const canContinue =
    step === 0 ? date !== '' || (noDateYet && flexMonth !== '') : true;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      ref={rootRef}
      id="estimator"
      className="text-pine-900"
      aria-label="Wedding estimate builder"
    >
      <header className="mb-8">
        <p className="eyebrow text-brass-600">Plan your day</p>
        <h3 className="font-display text-3xl text-balance md:text-4xl">
          Your Lakeside estimate
        </h3>
        <p className="mt-2 max-w-prose text-sm text-ink-600 md:text-base">
          Five quick steps — priced live from our 2026 / 2027 rate card. No
          surprises, no obligations.
        </p>
      </header>

      {/* Progress / stepper */}
      <nav aria-label="Estimator steps" className="mb-8">
        <div
          className="h-1 w-full overflow-hidden rounded-[4px] bg-marble-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STEPS.length - 1}
          aria-valuenow={step}
          aria-label="Estimator progress"
        >
          <div
            className="h-full bg-brass-500 transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        <ol className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {STEPS.map((name, i) => (
            <li key={name} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => goTo(i)}
                disabled={i > step}
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 text-xs font-medium transition-opacity',
                  i > step ? 'cursor-not-allowed opacity-40' : 'hover:opacity-80',
                  i === step ? 'text-pine-900' : 'text-ink-600',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-[10px] font-semibold',
                    i < step && 'bg-brass-500 text-white',
                    i === step && 'bg-pine-900 text-marble-50',
                    i > step && 'bg-marble-200 text-ink-600',
                  )}
                  aria-hidden
                >
                  {i < step ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{name}</span>
              </button>
              {i < STEPS.length - 1 ? (
                <span className="hidden h-px w-6 bg-marble-200 sm:block" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction >= 0 ? 36 : -36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction >= 0 ? -36 : 36 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
        {step === 0 ? (
          <fieldset className="glass-card-light rounded-[4px] p-6 md:p-8">
            <legend className="eyebrow px-1 text-brass-600">Step 1 · Date</legend>
            <h4 className="font-display text-2xl">When are you getting married?</h4>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="est-date" className="text-sm">
                  Wedding date
                </Label>
                <Input
                  id="est-date"
                  type="date"
                  min={today || undefined}
                  max={MAX_DATE}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 w-full bg-white/70 md:w-56"
                />
                {date && dateClass ? (
                  <div className="mt-3">
                    <DayTypeChips c={dateClass} />
                  </div>
                ) : null}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="est-no-date"
                    checked={noDateYet}
                    onCheckedChange={(v) => setNoDateYet(v === true)}
                  />
                  <Label htmlFor="est-no-date" className="text-sm">
                    I don’t have a date yet
                  </Label>
                </div>
                {noDateYet ? (
                  <div className="mt-3">
                    <Label htmlFor="est-flex-month" className="text-sm">
                      Roughly when?
                    </Label>
                    <Select value={flexMonth} onValueChange={setFlexMonth}>
                      <SelectTrigger
                        id="est-flex-month"
                        className="mt-2 w-full bg-white/70 md:w-56"
                      >
                        <SelectValue placeholder="Choose a month" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {flexMonth && flexRepDate ? (
                      <div className="mt-3">
                        <DayTypeChips
                          c={classifyDate(flexRepDate)}
                          prefix={`Priced as a typical Saturday in ${flexLabel} — exact day shifts the rate.`}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Estimates already priced on this device — one tap back to them */}
            <RecentEstimates />
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset className="glass-card-light rounded-[4px] p-6 md:p-8">
            <legend className="eyebrow px-1 text-brass-600">Step 2 · Guests</legend>
            <h4 className="font-display text-2xl">How many are celebrating?</h4>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="est-adults-slider" className="text-sm">
                  Adult guests
                </Label>
                <div className="mt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-[4px] border-marble-200"
                    aria-label="Fewer adults"
                    onClick={() => setAdults((a) => clamp(a - 5, 20, 200))}
                  >
                    −
                  </Button>
                  <span
                    id="est-adults"
                    aria-live="polite"
                    className="w-12 text-center font-display text-3xl tabular-nums"
                  >
                    {adults}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-[4px] border-marble-200"
                    aria-label="More adults"
                    onClick={() => setAdults((a) => clamp(a + 5, 20, 200))}
                  >
                    +
                  </Button>
                </div>
                <Slider
                  id="est-adults-slider"
                  aria-label="Adult guests"
                  className="mt-5 w-full max-w-sm"
                  min={20}
                  max={200}
                  step={1}
                  value={[adults]}
                  onValueChange={(v) => setAdults(clamp(v[0] ?? adults, 20, 200))}
                />
                <p className="mt-2 text-xs text-ink-600">
                  Slide or use the buttons — 20 to 200 guests.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="est-children" className="text-sm">
                    Children under 12
                  </Label>
                  <Input
                    id="est-children"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={80}
                    value={children}
                    onChange={(e) =>
                      setChildren(clamp(Number(e.target.value) || 0, 0, 80))
                    }
                    className="mt-2 w-24 bg-white/70"
                  />
                  <p className="mt-1 text-xs text-ink-600">
                    {formatZAR(rateCardFor(dateClass).addons.childU12)} each —
                    canapés, kids’ main and dessert.
                  </p>
                </div>

                <div className="rounded-[4px] border border-marble-200 bg-white/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="est-dance-floor" className="text-sm">
                        Dance floor
                      </Label>
                      <p className="mt-1 text-xs text-ink-600">
                        The marble reception seats{' '}
                        <strong className="font-semibold">
                          {PRICING.capacity.withDanceFloor} with a dance floor
                        </strong>{' '}
                        or{' '}
                        <strong className="font-semibold">
                          {PRICING.capacity.max} without
                        </strong>
                        .
                      </p>
                    </div>
                    <Switch
                      id="est-dance-floor"
                      checked={danceFloor}
                      onCheckedChange={(v) => setDanceFloor(v)}
                      disabled={danceFloorBlocked}
                      className="data-[state=checked]:bg-brass-500"
                    />
                  </div>
                  {danceFloorBlocked ? (
                    <p
                      role="status"
                      className="mt-3 rounded-[4px] border border-brass-500/40 bg-sand-200/60 px-3 py-2 text-xs text-pine-900"
                    >
                      With {totalAttendance} guests we’ve removed the dance floor
                      so everyone fits comfortably.
                    </p>
                  ) : null}
                  {totalAttendance > PRICING.capacity.max ? (
                    <p
                      role="status"
                      className="mt-3 rounded-[4px] border border-ember-500/40 bg-ember-500/10 px-3 py-2 text-xs text-pine-900"
                    >
                      The reception holds {PRICING.capacity.max} guests in total —
                      we’ll talk options for larger parties.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset className="glass-card-light rounded-[4px] p-6 md:p-8">
            <legend className="eyebrow px-1 text-brass-600">Step 3 · Package</legend>
            <h4 className="font-display text-2xl">Choose your package</h4>

            {dateClass?.dayType === 'thu' ? (
              <p className="mt-3 rounded-[4px] border border-brass-500/40 bg-sand-200/60 px-3 py-2 text-sm text-pine-900">
                Thursdays qualify for both rates — compare the weekend card and
                the weekday all-inclusive below.
              </p>
            ) : null}
            {bundle?.fallbackReason ? (
              <p className="mt-3 rounded-[4px] border border-brass-500/40 bg-sand-200/60 px-3 py-2 text-sm text-pine-900">
                {bundle.fallbackReason}
              </p>
            ) : null}

            <div
              className={cn(
                'mt-6 grid gap-4',
                eligible ? 'md:grid-cols-3' : 'md:grid-cols-2',
              )}
            >
              <PackageCard
                option="weekend"
                selected={pkg === 'weekend'}
                onSelect={() => setPkg('weekend')}
                name="Weekend standard"
                courses={PACKAGE_INCLUSIONS.weekend.mealCourses}
                bullets={PACKAGE_INCLUSIONS.weekend.extras.slice(0, 4)}
                deposit={PACKAGE_INCLUSIONS.weekend.deposit}
              />
              <PackageCard
                option="weekend-topup"
                selected={pkg === 'weekend-topup'}
                onSelect={() => setPkg('weekend-topup')}
                name="Weekend + Top-up"
                courses={PACKAGE_INCLUSIONS.weekend.mealCourses}
                bullets={PACKAGE_INCLUSIONS.topUp.extras.slice(0, 4)}
                deposit={PACKAGE_INCLUSIONS.weekend.deposit}
                note={`Everything in Weekend standard, + ${formatZAR(rateCardFor(dateClass).topUpPP)} per person`}
              />
              {eligible ? (
                <PackageCard
                  option="weekday"
                  selected={pkg === 'weekday'}
                  onSelect={() => setPkg('weekday')}
                  name="Weekday all-inclusive"
                  courses={PACKAGE_INCLUSIONS.weekday.mealCourses}
                  bullets={PACKAGE_INCLUSIONS.weekday.extras.slice(0, 4)}
                  deposit={PACKAGE_INCLUSIONS.weekday.deposit}
                  badges={[
                    PACKAGE_INCLUSIONS.weekday.djIncluded ? 'DJ & sound included' : '',
                    PACKAGE_INCLUSIONS.weekday.cakeIncluded ? 'Cake included' : '',
                  ].filter(Boolean)}
                />
              ) : null}
            </div>
          </fieldset>
        ) : null}

        {step === 3 ? (
          <fieldset className="glass-card-light rounded-[4px] p-6 md:p-8">
            <legend className="eyebrow px-1 text-brass-600">Step 4 · Extras</legend>
            <h4 className="font-display text-2xl">Rooms & finishing touches</h4>

            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Accommodation</p>
                <p className="mt-1 text-xs text-ink-600">
                  Every room sleeps 2 — up to {PRICING.accommodation.maxRooms}{' '}
                  rooms across the estate. The bridal party collects room
                  payments.
                </p>
                <div className="mt-4 space-y-3">
                  <RoomStepper
                    label="Heritage House room"
                    price={rateCardFor(dateClass).rooms.heritage}
                    value={rooms.heritage}
                    plusDisabled={rooms.heritage + rooms.manor + rooms.suite >= PRICING.accommodation.maxRooms}
                    onChange={(v) => setRooms((r) => ({ ...r, heritage: v }))}
                  />
                  <RoomStepper
                    label="Manor House room"
                    price={rateCardFor(dateClass).rooms.manor}
                    value={rooms.manor}
                    plusDisabled={rooms.heritage + rooms.manor + rooms.suite >= PRICING.accommodation.maxRooms}
                    onChange={(v) => setRooms((r) => ({ ...r, manor: v }))}
                  />
                  <RoomStepper
                    label="Bridal Suite / Groom’s Cabin"
                    price={rateCardFor(dateClass).rooms.suite}
                    value={rooms.suite}
                    plusDisabled={rooms.heritage + rooms.manor + rooms.suite >= PRICING.accommodation.maxRooms}
                    onChange={(v) => setRooms((r) => ({ ...r, suite: v }))}
                  />
                </div>
                <div className="mt-4">
                  <Label htmlFor="est-nights" className="text-sm">
                    Nights
                  </Label>
                  <Select
                    value={String(nights)}
                    onValueChange={(v) => setNights(Number(v))}
                  >
                    <SelectTrigger
                      id="est-nights"
                      className="mt-2 w-36 bg-white/70"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 night</SelectItem>
                      <SelectItem value="2">2 nights</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Add-ons</p>
                <div className="mt-4 space-y-3">
                  <AddonToggle
                    id="addon-lights"
                    label="Fairy lights"
                    price={`${formatZAR(rateCardFor(dateClass).addons.fairyLights)}`}
                    checked={addons.fairyLights}
                    onChange={(v) => setAddons((a) => ({ ...a, fairyLights: v }))}
                  />
                  <AddonToggle
                    id="addon-heaters"
                    label="Patio heaters (×4)"
                    price={`${formatZAR(rateCardFor(dateClass).addons.patioHeaters)}`}
                    checked={addons.patioHeaters}
                    onChange={(v) => setAddons((a) => ({ ...a, patioHeaters: v }))}
                  />
                  <AddonToggle
                    id="addon-harvest"
                    label="Harvest table"
                    price={`${formatZAR(rateCardFor(dateClass).addons.harvestTablePP)} per person`}
                    checked={addons.harvestTable}
                    onChange={(v) => setAddons((a) => ({ ...a, harvestTable: v }))}
                  />
                  <AddonToggle
                    id="addon-snacks"
                    label="Late-night snacks"
                    price={`${formatZAR(rateCardFor(dateClass).addons.lateSnacksPP)} per person`}
                    note="billed for half the guest count"
                    checked={addons.lateSnacks}
                    onChange={(v) => setAddons((a) => ({ ...a, lateSnacks: v }))}
                  />
                  <AddonToggle
                    id="addon-feed"
                    label="Animal feed"
                    price={`${formatZAR(rateCardFor(dateClass).addons.animalFeed)}`}
                    checked={addons.animalFeed}
                    onChange={(v) => setAddons((a) => ({ ...a, animalFeed: v }))}
                  />
                  <AddonToggle
                    id="addon-coffee"
                    label="Nespresso bar"
                    price={`${formatZAR(rateCardFor(dateClass).addons.nespressoBar)}`}
                    checked={addons.nespressoBar}
                    onChange={(v) => setAddons((a) => ({ ...a, nespressoBar: v }))}
                  />
                </div>
              </div>
            </div>
          </fieldset>
        ) : null}

        {step === STEPS.length - 1 ? (
          <ResultsPanel
            result={result}
            effectiveDate={effectiveDate}
            flexLabel={flexLabel}
            isFlex={noDateYet && !date && flexMonth !== ''}
            adults={adults}
            childrenCount={children}
            shareUrl={quoteShortId ? `${window.location.origin}/?q=${quoteShortId}` : ''}
            quoteShortId={quoteShortId}
          />
        ) : null}
      </motion.div>
      </AnimatePresence>
      </div>

      {/* Step navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-[4px] border-pine-900/30 text-pine-900 hover:bg-marble-100"
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
        >
          ← Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            className="rounded-[4px] bg-pine-900 text-marble-50 hover:bg-pine-800"
            onClick={() => canContinue && goTo(step + 1)}
            disabled={!canContinue}
          >
            {step === STEPS.length - 2 ? 'See your estimate' : 'Continue'} →
          </Button>
        ) : null}
      </div>
    </section>
  );
}

// ── Package card (radio) ────────────────────────────────────────────────────

function PackageCard({
  option,
  selected,
  onSelect,
  name,
  courses,
  bullets,
  deposit,
  note,
  badges = [],
}: {
  option: PackageOption;
  selected: boolean;
  onSelect: () => void;
  name: string;
  courses: string;
  bullets: readonly string[];
  deposit: string;
  note?: string;
  badges?: string[];
}) {
  return (
    <label
      className={cn(
        'block cursor-pointer rounded-[4px] border bg-white/70 p-5 transition-all',
        selected
          ? 'border-brass-500 bg-white ring-2 ring-brass-500/60'
          : 'border-marble-200 hover:border-brass-500/50',
      )}
    >
      <input
        type="radio"
        name="lakeside-package"
        value={option}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <div className="flex items-start justify-between gap-3">
        <span className="font-display text-lg leading-snug text-pine-900">
          {name}
        </span>
        <span
          aria-hidden
          className={cn(
            'mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-brass-500' : 'border-marble-200',
          )}
        >
          {selected ? <span className="size-2.5 rounded-full bg-brass-500" /> : null}
        </span>
      </div>
      {note ? <p className="mt-1 text-xs font-medium text-brass-600">{note}</p> : null}
      <p className="mt-2 text-sm text-ink-600">{courses}</p>
      <ul className="mt-3 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs text-pine-900">
            <span aria-hidden className="mt-[6px] size-1.5 shrink-0 rounded-full bg-brass-500" />
            {b}
          </li>
        ))}
      </ul>
      {badges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span
              key={b}
              className="rounded-[4px] bg-pine-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-marble-50"
            >
              {b}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-4 border-t border-marble-200 pt-3 text-xs text-ink-600">
        Deposit: {deposit}
      </p>
    </label>
  );
}

// ── Room stepper + addon toggle ─────────────────────────────────────────────

function RoomStepper({
  label,
  price,
  value,
  plusDisabled,
  onChange,
}: {
  label: string;
  price: number;
  value: number;
  plusDisabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[4px] border border-marble-200 bg-white/60 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-ink-600 tabular-nums">
          {formatZAR(price)} per night · sleeps 2
        </p>
      </div>
      <div
        role="group"
        aria-label={`${label} — choose how many rooms`}
        className="flex items-center gap-2"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-[4px] border-marble-200"
          aria-label={`Remove one ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
        >
          −
        </Button>
        <span aria-live="polite" className="w-5 text-center text-sm tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-[4px] border-marble-200"
          aria-label={`Add one ${label}`}
          onClick={() => onChange(value + 1)}
          disabled={plusDisabled}
        >
          +
        </Button>
      </div>
    </div>
  );
}

function AddonToggle({
  id,
  label,
  price,
  note,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  price: string;
  note?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[4px] border border-marble-200 bg-white/60 p-3">
      <div>
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs text-ink-600 tabular-nums">
          {price}
          {note ? ` · ${note}` : ''}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v)}
        className="data-[state=checked]:bg-brass-500"
      />
    </div>
  );
}

// ── Results panel ───────────────────────────────────────────────────────────

function ResultsPanel({
  result,
  effectiveDate,
  flexLabel,
  isFlex,
  adults,
  childrenCount,
  shareUrl,
  quoteShortId,
}: {
  result: EstimateResult | EstimateError | null;
  effectiveDate: string;
  flexLabel: string;
  isFlex: boolean;
  adults: number;
  childrenCount: number;
  shareUrl: string;
  quoteShortId: string;
}) {
  // Hooks must run unconditionally — before any early return.
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [emailConsent, setEmailConsent] = React.useState(false);
  const [emailState, setEmailState] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function copyShareLink() {
    if (!shareUrl) return;
    void navigator.clipboard
      ?.writeText(shareUrl)
      .then(() => {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2200);
      })
      .catch(() => { /* clipboard unavailable — non-essential */ });
  }

  function printEstimate() {
    const root = document.documentElement;
    root.classList.add('print-estimate');
    window.print();
    // Clean up after the print dialog closes (afterprint can be unreliable).
    window.setTimeout(() => root.classList.remove('print-estimate'), 1000);
    window.addEventListener(
      'afterprint',
      () => root.classList.remove('print-estimate'),
      { once: true },
    );
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (emailState === 'sending' || emailState === 'sent') return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailState('error');
      return;
    }
    if (!emailConsent) {
      setEmailState('error');
      return;
    }
    setEmailState('sending');
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: value.split('@')[0] || 'Estimate request',
        email: value,
        source: 'estimate_email',
        consentContact: true,
        message: `Email my estimate${quoteShortId ? ` ${quoteShortId}` : ''}: ${
          result && result.ok
            ? `${prettyDate(effectiveDate)} · ${result.packageName} · ${adults} adults · ${formatZAR(result.total)}`
            : prettyDate(effectiveDate)
        }`,
      }),
    })
      .then((res) => setEmailState(res.ok ? 'sent' : 'error'))
      .catch(() => setEmailState('error'));
  }

  if (!result) {
    return (
      <div className="glass-card-light rounded-[4px] p-6 md:p-8">
        <p className="text-sm text-ink-600">
          Pick a date in step 1 and we’ll price your day instantly.
        </p>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div aria-live="polite" className="glass-card-light rounded-[4px] p-6 md:p-8">
        <p className="eyebrow text-brass-600">Let’s price this together</p>
        <h4 className="mt-2 font-display text-2xl">We’ll confirm this one personally</h4>
        <p className="mt-3 max-w-prose text-sm text-ink-600">{result.message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-[4px] bg-pine-900 text-marble-50 hover:bg-pine-800">
            <a href="#visit">Book a viewing</a>
          </Button>
          <Button asChild variant="outline" className="rounded-[4px] border-brass-500 text-pine-900 hover:bg-brass-500/10">
            <a
              href={WA_LINK(
                `Hi The Lakeside! I’d like help pricing a wedding${effectiveDate ? ` on ${prettyDate(effectiveDate)}` : ''}. Could you assist?`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask us on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const r = result;

  // Wedding-day countdown — pure date math on the chosen date (no storage,
  // no invented data; hidden once the date has passed).
  const daysToGo = effectiveDate
    ? Math.round(
        (new Date(`${effectiveDate}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
      )
    : null;

  const segments = [
    { key: 'Venue', value: r.venueHire, cls: 'bg-pine-900' },
    { key: 'Food & decor', value: r.foodDecor, cls: 'bg-brass-500' },
    { key: 'Extras', value: r.addonsTotal, cls: 'bg-lake-600' },
    { key: 'Rooms', value: r.roomsTotal, cls: 'bg-sand-300' },
  ].filter((s) => s.value > 0);

  // Standard milestones whose due date has passed now fall due on booking —
  // say so in the WhatsApp text so the team isn't asked twice (engine-driven).
  const hasClampedPayments = r.paymentSchedule.some((m) => m.clamped);

  const waText = [
    'Hi The Lakeside! I built an estimate on your website.',
    `Date: ${prettyDate(effectiveDate)}`,
    `Guests: ${adults} adults${childrenCount > 0 ? ` + ${childrenCount} children` : ''}`,
    `Package: ${r.packageName}`,
    `Estimated total: ${formatZAR(r.total)}`,
    // Saved-estimate link opens the same numbers on any device (?q= share).
    ...(shareUrl ? ['', `Saved estimate (opens on any phone): ${shareUrl}`] : []),
    ...(hasClampedPayments
      ? ['Note: your date is close, so some standard payments fall due on booking — the schedule in the estimate shows which.']
      : []),
    'Could you check if the date is available?',
  ].join('\n');

  return (
    <div aria-live="polite">
      <div id="estimate-print-root" className="glass-card-light rounded-[4px] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-brass-600">{r.packageName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h4 className="font-display text-2xl">{prettyDate(effectiveDate)}</h4>
              {daysToGo !== null && daysToGo > 0 ? (
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
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
            <p className="mt-1 text-sm text-ink-600">
              {adults} adults
              {childrenCount > 0 ? ` + ${childrenCount} children under 12` : ''}
              {' · '}
              {r.billableAdults} paying adults
            </p>
          </div>
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={printEstimate}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-marble-200 bg-white px-3.5 py-1.5 text-xs font-medium text-pine-900 transition-colors hover:border-brass-500 hover:bg-brass-500/10 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print / PDF
            </button>
            {isFlex ? (
              <p className="max-w-56 rounded-[4px] border border-brass-500/40 bg-sand-200/60 px-3 py-2 text-xs text-pine-900">
                Indicative — priced as a typical Saturday in {flexLabel}. The exact
                date shifts the rate.
              </p>
            ) : null}
          </div>
        </div>

        {r.minNotice ? (
          <p
            role="status"
            className="mt-5 flex items-start gap-2.5 rounded-[4px] border border-ember-500/40 bg-ember-500/10 px-4 py-3 text-sm text-pine-900"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ember-600" aria-hidden="true" />
            <span>{r.minNotice}</span>
          </p>
        ) : null}
        {r.capacityWarning ? (
          <p
            role="status"
            className="mt-3 flex items-start gap-2.5 rounded-[4px] border border-ember-500/40 bg-ember-500/10 px-4 py-3 text-sm text-pine-900"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ember-600" aria-hidden="true" />
            <span>{r.capacityWarning}</span>
          </p>
        ) : null}
        {r.isIndicative ? (
          <p className="mt-3 flex items-start gap-2.5 rounded-[4px] border border-brass-500/40 bg-sand-200/60 px-4 py-3 text-sm text-pine-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brass-600" aria-hidden="true" />
            <span>
              Your guest count falls between our weekday tiers, so this figure is
              indicative — we’ll confirm the exact price with you.
            </span>
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          {/* Itemised lines + payment schedule */}
          <div className="lg:col-span-3">
            <h5 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
              What’s included in the numbers
            </h5>
            <ul className="mt-4 divide-y divide-marble-200">
              {r.lines.map((line, i) => (
                <li key={`${line.label}-${i}`} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm text-pine-900">{line.label}</p>
                    {line.note ? (
                      <p className="mt-0.5 text-xs text-ink-600">{line.note}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-sm font-medium tabular-nums">
                    {formatZAR(line.amount)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center justify-between gap-3">
              <h5 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
                Payment schedule
              </h5>
              <button
                type="button"
                onClick={() => {
                  const events = r.paymentSchedule
                    .filter((m) => m.dueDate)
                    .map((m) => ({
                      title: m.label,
                      date: m.dueDate as string,
                      description:
                        m.amount != null
                          ? `${formatZAR(m.amount)} — The Lakeside (${r.packageName})`
                          : `The Lakeside (${r.packageName}) — see your estimate`,
                    }));
                  if (events.length === 0) return;
                  downloadIcs(
                    `lakeside-timeline-${r.dateClass.date}.ics`,
                    buildIcs(events, `The Lakeside — ${r.packageName}, ${r.dateClass.date}`),
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-marble-200 bg-white px-3.5 py-1.5 text-xs font-medium text-pine-900 transition-colors hover:border-brass-500 hover:bg-brass-500/10"
              >
                <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Add to calendar (.ics)
              </button>
            </div>
            <ol className="mt-4">
              {r.paymentSchedule.map((m, i) => (
                <li
                  key={`${m.label}-${i}`}
                  className="relative border-l border-marble-200 pb-5 pl-6 last:border-transparent last:pb-0"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 bg-white',
                      m.clamped ? 'border-ember-500 bg-ember-500/15' : 'border-brass-500',
                    )}
                  />
                  <p className="text-sm font-medium text-pine-900">{m.label}</p>
                  <p className="mt-0.5 text-xs text-ink-600">
                    {m.clamped ? (
                      <span className="font-medium text-ember-700">Due on booking ({shortDate(m.dueDate as string)})</span>
                    ) : m.dueDate ? (
                      `Due ${shortDate(m.dueDate)}`
                    ) : (
                      'Due on booking'
                    )}
                    {' · '}
                    <span className="tabular-nums">
                      {m.amount != null ? formatZAR(m.amount) : 'TBC'}
                    </span>
                  </p>
                  {m.note ? (
                    <p className="mt-0.5 text-xs text-ink-600/80">{m.note}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          {/* Total, split, deposits, CTAs */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-[4px] border border-pine-900/15 bg-pine-900 p-6 text-marble-50">
              {/* Brass top hairline — ties the card to the ornament language */}
              <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brass-600 via-brass-400 to-brass-600" />
              <p className="eyebrow eyebrow-dash text-brass-400">Estimated total</p>
              {/* text-3xl + nowrap: this card is col-span-2 of the nested tools
                  grid (≈190px inner at lg) — a 4xl total wraps mid-number. */}
              <p className="mt-2 whitespace-nowrap font-display text-3xl leading-none tracking-tight tabular-nums [font-variant-numeric:tabular-nums]">
                <CountUp value={r.total} />
              </p>
              <p className="mt-2 text-xs text-marble-50/70">
                VAT included · {r.year} rate card
              </p>

              <div
                className="mt-5 flex h-3 w-full overflow-hidden rounded-[4px]"
                role="img"
                aria-label={`Cost split: ${segments
                  .map((s) => `${s.key} ${Math.round((s.value / r.total) * 100)}%`)
                  .join(', ')}`}
              >
                {segments.map((s) => (
                  <div
                    key={s.key}
                    className={s.cls}
                    style={{ width: `${(s.value / r.total) * 100}%` }}
                  />
                ))}
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-marble-50/85">
                {segments.map((s) => (
                  <li key={s.key} className="flex items-center gap-1.5 whitespace-nowrap">
                    <span aria-hidden className={cn('size-2 rounded-full', s.cls)} />
                    {s.key}
                    {' · '}
                    <span className="ml-auto tabular-nums">{formatZAR(s.value)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-[4px] border border-brass-500/40 bg-sand-200/50 p-5">
              <p className="text-sm font-semibold text-pine-900">
                Deposit to secure your date:{' '}
                <span className="tabular-nums">{formatZAR(r.deposit.amount)}</span>
              </p>
              <p className="mt-1 text-xs text-ink-600">{r.deposit.rule}.</p>
              <p className="mt-3 text-xs text-ink-600">
                Plus a breakage deposit of{' '}
                <span className="font-medium tabular-nums">
                  {formatZAR(r.breakageDeposit)}
                </span>{' '}
                — refunded after the wedding.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild className="w-full rounded-[4px] bg-pine-900 text-marble-50 hover:bg-pine-800">
                <a href="#visit">Book a viewing</a>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-[4px] border-brass-500 text-pine-900 hover:bg-brass-500/10">
                <a href={WA_LINK(waText)} target="_blank" rel="noopener noreferrer">
                  WhatsApp this estimate
                </a>
              </Button>
              <Button asChild className="w-full rounded-[4px] bg-brass-500 text-white hover:bg-brass-600">
                <a href="#visit">Hold my date</a>
              </Button>
              {shareUrl ? (
                <button
                  type="button"
                  onClick={copyShareLink}
                  aria-live="polite"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[4px] border border-marble-200 bg-white px-4 py-2 text-xs font-medium text-pine-900 transition-colors hover:border-brass-500 hover:bg-brass-500/10 print:hidden"
                >
                  {copiedLink ? (
                    <Check className="h-3.5 w-3.5 text-brass-600" aria-hidden="true" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {copiedLink ? 'Link copied — send it to your partner' : 'Copy a link to this estimate'}
                </button>
              ) : null}

              {/* Email me this estimate — team sends it personally (no invented
                  automated delivery), captured as a lead for follow-up. */}
              <form onSubmit={submitEmail} className="rounded-[4px] border border-marble-200 bg-white/70 p-4 print:hidden">
                <Label htmlFor="estimate-email" className="text-xs font-semibold text-pine-900">
                  Email me this estimate
                </Label>
                {emailState === 'sent' ? (
                  <p role="status" className="mt-2 flex items-start gap-1.5 text-xs text-pine-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-600" aria-hidden="true" />
                    Request received — we’ll send it across personally, with real
                    availability notes for your date.
                  </p>
                ) : (
                  <>
                    <div className="mt-2 flex gap-2">
                      <Input
                        id="estimate-email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailState === 'error') setEmailState('idle');
                        }}
                        aria-invalid={emailState === 'error'}
                        className="h-10 flex-1 bg-white"
                      />
                      <Button
                        type="submit"
                        disabled={emailState === 'sending'}
                        className="h-10 shrink-0 rounded-[4px] bg-pine-900 px-4 text-marble-50 hover:bg-pine-800"
                      >
                        <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        {emailState === 'sending' ? 'Sending…' : 'Send'}
                      </Button>
                    </div>
                    <label className="mt-2.5 flex items-start gap-2 text-[11px] leading-snug text-ink-600">
                      <input
                        type="checkbox"
                        required
                        checked={emailConsent}
                        onChange={(e) => {
                          setEmailConsent(e.target.checked);
                          if (emailState === 'error') setEmailState('idle');
                        }}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-brass-500"
                      />
                      <span>
                        The Lakeside may email me about this estimate (POPIA —{' '}
                        <a href="#privacy" className="underline underline-offset-2 hover:text-brass-600">your rights</a>).
                      </span>
                    </label>
                    <p className="mt-1.5 text-[11px] leading-snug text-ink-600">
                      Not an automated receipt — one of our team emails it to you
                      with real availability notes.
                    </p>
                    {emailState === 'error' ? (
                      <p role="alert" className="mt-1 text-xs text-ember-500">
                        {!emailConsent && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                          ? 'Please tick the consent box so we may email you.'
                          : 'That email doesn’t look right — check it and try again.'}
                      </p>
                    ) : null}
                  </>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="brass-hairline mt-8" aria-hidden />
        <ul className="mt-4 space-y-1 text-xs text-ink-600/80">
          {r.disclaimers.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── RECENT ESTIMATES (device-local history) ─────────────────────────────────

type HistoryEntry = {
  date?: string;
  adults?: number;
  children?: number;
  package?: string;
  total?: number;
  savedAt?: string;
};

/**
 * "Your estimates on this device" — the last 5 estimates saved by the stepper,
 * stored only in this browser's localStorage. Restore re-uses the same
 * 'lakeside:restore-quote' event contract as shared-estimate links.
 */
function RecentEstimates() {
  const [entries, setEntries] = React.useState<HistoryEntry[] | null>(null);

  React.useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem('lakeside-quotes-history');
        const list = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
        setEntries(Array.isArray(list) ? list.filter((e) => e && e.date && e.total) : []);
      } catch {
        setEntries([]);
      }
    };
    const raf = requestAnimationFrame(read); // first client render matches SSR
    const onChange = () => read();
    window.addEventListener('lakeside:quotes-history-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('lakeside:quotes-history-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  function remove(index: number) {
    if (!entries) return;
    const next = entries.filter((_, i) => i !== index);
    setEntries(next);
    try {
      window.localStorage.setItem('lakeside-quotes-history', JSON.stringify(next));
    } catch { /* non-essential */ }
  }

  function clearAll() {
    setEntries([]);
    try {
      window.localStorage.removeItem('lakeside-quotes-history');
      window.localStorage.removeItem('lakeside-quote');
    } catch { /* non-essential */ }
  }

  function restore(e: HistoryEntry) {
    window.dispatchEvent(
      new CustomEvent('lakeside:restore-quote', {
        detail: {
          date: e.date,
          adults: e.adults,
          children: e.children,
          topUp: e.package === 'Weekend + Top-up',
        },
      }),
    );
  }

  if (entries === null || entries.length === 0) return null;

  const money = (n: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 })
      .format(n)
      .replace('ZAR', 'R');

  return (
    <div className="mt-6 border-t border-marble-200 pt-5 print:hidden">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-900">
          Your estimates on this device
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-[32px] rounded-[4px] px-2 text-xs text-ink-600 underline-offset-2 transition-colors hover:text-ember-500 hover:underline"
        >
          Clear all
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {entries.map((e, i) => (
          <li
            key={`${e.date}-${e.savedAt ?? i}`}
            className="flex items-center gap-3 rounded-[4px] border-l-2 border-brass-500 bg-white/80 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-pine-900">
                {prettyDate(e.date ?? '')}{' '}
                <span className="font-normal text-ink-600">
                  · {e.package ?? 'Estimate'} · {e.adults ?? '?'} adults{e.children ? ` · ${e.children} children` : ''}
                </span>
              </p>
              <p className="text-xs text-ink-600 tabular-nums">{e.total ? money(e.total) : ''}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 shrink-0 rounded-[4px] border-brass-500 px-3 text-xs text-pine-900 hover:bg-brass-500/10"
              onClick={() => restore(e)}
            >
              Open
            </Button>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove estimate for ${prettyDate(e.date ?? '') ?? 'this date'}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-ink-600 transition-colors hover:bg-ember-500/10 hover:text-ember-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-ink-600/70">
        Saved only in this browser — never sent anywhere without your say-so.
      </p>
    </div>
  );
}

// ── MINI variant ────────────────────────────────────────────────────────────

function MiniEstimator() {
  const [today, setToday] = React.useState('');
  React.useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const [date, setDate] = React.useState('');
  const [adults, setAdults] = React.useState(80);
  const [pkg, setPkg] = React.useState<PackageOption>('weekend');

  const dateClass = React.useMemo(() => (date ? classifyDate(date) : null), [date]);
  const eligible = dateClass ? weekdayEligible(dateClass) : false;

  React.useEffect(() => {
    if (pkg === 'weekday' && !eligible) setPkg('weekend');
  }, [pkg, eligible]);

  const result = React.useMemo(() => {
    if (!date) return null;
    if (pkg === 'weekday') return estimateWeekday({ date, adults });
    return estimateWeekendCard({ date, adults, topUp: pkg === 'weekend-topup' }, pkg);
  }, [date, adults, pkg]);

  const totalLabel = !date
    ? 'Pick a date'
    : result && result.ok
      ? formatZAR(result.total)
      : 'Ask us';

  const packageOptions: { value: PackageOption; label: string }[] = [
    { value: 'weekend', label: 'Standard' },
    { value: 'weekend-topup', label: '+ Top-up' },
  ];
  if (eligible) packageOptions.push({ value: 'weekday', label: 'Weekday' });

  return (
    <div className="glass-card-light rounded-[4px] p-4 text-pine-900 md:p-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="mini-date" className="eyebrow text-ink-600">
            Date
          </Label>
          <Input
            id="mini-date"
            type="date"
            min={today || undefined}
            max={MAX_DATE}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 w-44 bg-white/70"
          />
        </div>

        <div>
          <Label htmlFor="mini-guests" className="eyebrow text-ink-600">
            Guests
          </Label>
          <Input
            id="mini-guests"
            type="number"
            inputMode="numeric"
            min={20}
            max={200}
            value={adults}
            onChange={(e) => setAdults(clamp(Number(e.target.value) || 0, 20, 200))}
            className="mt-1.5 w-20 bg-white/70"
          />
        </div>

        <fieldset>
          <legend className="eyebrow text-ink-600">Package</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {packageOptions.map((o) => (
              <label
                key={o.value}
                className={cn(
                  'cursor-pointer rounded-[4px] border px-3 py-1.5 text-sm transition-colors',
                  pkg === o.value
                    ? 'border-pine-900 bg-pine-900 text-marble-50'
                    : 'border-marble-200 bg-white/70 text-pine-900 hover:border-brass-500/60',
                )}
              >
                <input
                  type="radio"
                  name="lakeside-mini-package"
                  value={o.value}
                  checked={pkg === o.value}
                  onChange={() => setPkg(o.value)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div aria-live="polite" className="md:ml-auto md:text-right">
          <p className="eyebrow text-ink-600">Estimated total</p>
          <p className="mt-0.5 whitespace-nowrap font-display text-2xl tabular-nums">{totalLabel}</p>
          {result && result.ok && result.isIndicative ? (
            <p className="text-[11px] text-ink-600">Indicative — we’ll confirm the exact price.</p>
          ) : null}
        </div>

        <a
          href="#estimate"
          className="rounded-[4px] border-b border-brass-500 pb-0.5 text-sm font-semibold text-brass-600 transition-colors hover:text-pine-900"
        >
          Full estimate <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
