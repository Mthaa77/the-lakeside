'use client';

/**
 * THE LAKESIDE — BUILD YOUR DAY (interactive rate-card planner)
 * A transparent, itemised planner driven entirely by PRICING — the same
 * numbers printed on the venue's official 2026 & 2027 rate card. Pick a
 * day-type, set the guest count, toggle the add-ons you actually want, and
 * watch the ledger price itself. Nothing is stored, nothing is submitted —
 * the WhatsApp CTA simply pre-fills the itemised summary the couple built.
 * Hydration-safe: every value deterministic from config + user input.
 */

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PRICING, CONFIGURED_YEARS } from '@/config/pricing';
import { formatZAR } from '@/lib/pricing-engine';
import { WA_LINK } from '@/config/site';
import { Reveal } from './reveal';
import { OrnamentDivider, Rings } from './ornaments';
import {
  ArrowRight, Baby, Briefcase, CalendarCheck, MessageCircle, Minus, Plus, Sparkles,
} from 'lucide-react';

type DayKey = 'sat' | 'fri' | 'sun' | 'monThu';

const DAYS: { key: DayKey; label: string; hire: number; min: number; note: string }[] = [
  { key: 'sat', label: 'Saturday', hire: PRICING.venueHire.sat, min: PRICING.minAdults.sat, note: 'Books seasons ahead.' },
  { key: 'fri', label: 'Friday', hire: PRICING.venueHire.fri, min: PRICING.minAdults.fri, note: 'Softer light, quieter roads.' },
  { key: 'sun', label: 'Sunday', hire: PRICING.venueHire.sun, min: PRICING.minAdults.sun, note: 'Long lunches that drift.' },
  { key: 'monThu', label: 'Mon to Thu', hire: PRICING.venueHire.monThu, min: PRICING.minAdults.thu, note: 'All-inclusive tiers may price better.' },
];

/** Per-person add-ons (× adult guests) — official rate card. */
const PP_ADDONS: { key: string; label: string; note: string }[] = [
  { key: 'topUp', label: 'Top Up package', note: 'Arrival iced tea or hot chocolate, mimosa or glühwein at canapés, sorbet, Nespresso bar & more' },
  { key: 'harvest', label: 'Harvest table', note: 'Grazing table beside the canapés' },
  { key: 'secondMain', label: 'Choice of 2 mains', note: 'Guests pre-select via RSVP' },
  { key: 'snacks', label: 'Late-night snacks', note: 'For every guest (included in Top Up for half the count)' },
];

/** Flat-rate add-ons — official rate card. */
const FLAT_ADDONS: { key: string; label: string; note: string }[] = [
  { key: 'lights', label: 'Fairy lights', note: 'Strung across the reception' },
  { key: 'heaters', label: 'Patio heaters ×4', note: 'Winter lawns, kept warm' },
  { key: 'feed', label: 'Animal feed', note: 'For the herds that join your photos' },
];

function Stepper({
  id, label, hint, value, min, max, onChange, price,
}: {
  id: string; label: string; hint: string; value: number; min: number; max: number;
  onChange: (n: number) => void; price: string;
}) {
  return (
    <div className="rounded-[4px] border border-marble-200 bg-white/70 p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-pine-900">{label}</label>
        <span className="text-xs font-medium text-brass-700 tabular-nums">{price} each</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-ink-600">{hint}</p>
      <div className="mt-2.5 flex items-center gap-2.5">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="grid size-9 place-items-center rounded-full border border-brass-500/40 text-pine-900 transition-colors hover:border-brass-600 hover:bg-brass-500/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <output
          aria-live="polite"
          className="min-w-10 text-center font-display text-xl tabular-nums text-pine-900"
        >
          {value}
        </output>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="grid size-9 place-items-center rounded-full border border-brass-500/40 text-pine-900 transition-colors hover:border-brass-600 hover:bg-brass-500/10 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function DayBuilder() {
  const [day, setDay] = useState<DayKey>('sat');
  const [guests, setGuests] = useState(PRICING.minAdults.sat);
  const [year, setYear] = useState<number>(CONFIGURED_YEARS[0]);
  const [children, setChildren] = useState(0);
  const [providers, setProviders] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(new Set(['topUp']));

  const dayInfo = DAYS.find((d) => d.key === day)!;
  const card = PRICING.years[year];

  function pickDay(k: DayKey) {
    setDay(k);
    const min = DAYS.find((d) => d.key === k)!.min;
    setGuests((g) => (g < min ? min : g));
  }

  function toggle(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const rows = useMemo(() => {
    const on = (k: string) => picked.has(k);
    const list: { label: string; sub?: string; amount: number; strong?: boolean }[] = [
      {
        label: `${dayInfo.label} venue hire`,
        sub: 'whole estate, exclusive use',
        amount: dayInfo.hire,
        strong: true,
      },
      {
        label: 'Food & decor',
        sub: `${guests} adults × ${formatZAR(card.foodDecorPP)}`,
        amount: guests * card.foodDecorPP,
        strong: true,
      },
    ];
    if (on('topUp')) list.push({ label: 'Top Up package', sub: `${guests} × ${formatZAR(card.topUpPP)}`, amount: guests * card.topUpPP });
    if (on('harvest')) list.push({ label: 'Harvest table', sub: `${guests} × ${formatZAR(card.addons.harvestTablePP)}`, amount: guests * card.addons.harvestTablePP });
    if (on('secondMain')) list.push({ label: 'Choice of 2 mains', sub: `${guests} × ${formatZAR(card.addons.secondMainPP)} (pre-RSVP)`, amount: guests * card.addons.secondMainPP });
    if (on('snacks')) list.push({ label: 'Late-night snacks', sub: `${guests} × ${formatZAR(card.addons.lateSnacksPP)}`, amount: guests * card.addons.lateSnacksPP });
    if (on('lights')) list.push({ label: 'Fairy lights', amount: card.addons.fairyLights });
    if (on('heaters')) list.push({ label: 'Patio heaters ×4', amount: card.addons.patioHeaters });
    if (on('feed')) list.push({ label: 'Animal feed', amount: card.addons.animalFeed });
    if (children > 0) list.push({ label: `Children under 12`, sub: `${children} × ${formatZAR(card.addons.childU12)} — canapés, kids’ main, dessert`, amount: children * card.addons.childU12 });
    if (providers > 0) list.push({ label: 'Service providers', sub: `${providers} × ${formatZAR(card.addons.serviceProviderPP)} — canapés & main, not seated`, amount: providers * card.addons.serviceProviderPP });
    return list;
  }, [picked, guests, children, providers, dayInfo, card]);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const perGuest = guests > 0 ? Math.round(total / guests) : total;

  /** Human label per add-on key — the WhatsApp summary reads like a person wrote it. */
  const ADDON_LABELS: Record<string, string> = {
    topUp: 'Top Up package', harvest: 'Harvest table', secondMain: 'choice of 2 mains',
    snacks: 'late-night snacks', lights: 'fairy lights', heaters: 'patio heaters', feed: 'animal feed',
  };

  const waText = encodeURIComponent(
    `Hi Lakeside! We built our day on your website: ${dayInfo.label} ${year}, ${guests} adults` +
    (children > 0 ? ` + ${children} children u/12` : '') +
    (providers > 0 ? ` + ${providers} service providers` : '') +
    (picked.size ? `, add-ons: ${[...picked].map((k) => ADDON_LABELS[k] ?? k).join(', ')}` : '') +
    `. Your card prices it at about ${formatZAR(total)} (VAT incl). Can we book a viewing?`,
  );

  return (
    <section id="build" aria-label="Build your day" className="marble-texture relative overflow-hidden bg-marble-50">
      <div aria-hidden="true" className="champagne-wash pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -top-24 right-0 h-64 w-96 opacity-40" />
      <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -bottom-24 left-0 h-64 w-72 opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal variant="cine" className="mx-auto max-w-2xl text-center">
          <OrnamentDivider tone="brass" center="rings" className="mb-8" />
          <p className="eyebrow eyebrow-dash text-brass-600">The rate card, alive</p>
          <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900 sm:text-5xl">
            Build your day,{' '}
            <em className="gold-gradient-text gold-gradient-text--deep gold-gradient-text--live">see the ledger</em>.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
            The venue&rsquo;s own 2026 &amp; 2027 rates, printed and playable — choose the day,
            the guests and the extras you actually want. Every number below is on the
            official card; nothing here is a guess.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-12">
          {/* ── Controls ─────────────────────────────────────────────── */}
          <Reveal className="lg:col-span-7">
            <div className="glass-card-light rounded-[6px] p-6 sm:p-8">
              {/* Day chips */}
              <div role="radiogroup" aria-label="Day of the week">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">1 · Pick your day</p>
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {DAYS.map((d) => {
                    const on = d.key === day;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => pickDay(d.key)}
                        className={cn(
                          'group rounded-[4px] border p-3 text-left transition-all duration-200',
                          on
                            ? 'border-brass-600 bg-gradient-to-br from-brass-500/[0.14] to-gold-300/[0.16] shadow-[0_10px_26px_-14px_rgba(184,155,106,0.8)]'
                            : 'border-marble-200 bg-white/70 hover:border-brass-500/60',
                        )}
                      >
                        <span className={cn('block text-sm font-semibold', on ? 'text-brass-700' : 'text-pine-900')}>
                          {d.label}
                        </span>
                        <span className="mt-0.5 block font-display text-base tabular-nums text-pine-900/80">
                          {formatZAR(d.hire)}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-ink-600">{d.note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Guests slider */}
              <div className="mt-7">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="build-guests" className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
                    2 · Paying adults
                  </label>
                  <span className="font-display text-xl text-brass-700 tabular-nums">{guests}</span>
                </div>
                <input
                  id="build-guests"
                  type="range"
                  min={dayInfo.min}
                  max={PRICING.capacity.max}
                  step={5}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-marble-200 accent-brass-600 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brass-600 [&::-webkit-slider-thumb]:shadow-[0_2px_8px_-2px_rgba(184,155,106,0.9)]"
                />
                <div className="mt-1 flex justify-between text-[10px] text-ink-600">
                  <span>min {dayInfo.min} adults on a {dayInfo.label.toLowerCase()}</span>
                  <span>max {PRICING.capacity.max}</span>
                </div>
              </div>

              {/* Children & service providers */}
              <div className="mt-7">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">3 · Plus, per head</p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <Stepper
                    id="build-children"
                    label="Children under 12"
                    hint="Canapés, a kids’ main and dessert."
                    value={children}
                    min={0}
                    max={30}
                    onChange={setChildren}
                    price={formatZAR(card.addons.childU12)}
                  />
                  <Stepper
                    id="build-providers"
                    label="Service providers"
                    hint="Photographers, DJs — canapés & a main, unseated."
                    value={providers}
                    min={0}
                    max={20}
                    onChange={setProviders}
                    price={formatZAR(card.addons.serviceProviderPP)}
                  />
                </div>
              </div>

              {/* Add-ons */}
              <div className="mt-7">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">4 · The extras you want</p>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {PP_ADDONS.map((a) => {
                    const on = picked.has(a.key);
                    const price = a.key === 'topUp' ? card.topUpPP
                      : a.key === 'harvest' ? card.addons.harvestTablePP
                      : a.key === 'secondMain' ? card.addons.secondMainPP
                      : card.addons.lateSnacksPP;
                    return (
                      <button
                        key={a.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(a.key)}
                        className={cn(
                          'rounded-[4px] border p-3.5 text-left transition-all duration-200',
                          on
                            ? 'border-brass-600 bg-gradient-to-br from-brass-500/[0.14] to-gold-300/[0.16]'
                            : 'border-marble-200 bg-white/70 hover:border-brass-500/60',
                        )}
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn('text-sm font-semibold', on ? 'text-brass-700' : 'text-pine-900')}>{a.label}</span>
                          <span className="text-xs font-medium text-ink-600 tabular-nums">{formatZAR(price)} pp</span>
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-ink-600">{a.note}</span>
                      </button>
                    );
                  })}
                  {FLAT_ADDONS.map((a) => {
                    const on = picked.has(a.key);
                    const price = a.key === 'lights' ? card.addons.fairyLights
                      : a.key === 'heaters' ? card.addons.patioHeaters
                      : card.addons.animalFeed;
                    return (
                      <button
                        key={a.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(a.key)}
                        className={cn(
                          'rounded-[4px] border p-3.5 text-left transition-all duration-200',
                          on
                            ? 'border-brass-600 bg-gradient-to-br from-brass-500/[0.14] to-gold-300/[0.16]'
                            : 'border-marble-200 bg-white/70 hover:border-brass-500/60',
                        )}
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn('text-sm font-semibold', on ? 'text-brass-700' : 'text-pine-900')}>{a.label}</span>
                          <span className="text-xs font-medium text-ink-600 tabular-nums">{formatZAR(price)}</span>
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-ink-600">{a.note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Year toggle */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">5 · Wedding year</span>
                <div role="radiogroup" aria-label="Wedding year" className="inline-flex rounded-full border border-brass-500/40 bg-white/70 p-1">
                  {CONFIGURED_YEARS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      role="radio"
                      aria-checked={y === year}
                      onClick={() => setYear(y)}
                      className={cn(
                        'min-h-[34px] rounded-full px-4 text-xs font-semibold tabular-nums transition-colors',
                        y === year ? 'bg-brass-600 text-marble-50 shadow-[0_2px_10px_-2px_rgba(184,155,106,0.7)]' : 'text-ink-600 hover:text-pine-900',
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-ink-600">Rates follow the year of your wedding date.</span>
              </div>
            </div>
          </Reveal>

          {/* ── The gilded ledger ────────────────────────────────────── */}
          <Reveal delay={120} className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="frame-corners relative">
                <span aria-hidden="true" className="fc-b absolute inset-0" />
                <div className="relative rounded-[4px] border border-brass-500/30 bg-gradient-to-br from-brass-500/[0.08] via-white to-gold-300/[0.14] p-6 shadow-[0_30px_70px_-30px_rgba(16,38,30,0.4)] sm:p-7">
                  <div className="flex items-center gap-3">
                    <Rings className="h-6 w-auto shrink-0 text-brass-600" />
                    <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-brass-500/50 to-transparent" />
                    <span className="wax-dot" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-xl text-pine-900">Your day, itemised</h3>
                  <p className="mt-1 text-xs text-ink-600">
                    {dayInfo.label} · {guests} adults{children > 0 ? ` · ${children} children` : ''}
                    {providers > 0 ? ` · ${providers} suppliers` : ''} · {year}
                  </p>

                  <ul className="mt-4 divide-y divide-brass-500/15">
                    {rows.map((r) => (
                      <li key={r.label} className="flex items-baseline justify-between gap-4 py-2.5">
                        <div className="min-w-0">
                          <p className={cn('text-sm leading-snug', r.strong ? 'font-semibold text-pine-900' : 'text-ink-900/85')}>{r.label}</p>
                          {r.sub && <p className="mt-0.5 text-[11px] leading-snug text-ink-600">{r.sub}</p>}
                        </div>
                        <p className={cn('shrink-0 tabular-nums', r.strong ? 'font-display text-base text-brass-700' : 'text-sm text-pine-900/85')}>
                          {formatZAR(r.amount)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 border-t border-brass-500/25 pt-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-ink-600">Your day, on the card</p>
                        <p aria-live="polite" className="mt-1 font-display text-4xl leading-none text-pine-900 tabular-nums">
                          {formatZAR(total)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-ink-600">per adult</p>
                        <p className="font-display text-lg text-brass-700 tabular-nums">≈ {formatZAR(perGuest)}</p>
                      </div>
                    </div>
                    <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-600/85">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brass-600" aria-hidden="true" />
                      Every line is the venue&rsquo;s published rate — VAT included. Confirmed by a
                      person with your date; florals, food and decor are designed with you.
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5">
                    <a
                      href="#visit"
                      className="btn-shine inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-pine-900 px-6 text-sm font-semibold text-marble-50 transition-colors hover:bg-pine-700"
                    >
                      <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                      Book a viewing with this build
                    </a>
                    <a
                      href={WA_LINK(waText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-brass-500/50 px-6 text-sm font-medium text-pine-900 transition-colors hover:border-ruby-500 hover:text-ruby-600"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Send this build on WhatsApp
                    </a>
                  </div>
                </div>

                {/* Notes card */}
                <div className="mt-5 rounded-[4px] border border-marble-200 bg-white/80 p-5">
                  <div className="flex items-center gap-2.5">
                    <Baby className="h-4 w-4 shrink-0 text-brass-600" aria-hidden="true" />
                    <p className="text-xs leading-relaxed text-ink-600">
                      <strong className="font-semibold text-pine-900">Good to know —</strong> Saturday &amp; public
                      holidays need 80 paying adults, Fridays 60, Sundays &amp; Thursdays 40. June–August
                      carry Winter Specials — ask us directly. Corkage applies only to bottles the
                      kitchen can&rsquo;t source, 10 max.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2.5 border-t border-marble-200 pt-3">
                    <Briefcase className="h-4 w-4 shrink-0 text-brass-600" aria-hidden="true" />
                    <p className="text-xs leading-relaxed text-ink-600">
                      Suppliers not seated at guest tables receive canapés &amp; a main meal —
                      no starter or dessert, no decor allocated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Halo CTA — walk it in person */}
        <Reveal className="mt-10 text-center">
          <a
            href="#date"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-pine-900 underline decoration-brass-500 decoration-2 underline-offset-8 transition-colors hover:text-brass-700"
          >
            Now check which {dayInfo.label.toLowerCase()}s are free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
