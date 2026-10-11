'use client';

/**
 * THE LAKESIDE — CONVERSION TOOLS (round 2)
 * 1. PackageComparator — Weekend vs Thursday (weekend card) vs Weekday
 *    all-inclusive, at a chosen guest count. Facts only, from the engine.
 * 2. ProposalBuilder — spot + add-ons → live total with rule validation
 *    (Mon–Fri, 1 hour; white carpet Glass House only). All prices from
 *    PRICING.proposals. CTA via WhatsApp; request handled by the team.
 *    Round 25: gilded re-skin (selection cards, medallion rows, plaque)
 *    — markup/styling only, all state/pricing/field ids unchanged.
 */

import { useMemo, useState } from 'react';
import { PRICING } from '@/config/pricing';
import { formatZAR, classifyDate, weekdayEligible, estimateWeekday, estimateWeekendCard } from '@/lib/pricing-engine';
import { WA_LINK } from '@/config/site';
import { Reveal } from './reveal';
import { CornerMarks, Rings } from './ornaments';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Check, X, Sparkles, CalendarHeart } from 'lucide-react';

// ── Package comparator ──────────────────────────────────────────────────────

type Col = {
  key: string;
  name: string;
  blurb: string;
  total: number | null;
  note: string | null;
  minAdults: number;
  courses: string;
  dj: boolean;
  cake: boolean;
  depositRule: string;
  bestFor: string;
  eligible: boolean;
  highlight?: boolean;
};

export function PackageComparator() {
  const [date, setDate] = useState('2027-03-11'); // a Thursday in 2027
  const [guests, setGuests] = useState(80);

  const cols = useMemo<Col[]>(() => {
    const c = classifyDate(date);
    const weekdayOk = weekdayEligible(c);
    const weekday = weekdayOk ? estimateWeekday({ date, adults: guests }) : null;
    const weekendCard = estimateWeekendCard({ date, adults: guests }, 'weekend');

    const isThursday = c.dayType === 'thu';

    return [
      {
        key: 'weekend',
        name: 'Weekend rate card',
        blurb: 'Mon–Sun pricing by day, 4-course menu, venue styled for you.',
        total: weekendCard.ok ? weekendCard.total : null,
        note: !weekendCard.ok ? weekendCard.message : null,
        minAdults: weekendCard.ok ? weekendCard.minAdults : 0,
        courses: '4 courses + canapés',
        dj: false,
        cake: false,
        depositRule: '50% of venue hire',
        bestFor: 'Fridays–Sundays and public holidays',
        eligible: true,
      },
      {
        key: 'thursday-weekday',
        name: 'Weekday all-inclusive',
        blurb: isThursday
          ? 'Thursdays qualify for both rates — compare them here.'
          : 'Venue hire, 3-course plated meal, cake, toasts, DJ & sound and selected decor included.',
        total: weekday && weekday.ok ? weekday.total : null,
        note: weekday && !weekday.ok ? weekday.message : weekdayOk ? null : 'Not available on this date (excludes December, public holidays and their eves).',
        minAdults: isThursday ? PRICING.weekday.thursdayMinAdults : PRICING.weekday.monWedMinGuests,
        courses: '3-course plated',
        dj: true,
        cake: true,
        depositRule: '25% of package',
        bestFor: 'Mon–Thu (excl. December & holidays)',
        eligible: weekdayOk && !!(weekday && weekday.ok),
        highlight: isThursday,
      },
    ];
  }, [date, guests]);

  return (
    <Reveal>
      <div className="rounded-[6px] border border-marble-200 bg-white p-6 shadow-[0_24px_70px_-38px_rgba(16,38,30,0.35)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-brass-600">Side by side</p>
            <h3 className="mt-2 font-display text-2xl text-pine-900 sm:text-3xl">Compare the packages</h3>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="cmp-date" className="text-xs text-ink-600">Your date</Label>
              <input
                id="cmp-date"
                type="date"
                min="2026-10-10"
                max="2027-12-31"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 rounded-[4px] border border-marble-200 bg-marble-50 px-3 text-sm text-pine-900 [color-scheme:light]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cmp-guests" className="text-xs text-ink-600">Guests: <span className="font-display text-base text-pine-900 tabular-nums">{guests}</span></Label>
              <input
                id="cmp-guests"
                type="range"
                min={20}
                max={200}
                step={5}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="h-1.5 w-44 cursor-pointer appearance-none rounded-full bg-marble-200 accent-brass-600 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brass-600"
              />
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {cols.map((col) => (
            <article
              key={col.key}
              className={cn(
                'relative flex flex-col rounded-[6px] border p-6 transition-shadow',
                col.highlight
                  ? 'border-brass-500/60 bg-gradient-to-b from-brass-500/[0.07] to-white shadow-[0_24px_60px_-32px_rgba(184,155,106,0.5)]'
                  : 'border-marble-200 bg-marble-50',
                !col.eligible && 'opacity-70'
              )}
            >
              {col.highlight && (
                <span className="absolute -top-3 left-5 rounded-full bg-brass-500 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-pine-900">
                  {classifyDate(date).dayType === 'thu' ? 'Thursday special' : 'Recommended'}
                </span>
              )}
              <h4 className="font-display text-xl text-pine-900">{col.name}</h4>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">{col.blurb}</p>

              <div className="mt-4 border-t border-marble-200 pt-4">
                {col.total !== null ? (
                  <>
                    <p className="text-xs text-ink-600">Estimated total · {guests} guests</p>
                    <p className="font-display text-3xl text-pine-900 tabular-nums">{formatZAR(col.total)}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-ember-500">{col.note ?? 'Price on request'}</p>
                )}
                {col.total !== null && guests < col.minAdults && (
                  <p className="mt-1 text-xs text-ember-500">
                    Minimum {col.minAdults} paying adults on this day — we&rsquo;ll bill {col.minAdults}.
                  </p>
                )}
              </div>

              <dl className="mt-4 flex-1 space-y-2.5 text-sm">
                {[
                  ['Meal', col.courses],
                  ['DJ & sound', col.dj ? 'Included' : 'Your own SAMPRA DJ'],
                  ['Wedding cake', col.cake ? '1-tier semi-naked included' : 'Your own baker'],
                  ['Deposit', col.depositRule],
                  ['Best for', col.bestFor],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 text-ink-600">{k}</dt>
                    <dd className="text-right font-medium text-pine-900">{v}</dd>
                  </div>
                ))}
              </dl>

              <Button asChild variant={col.highlight ? 'default' : 'outline'} className="mt-5 w-full rounded-full">
                <a href="#estimate">Build this estimate <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" /></a>
              </Button>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-600">
          Thursdays price both ways — the weekend rate card and the weekday all-inclusive. Florals are in-house only on every
          package; accommodation is quoted separately in the estimator.
        </p>
      </div>
    </Reveal>
  );
}

// ── Proposal builder ────────────────────────────────────────────────────────

const SPOTS = [
  { key: 'canapeDeck', label: 'Canapé Deck', price: PRICING.proposals.canapeDeck, blurb: 'On the lawn, over the water — the estate at its most relaxed.' },
  { key: 'glassHouse', label: 'Glass House (Glass Chapel)', price: PRICING.proposals.glassHouse, blurb: 'Inside the glass chapel, private and all-season.' },
  { key: 'marbleReception', label: 'White Marble Reception', price: PRICING.proposals.marbleReception, blurb: 'The full pavilion to yourself — chandeliers on.' },
] as const;

const ADDONS: ReadonlyArray<{ key: string; label: string; price: number; glassOnly?: boolean }> = [
  { key: 'picnic', label: 'Picnic platter (incl. a bottle of JC Le Roux)', price: PRICING.proposals.picnic },
  { key: 'whiteCarpet', label: 'White carpet — Glass House only', price: PRICING.proposals.whiteCarpet, glassOnly: true },
  { key: 'petalsRed', label: 'Rose petals, red', price: PRICING.proposals.petalsRed },
  { key: 'petalsWhite', label: 'Rose petals, white scattered', price: PRICING.proposals.petalsWhite },
  { key: 'marqueeLights', label: '"MARRY ME" marquee lights (set-up incl.)', price: PRICING.proposals.marqueeLights },
];

export function ProposalBuilder() {
  const [spot, setSpot] = useState<(typeof SPOTS)[number]['key']>('glassHouse');
  const [addons, setAddons] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState('');

  const selectedSpot = SPOTS.find((s) => s.key === spot) ?? SPOTS[1];
  const dayClass = date ? classifyDate(date) : null;
  const isWeekday = dayClass ? ['mon', 'tue', 'wed', 'thu', 'fri'].includes(dayClass.dayType) : true;
  const isPublicHoliday = dayClass?.isPublicHoliday ?? false;

  // Rule: white carpet is Glass House only
  const carpetBlocked = !!addons.whiteCarpet && spot !== 'glassHouse';
  const effectiveAddons = carpetBlocked ? { ...addons, whiteCarpet: false } : addons;

  const total =
    selectedSpot.price +
    ADDONS.reduce((sum, a) => (effectiveAddons[a.key] ? sum + a.price : sum), 0);

  const wa = WA_LINK(
    `Hi Lakeside! I'd like to plan a proposal.${dayClass ? ` Date: ${date}.` : ''} Spot: ${selectedSpot.label} (${formatZAR(selectedSpot.price)}).${Object.keys(effectiveAddons).filter((k) => effectiveAddons[k]).length ? ' Add-ons: ' + ADDONS.filter((a) => effectiveAddons[a.key]).map((a) => a.label).join(', ') + '.' : ''} Estimated total: ${formatZAR(total)}.`
  );

  return (
    <Reveal>
      <div className="glass-card frame-corners relative overflow-hidden rounded-[6px] p-6 sm:p-8">
        <span className="fc-b absolute inset-0" aria-hidden="true" />
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-300/35 bg-brass-500/15 text-brass-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_26px_-12px_rgba(184,155,106,0.6)]">
            <CalendarHeart className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow text-brass-400">Plan the question</p>
            <h3 className="font-display text-2xl text-marble-50">Proposal builder</h3>
          </div>
        </div>
        <p className="mt-2 text-sm text-marble-50/80">
          One hour, Monday to Friday. Pick your spot, add the extras, and send us the plan — we&rsquo;ll confirm availability and the finer details.
        </p>

        <fieldset className="mt-7">
          <legend className="text-[11px] uppercase tracking-[0.2em] text-gold-300/80">The spot</legend>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {SPOTS.map((s) => (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={spot === s.key}
                onClick={() => setSpot(s.key)}
                className={cn(
                  'relative rounded-[4px] border p-4 text-left transition-all duration-300',
                  spot === s.key
                    ? 'border-gold-300/60 bg-gradient-to-b from-brass-500/[0.16] to-brass-500/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_44px_-22px_rgba(184,155,106,0.6)]'
                    : 'border-white/15 bg-white/5 hover:-translate-y-0.5 hover:border-brass-400/50 hover:bg-white/[0.08]'
                )}
              >
                {spot === s.key && (
                  <span
                    aria-hidden="true"
                    className="gold-surface absolute right-3 top-3 grid size-5 place-items-center rounded-full shadow-[0_4px_12px_-3px_rgba(184,155,106,0.8)]"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <span className="block pr-6 text-sm font-semibold text-marble-50">{s.label}</span>
                <span
                  className={cn(
                    'mt-1.5 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums',
                    spot === s.key
                      ? 'gold-surface shadow-[0_6px_16px_-8px_rgba(184,155,106,0.8)]'
                      : 'bg-white/8 text-brass-400 ring-1 ring-inset ring-white/15'
                  )}
                >
                  {formatZAR(s.price)}
                </span>
                <span className="mt-1.5 block text-[11px] leading-snug text-marble-50/70">{s.blurb}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-[11px] uppercase tracking-[0.2em] text-gold-300/80">The extras</legend>
          <div className="mt-1 divide-y divide-white/10">
            {ADDONS.map((a) => (
              <label
                key={a.key}
                className={cn(
                  'group flex min-h-[52px] cursor-pointer items-center gap-3.5 rounded-[4px] py-3 transition-colors',
                  carpetBlocked && a.glassOnly
                    ? 'cursor-not-allowed opacity-55'
                    : 'hover:bg-white/[0.05]'
                )}
              >
                <Checkbox
                  checked={!!effectiveAddons[a.key]}
                  disabled={carpetBlocked && a.glassOnly}
                  onCheckedChange={(v) => setAddons((prev) => ({ ...prev, [a.key]: v === true }))}
                  className="size-5 rounded-full border-gold-300/40 bg-white/5 shadow-none transition-all duration-200 group-hover:border-gold-300/70 data-[state=checked]:border-transparent data-[state=checked]:bg-gradient-to-b data-[state=checked]:from-gold-200 data-[state=checked]:to-brass-500 data-[state=checked]:text-pine-950 data-[state=checked]:shadow-[0_4px_12px_-3px_rgba(184,155,106,0.75)]"
                  aria-label={`${a.label} — ${formatZAR(a.price)}`}
                />
                <span className="flex-1 text-sm leading-snug text-marble-50/90">
                  {a.label}
                  {carpetBlocked && a.glassOnly && (
                    <span className="mt-1 block text-[11px] text-ember-500">Glass House only — pick that spot to add it.</span>
                  )}
                </span>
                <span className="shrink-0 font-display text-base text-brass-400 tabular-nums transition-colors group-hover:text-gold-300">
                  {formatZAR(a.price)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pb-date" className="text-marble-50/80">When? (Mon–Fri, 1 hour)</Label>
            <input
              id="pb-date"
              type="date"
              min="2026-10-10"
              max="2027-12-31"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-[4px] border border-gold-300/20 bg-white/10 px-3 text-sm text-marble-50 transition-colors [color-scheme:dark] focus:border-brass-400/70 focus:outline-none"
            />
            {dayClass && (
              <p className={cn('text-xs', isWeekday && !isPublicHoliday ? 'text-marble-50/70' : 'text-ember-500')}>
                {isWeekday && !isPublicHoliday
                  ? `${dayClass.dayType.charAt(0).toUpperCase() + dayClass.dayType.slice(1)} — perfect for a proposal.`
                  : 'Proposals run Monday to Friday (not public holidays) — pick another day.'}
              </p>
            )}
          </div>
          <div className="relative flex flex-col justify-end">
            <div className="relative rounded-[6px] border border-gold-300/25 bg-gradient-to-b from-brass-500/[0.14] to-white/[0.02] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <CornerMarks inset="10px" tone="gold" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gold-300/85">Your plan</p>
                <Rings className="h-5 w-auto text-gold-300/80 drop-shadow-[0_2px_8px_rgba(222,184,110,0.35)]" />
              </div>
              <span aria-hidden="true" className="brass-hairline my-2.5 block" />
              <p className="font-display text-4xl leading-none text-marble-50 sm:text-[2.6rem]">
                <span className="gold-gradient-text gold-gradient-text--live tabular-nums">{formatZAR(total)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild className="btn-shine gold-surface min-h-[48px] flex-1 rounded-full px-6 text-base font-semibold">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" /> Send this plan on WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" className="min-h-[48px] rounded-full border-gold-300/30 bg-transparent text-marble-50 hover:border-gold-300/60 hover:bg-white/10 hover:text-marble-50">
            <a href="#visit">Or request a call</a>
          </Button>
        </div>
        <p className="mt-4 pb-1 text-center text-xs text-marble-50/60">
          Bring your own photographer and speaker. One hour, Monday–Friday. We handle the rest.
        </p>
      </div>
    </Reveal>
  );
}

// Small honest-status helper chips used above
export function RuleChip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', ok ? 'text-pine-700' : 'text-ember-500')}>
      {ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}
