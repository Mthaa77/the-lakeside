'use client';

/**
 * THE LAKESIDE — WEDDINGS & PRICING
 * "Our prices are on the page." Headline numbers from pricing.ts,
 * package cards, weekday tier slider and the date ledger below —
 * every rate printed, nothing behind an enquiry form.
 */

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PRICING, CONFIGURED_YEARS } from '@/config/pricing';
import { formatZAR } from '@/lib/pricing-engine';
import { Reveal } from './reveal';
import DateChecker from './date-checker';
import { OrnamentDivider, CornerMarks, Rings } from './ornaments';
import { GlassWater, Cake, Music, Sparkles, HeartHandshake, ArrowRight, Zap, CalendarCheck, Phone, MessageCircle } from 'lucide-react';
import { SITE } from '@/config/site';

/** The four weekend-card day types — printed here as a gilded ledger. */
const DAY_LEDGER: { key: string; day: string; hire: number; min: number; note: string }[] = [
  { key: 'sat', day: 'Saturday', hire: PRICING.venueHire.sat, min: PRICING.minAdults.sat, note: 'The full golden hour — books seasons ahead.' },
  { key: 'fri', day: 'Friday', hire: PRICING.venueHire.fri, min: PRICING.minAdults.fri, note: 'Same card, softer light, quieter roads.' },
  { key: 'sun', day: 'Sunday', hire: PRICING.venueHire.sun, min: PRICING.minAdults.sun, note: 'Long lunches that drift into the evening.' },
  { key: 'monThu', day: 'Mon to Thu', hire: PRICING.venueHire.monThu, min: PRICING.minAdults.mon, note: 'All-inclusive packages — see the calculator above.' },
];

const WEEKDAY_TIERS: [number, number][] = [
  [20, 58000], [30, 70000], [40, 85000], [50, 100000], [60, 110000],
  [70, 120000], [80, 130000], [90, 140000], [100, 150000],
];

/** Segmented-control pill for the rate-card year toggle. */
function cnToggle(on: boolean): string {
  return cn(
    'min-h-[36px] rounded-full px-4 text-xs font-semibold tracking-wide tabular-nums transition-colors',
    on
      ? 'bg-brass-500 text-pine-900 shadow-[0_2px_10px_-2px_rgba(184,155,106,0.6)]'
      : 'text-marble-50/70 hover:text-marble-50',
  );
}

function RateRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-baseline justify-between gap-2">
      <span className="text-marble-50/60">{label}</span>
      <span className="font-medium text-marble-50/90 tabular-nums whitespace-nowrap">{value}</span>
    </p>
  );
}

export function WeddingsPricing() {
  const [tierGuests, setTierGuests] = useState(40);
  const [rateYear, setRateYear] = useState<number>(2026);
  const card = PRICING.years[rateYear];
  const tier = useMemo(() => {
    let best = WEEKDAY_TIERS[0];
    for (const t of WEEKDAY_TIERS) if (t[0] <= tierGuests) best = t;
    const extra = Math.max(0, tierGuests - best[0]);
    return { base: best[1], extra: extra * PRICING.weekday.extraGuest, total: best[1] + extra * PRICING.weekday.extraGuest };
  }, [tierGuests]);

  return (
    <>
      {/* ── Price you can see ─────────────────────────────────────────── */}
      <section id="pricing" aria-label="Open pricing" className="relative overflow-hidden bg-pine-900 text-marble-50">
        <div className="absolute inset-0 opacity-[0.14]" aria-hidden="true">
          { }
          <img src="/img/LS-016.webp" alt="" width={1251} height={844} className="h-full w-full object-cover" loading="lazy" decoding="async" aria-hidden="true" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow text-brass-400">Open pricing</p>
              <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-balance sm:text-5xl">
                The whole price,{' '}
                <em className="gold-gradient-text gold-gradient-text--live">on the page</em>.
              </h2>
              <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-marble-50/85">
                Pick a date and guest count; see your total in under a minute. No
                &ldquo;request a quote&rdquo; maze — the numbers live here, and they include VAT.
              </p>

              <dl className="mt-8 space-y-5">
                <div className="brass-hairline" />
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-marble-50/80">Saturday venue hire</dt>
                  <dd className="font-display text-2xl text-brass-400 tabular">{formatZAR(PRICING.venueHire.sat)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-marble-50/80">Venue hire from (Mon to Thu)</dt>
                  <dd className="font-display text-2xl text-brass-400 tabular">{formatZAR(PRICING.venueHire.monThu)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-marble-50/80">Food &amp; decor per guest ({rateYear})</dt>
                  <dd className="font-display text-2xl text-brass-400 tabular">{formatZAR(card.foodDecorPP)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-marble-50/80">Weekday all-inclusive, from</dt>
                  <dd className="font-display text-2xl text-brass-400 tabular">{formatZAR(PRICING.weekday.tiers[20])}</dd>
                </div>
                <div className="brass-hairline" />
              </dl>

              {/* Rate-card year toggle — rates follow the wedding-date year;
                  this is the same rate card, browsable. */}
              <div className="mt-6">
                <div
                  role="tablist"
                  aria-label="Rate card year"
                  className="inline-flex rounded-full border border-white/20 bg-white/5 p-1"
                >
                  {CONFIGURED_YEARS.map((y) => {
                    const on = y === rateYear;
                    return (
                      <button
                        key={y}
                        role="tab"
                        type="button"
                        aria-selected={on}
                        onClick={() => setRateYear(y)}
                        className={cnToggle(on)}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-marble-50/60">
                  Your wedding <strong className="font-medium text-marble-50/80">date year</strong> sets the rates —
                  venue hire is the same in {CONFIGURED_YEARS[0]} and {CONFIGURED_YEARS[1]}.
                </p>
                <div
                  className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 rounded-[4px] border border-white/10 bg-white/[0.04] p-4 text-xs sm:grid-cols-3"
                  aria-live="polite"
                >
                  <RateRow label="Heritage room / night" value={formatZAR(card.rooms.heritage)} />
                  <RateRow label="Manor room / night" value={formatZAR(card.rooms.manor)} />
                  <RateRow label="Bridal Suite / night" value={formatZAR(card.rooms.suite)} />
                  <RateRow label="Fairy lights" value={formatZAR(card.addons.fairyLights)} />
                  <RateRow label="Patio heaters" value={formatZAR(card.addons.patioHeaters)} />
                  <RateRow label="Late snacks per guest" value={formatZAR(card.addons.lateSnacksPP)} />
                  <RateRow label="Children under 12" value={formatZAR(card.addons.childU12)} />
                  <RateRow label="Harvest table per guest" value={formatZAR(card.addons.harvestTablePP)} />
                  <RateRow label="Animal feed" value={formatZAR(card.addons.animalFeed)} />
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-marble-50/60">
                Weekends: minimum paying adults apply (Sat 80 · Fri 60 · Sun &amp; Thu 40).
                December and public holidays follow their own rules — the calendar below shows each day-type.
              </p>
            </Reveal>

            {/* Weekday tier slider */}
            <Reveal delay={120} className="lg:col-span-7">
              <div className="glass-card rounded-[6px] p-6 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl">Weekday calculator</h3>
                  <p className="eyebrow text-brass-400">Mon–Thu · excl. December &amp; holidays</p>
                </div>
                <p className="mt-2 text-sm text-marble-50/80">
                  Skip the weekend rush. All-inclusive weekday weddings — venue, 3-course
                  plated meal, semi-naked cake, sparkling-wine toasts, DJ &amp; sound and
                  selected decor included.
                </p>
                <div className="mt-6">
                  <label htmlFor="tier-slider" className="flex items-baseline justify-between text-sm">
                    <span className="text-marble-50/80">Guests</span>
                    <span className="font-display text-xl text-brass-400 tabular">{tierGuests}</span>
                  </label>
                  <input
                    id="tier-slider"
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={tierGuests}
                    onChange={(e) => setTierGuests(Number(e.target.value))}
                    className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-brass-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brass-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-marble-50/50">
                    <span>20</span><span>100</span>
                  </div>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/15 pt-5">
                  <div>
                    <p className="text-sm text-marble-50/80">Your weekday package</p>
                    <p className="font-display text-4xl text-marble-50 tabular">{formatZAR(tier.total)}</p>
                    {tier.extra > 0 && (
                      <p className="mt-1 text-xs text-marble-50/60">
                        {formatZAR(tier.base)} tier + {formatZAR(tier.extra)} extra guests — indicative
                      </p>
                    )}
                  </div>
                  <ArrowRight className="mb-1 h-5 w-5 text-brass-400" aria-hidden="true" />
                </div>
                <p className="mt-3 text-xs text-marble-50/60">
                  110+ weekday guests: price on request. Thursdays also qualify for the
                  weekend rate card — compare both on the printed list below.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── The date ledger — calendar + printed day-types ─────────────── */}
      <section id="date" aria-label="Check your wedding date" className="marble-texture relative overflow-hidden bg-marble-50">
        <div aria-hidden="true" className="champagne-wash pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -top-24 right-0 h-64 w-96 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <Reveal variant="cine" className="mx-auto max-w-2xl text-center">
            <OrnamentDivider tone="brass" center="rings" className="mb-8" />
            <p className="eyebrow eyebrow-dash text-brass-600">Your date, your day-type</p>
            <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900 sm:text-5xl">
              Check a date. <em className="gold-gradient-text gold-gradient-text--deep gold-gradient-text--live">See its light.</em>
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
              Tap any day on the 2026–2027 calendar for its day-type, venue hire and
              minimums. Every date is confirmed by a person — never just a calendar.
            </p>
          </Reveal>

          <div className="mt-12 grid items-start gap-8 lg:grid-cols-12">
            {/* The calendar */}
            <Reveal className="lg:col-span-7">
              <div className="rounded-[6px] border border-marble-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(16,38,30,0.3)] sm:p-8">
                <DateChecker />
              </div>
            </Reveal>

            {/* The printed day-types + what happens next */}
            <div className="flex flex-col gap-8 lg:col-span-5">
              <Reveal delay={100}>
                <div className="frame-corners relative">
                  <span className="fc-b absolute inset-0" aria-hidden="true" />
                  <div className="relative rounded-[4px] border border-brass-500/30 bg-gradient-to-br from-brass-500/[0.07] via-white to-gold-300/[0.12] p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                      <Rings className="h-6 w-auto shrink-0 text-brass-600" />
                      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-brass-500/50 to-transparent" />
                      <span className="wax-dot" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 font-display text-xl text-pine-900">The day-type ledger</h3>
                    <p className="mt-1 text-xs text-ink-600">
                      Weekend venue hire, printed — the same numbers the calendar uses.
                    </p>
                    <ul className="mt-5 divide-y divide-brass-500/15">
                      {DAY_LEDGER.map((row) => (
                        <li key={row.key} className="flex items-baseline justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-pine-900">{row.day}</p>
                            <p className="mt-0.5 text-xs leading-snug text-ink-600">{row.note}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-display text-lg text-brass-700 tabular-nums">{formatZAR(row.hire)}</p>
                            <p className="text-[11px] text-ink-600/80 tabular-nums">min {row.min} adults</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 border-t border-brass-500/20 pt-3 text-[11px] leading-relaxed text-ink-600/80">
                      VAT included. December and public holidays carry their own day-types —
                      shown on the calendar and confirmed by the team.
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={180}>
                <div className="rounded-[4px] border border-marble-200 bg-white p-6 shadow-[0_16px_44px_-28px_rgba(16,38,30,0.35)] sm:p-7">
                  <h3 className="font-display text-lg text-pine-900">After the calendar</h3>
                  <ol className="mt-4 space-y-3.5">
                    {[
                      { t: 'Shortlist your dates', d: 'Save two or three and compare their day-types side by side.' },
                      { t: 'Come stand in the chapel', d: 'A viewing in person or a virtual walkthrough — about an hour.' },
                      { t: 'We hold your date', d: 'The team confirms availability and the numbers that secure it.' },
                    ].map((s, i) => (
                      <li key={s.t} className="flex gap-3.5">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-brass-500/40 bg-marble-50 font-display text-xs font-semibold text-brass-700"
                        >
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-pine-900">{s.t}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{s.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-marble-200 pt-5">
                    <a
                      href="#visit"
                      className="btn-shine inline-flex min-h-[44px] items-center gap-2 rounded-full bg-pine-900 px-5 text-sm font-medium text-marble-50 transition-colors hover:bg-pine-700"
                    >
                      <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                      Book a viewing
                    </a>
                    <a
                      href={`https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent("Hi Lakeside! I've checked dates on your calendar and would like to ask if mine is free.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-brass-500/50 px-5 text-sm font-medium text-pine-900 transition-colors hover:border-ruby-500 hover:text-ruby-600"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Ask if it&rsquo;s free
                    </a>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-600/80">
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    Or call {SITE.phoneDisplay} — a person answers.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Weekend weddings (nav: "Weddings") — the gilded inclusions salon ── */}
      <section id="weddings" aria-label="What's included" className="marble-texture relative overflow-hidden border-y border-marble-200 bg-marble-50">
        <div aria-hidden="true" className="champagne-wash pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -top-24 left-0 h-64 w-96 opacity-40" />
        <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -bottom-20 right-0 h-56 w-72 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <OrnamentDivider tone="brass" center="rings" className="mb-8" />
            <p className="eyebrow eyebrow-dash text-brass-600">Weekend weddings include</p>
            <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900">
              The estate, the team,{' '}
              <em className="gold-gradient-text gold-gradient-text--deep">the details</em>
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
              One Saturday price, and almost everything already in it — walked through
              with you at the tasting, priced on the page, never itemised by surprise.
            </p>
          </Reveal>
          <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: GlassWater, t: 'Exclusive use of the estate', d: 'Chapel, reception, lawns and grounds for your day — never shared.' },
              { icon: HeartHandshake, t: 'Your own coordinator', d: 'On-site from 08h00 to 22h00, plus decor & food meetings and a final walkthrough.' },
              { icon: Sparkles, t: '4-course menu for every guest', d: '4 canapés, plated starter, plated or buffet main, plated dessert — designed with you.' },
              { icon: Cake, t: 'Engagement shoot on the estate', d: 'Return for your shoot among the pines, the lawns and the water.' },
              { icon: Music, t: 'Ceremony & reception kits', d: 'Arch, Tiffany chairs, tables, ghost chairs, sound system, podium, cake plinth.' },
              { icon: Zap, t: 'Power that doesn&rsquo;t blink', d: 'Auto-start generator — load-shedding never touches your timeline.', raw: true },
            ].map((item, i) => (
              <Reveal as="li" key={item.t} delay={i * 60}>
                <div className="glass-card-light group h-full rounded-[6px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_54px_-26px_rgba(16,38,30,0.4)] hover:ring-1 hover:ring-brass-500/50">
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-brass-500 to-brass-600 p-[1.5px] shadow-[0_8px_18px_-8px_rgba(184,155,106,0.8)] transition-transform duration-300 group-hover:scale-105"
                  >
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-marble-50 text-brass-600 transition-colors duration-300 group-hover:bg-pine-900 group-hover:text-gold-300">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </span>
                  {item.raw ? (
                    <h3
                      className="mt-4 font-display text-lg leading-snug text-pine-900"
                      dangerouslySetInnerHTML={{ __html: item.t }}
                    />
                  ) : (
                    <h3 className="mt-4 font-display text-lg leading-snug text-pine-900">{item.t}</h3>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.d}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal className="frame-corners relative mt-10">
            <span className="fc-b absolute inset-0" aria-hidden="true" />
            <div className="relative rounded-[4px] border border-brass-500/30 bg-gradient-to-br from-brass-500/[0.08] via-marble-50 to-gold-300/[0.12] p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <Rings className="h-6 w-auto shrink-0 text-brass-600" />
                <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-brass-500/50 to-transparent" />
                <span className="wax-dot" aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-900">
                <strong className="font-semibold text-brass-700">Also included —</strong> flavoured water bar, silver cutlery &amp;
                glass underplates, vases and candle holders, Beauty Room &amp; Bridal Suite &amp; Groom&rsquo;s Suite day
                use, honeymoon suite overnight for 2, a Food Experience for 2, and the canap&eacute; area after closing.
                Florals, decor and food are in-house only.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
