'use client';

/**
 * THE LAKESIDE — CHEF, FOOD EXPERIENCE WAITLIST, ACCOMMODATION, BEYOND WEDDINGS
 */

import { useState } from 'react';
import { PRICING, PACKAGE_INCLUSIONS } from '@/config/pricing';
import { formatZAR } from '@/lib/pricing-engine';
import { WA_LINK } from '@/config/site';
import { Reveal } from './reveal';
import { CornerMarks, FloralSprig } from './ornaments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight, BadgeCheck, BedDouble, BellRing, Briefcase, CalendarClock, Camera,
  CheckCircle2, Heart, Loader2, Users, UtensilsCrossed, Wine,
} from 'lucide-react';

/**
 * Food Experience list — honest by design: a Food Experience for two is
 * included with every booking, and events run every 3–4 months. No invented
 * dates, no seats-left counters. Captures a lead via /api/leads
 * (source: food_experience_waitlist).
 * TODO(CLIENT): confirm whether Food Experiences are open to public RSVP
 * before booking — the form copy assumes they are not yet bookable events.
 */
function TastingWaitlist() {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: String(fd.get('firstName') ?? ''),
          email: String(fd.get('email') ?? ''),
          source: 'food_experience_waitlist',
          message: 'Food Experience list — hear about the next event',
          consentContact: true,
          consentMarketing: fd.get('consentMarketing') === 'on',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      setState('done');
      form.reset();
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (state === 'done') {
    return (
      <div id="tasting" role="status" className="mt-6 flex items-start gap-3 rounded-[6px] border border-brass-500/40 bg-brass-500/10 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brass-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-marble-50/90">
          You&rsquo;re on the list. We&rsquo;ll email you the moment the next Food Experience date opens —
          seats go to the list first.
        </p>
      </div>
    );
  }

  return (
    <form id="tasting" onSubmit={submit} className="glass-card mt-6 rounded-[6px] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-brass-500 to-brass-600 p-[1.5px] shadow-[0_8px_18px_-8px_rgba(184,155,106,0.8)]"
        >
          <span className="flex h-full w-full items-center justify-center rounded-full bg-pine-900 text-gold-300">
            <BellRing className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
        <div>
          <p className="text-sm font-semibold text-marble-50">Hear about the next Food Experience</p>
          <p className="mt-1 text-xs leading-relaxed text-marble-50/70">
            A Food Experience for two is included with your booking, and events run every
            3&ndash;4 months. One email when the next date opens — no spam.
          </p>
        </div>
      </div>
      <div aria-hidden="true" className="brass-hairline mt-4 opacity-40" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tw-name" className="text-marble-50/80">First name</Label>
          <Input
            id="tw-name"
            name="firstName"
            required
            autoComplete="given-name"
            placeholder="Alex"
            className="h-11 border-white/20 bg-white/10 text-marble-50 placeholder:text-marble-50/40 focus-visible:border-brass-400 focus-visible:ring-brass-500/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tw-email" className="text-marble-50/80">Email</Label>
          <Input
            id="tw-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 border-white/20 bg-white/10 text-marble-50 placeholder:text-marble-50/40 focus-visible:border-brass-400 focus-visible:ring-brass-500/30"
          />
        </div>
      </div>
      <label className="mt-3.5 flex items-start gap-2.5 text-xs text-marble-50/70">
        <input type="checkbox" name="consentMarketing" className="mt-0.5 h-4 w-4 accent-brass-500" />
        Also tell me about weekday offers and estate news (optional).
      </label>
      {state === 'error' && (
        <p role="alert" className="mt-3 rounded-[4px] border border-ember-500/50 bg-ember-500/10 px-3 py-2 text-xs text-marble-50">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={state === 'sending'}
        className="btn-shine gold-surface mt-5 h-11 w-full rounded-full text-sm font-semibold tracking-wide sm:w-auto sm:px-8"
      >
        {state === 'sending' ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Adding…</>
        ) : (
          'Keep me posted'
        )}
      </Button>
    </form>
  );
}

// Chef fact rows — verified facts only; icons give each promise its own medallion.
const CHEF_FACTS = [
  { icon: UtensilsCrossed, text: '4 courses on weekends; 3 plated courses on weekday packages' },
  { icon: BadgeCheck, text: 'Halaal-certified meat at no extra cost; kosher available (surcharge)' },
  { icon: Wine, text: 'A Food Experience for two is included with your booking. Experiences run every 3 to 4 months' },
];

export function ChefAccommodation() {
  return (
    <>
      {/* ── Chef — the gilded kitchen ─────────────────────────────────── */}
      <section id="chef" aria-label="Our chef" className="relative overflow-hidden bg-pine-800 text-marble-50">
        {/* Atmosphere: deep-pine depth, warm gold & ruby blooms, champagne top light */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pine-900/85 via-transparent to-pine-900/85" />
        <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -top-28 right-[-8rem] h-80 w-[34rem] opacity-50" />
        <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -bottom-24 left-[-7rem] h-72 w-96 opacity-25" />
        <div aria-hidden="true" className="brass-hairline absolute inset-x-0 top-0 opacity-50" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-28">
          <Reveal className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Gilded frame: polished gold ring + engraved corner marks */}
              <div className="relative rounded-[6px] bg-gradient-to-br from-gold-300/90 via-brass-500/40 to-brass-700/80 p-[1.5px] shadow-[0_36px_90px_-32px_rgba(0,0,0,0.75)]">
                <div className="relative overflow-hidden rounded-[5px]">
                  <img
                    src="/img/LS-039.webp"
                    alt="A plated course from The Lakeside kitchen"
                    loading="lazy"
                    decoding="async"
                    width={1073}
                    height={1600}
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine-950/70 via-pine-950/10 to-transparent" />
                </div>
                <CornerMarks inset="14px" tone="gold" />
              </div>
              {/* TODO(CLIENT): Chef Jenna portrait + consent */}
              {/* Title plaque — "Lady of Delectable Delights" is Chef Jenna's
                  title from the brochure, rendered as a title, not a quote. */}
              <figure className="glass-card absolute -bottom-6 left-1/2 w-[min(86%,20rem)] -translate-x-1/2 rounded-[6px] px-5 py-4 text-center sm:left-auto sm:right-[-1.25rem] sm:w-60 sm:translate-x-0">
                <FloralSprig className="mx-auto h-5 w-auto text-gold-300" />
                <p className="mt-2 font-display text-lg leading-snug text-gold-300">
                  Chef Jenna
                </p>
                <figcaption className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-marble-50/70">
                  Lady of Delectable Delights
                </figcaption>
              </figure>
            </div>
          </Reveal>

          <Reveal delay={120} className="flex flex-col justify-center lg:col-span-7">
            <p className="eyebrow eyebrow-dash text-brass-400">The kitchen</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">
              Meet <em className="gold-gradient-text">Chef Jenna</em>.
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-marble-50/85">
              Four courses, designed with you — never copied from the last couple. Chef
              Jenna and her team cook for your menu, your season and your guests, from
              canap&eacute;s on the lawn to the last midnight snack.
            </p>
            <ul className="mt-8">
              {CHEF_FACTS.map((f, i) => (
                <li key={f.text}>
                  <div className="flex items-center gap-4 py-3.5">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-brass-500 to-brass-600 p-[1.5px] shadow-[0_8px_18px_-8px_rgba(184,155,106,0.8)]"
                    >
                      <span className="flex h-full w-full items-center justify-center rounded-full bg-pine-900 text-gold-300">
                        <f.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </span>
                    <p className="text-sm leading-relaxed text-marble-50/85">{f.text}</p>
                  </div>
                  {i < CHEF_FACTS.length - 1 && <div aria-hidden="true" className="brass-hairline opacity-30" />}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="btn-shine gold-surface h-11 rounded-full px-6 text-sm font-semibold tracking-wide">
                <a href="#tasting">Hear about the next Food Experience <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" /></a>
              </Button>
            </div>
            <TastingWaitlist />
          </Reveal>
        </div>
      </section>

      {/* ── Accommodation — the gilded guest wing ─────────────────────── */}
      <section id="stay" aria-label="Stay the night" className="marble-texture relative overflow-hidden bg-marble-50">
        <div aria-hidden="true" className="champagne-wash pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <Reveal className="lg:col-span-4">
              <p className="eyebrow eyebrow-dash text-brass-600">On the estate</p>
              <h2 className="mt-3 font-display text-4xl font-medium text-pine-900">
                Stay <em className="gold-gradient-text--deep">the night</em>.
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
                Nine rooms, up to 18 guests, reserved exclusively for your wedding party.
                The heritage slate house and the manor sit steps from the water; the
                bridal suite and groom&rsquo;s cabin keep the morning quiet and close.
              </p>

              {/* Gilded rate plaque — one row per room, proper '26 / '27 columns */}
              <div className="frame-corners relative mt-8">
                <span aria-hidden="true" className="fc-b absolute inset-0" />
                <div className="relative rounded-[4px] border border-brass-500/30 bg-gradient-to-br from-brass-500/[0.08] via-marble-50 to-gold-300/[0.12] p-5 sm:p-6">
                  <div className="flex items-center gap-2.5">
                    <BedDouble className="h-4 w-4 shrink-0 text-brass-600" aria-hidden="true" />
                    <h3 className="font-display text-base text-pine-900">Nightly rates</h3>
                    <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-brass-500/50 to-transparent" />
                    <span className="wax-dot" aria-hidden="true" />
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_4.5rem_4.5rem] items-baseline gap-x-2 sm:grid-cols-[1fr_5rem_5rem] sm:gap-x-4">
                    <span aria-hidden="true" />
                    <span className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-700">&rsquo;26</span>
                    <span className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-700">&rsquo;27</span>
                  </div>
                  <div aria-hidden="true" className="brass-hairline mt-2 opacity-60" />
                  {[
                    { t: 'Heritage House', p26: PRICING.years[2026].rooms.heritage, p27: PRICING.years[2027].rooms.heritage },
                    { t: 'Manor House', p26: PRICING.years[2026].rooms.manor, p27: PRICING.years[2027].rooms.manor },
                    { t: 'Bridal Suite / Groom’s Cabin', p26: PRICING.years[2026].rooms.suite, p27: PRICING.years[2027].rooms.suite },
                  ].map((r) => (
                    <div
                      key={r.t}
                      className="grid grid-cols-[1fr_4.5rem_4.5rem] items-baseline gap-x-2 border-b border-marble-200/80 py-3 last:border-b-0 sm:grid-cols-[1fr_5rem_5rem] sm:gap-x-4"
                    >
                      <span className="text-sm font-medium leading-snug text-pine-900">{r.t}</span>
                      <span className="text-right font-display text-lg tabular text-ink-600">{formatZAR(r.p26)}</span>
                      <span className="text-right font-display text-lg tabular text-pine-900">{formatZAR(r.p27)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-4 flex gap-2.5 text-xs leading-relaxed text-ink-600">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brass-600" aria-hidden="true" />
                <span>
                  Check-in: Beauty Room from 08h00 · Bridal Suite &amp; Groom&rsquo;s Cabin from 11h00 ·
                  rooms from 13h00. Check-out strictly 09h00 · no breakfast served · rooms are for your
                  wedding party only. Late check-out {formatZAR(PRICING.fees.lateCheckoutPerRoomHour)} per room per hour.
                </span>
              </p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5 lg:col-span-8">
              {[
                { img: '/img/LS-072.webp', w: 1600, h: 1083, alt: 'The thatched manor interior: chandeliers, spiral stair and fireplace', label: 'Manor House' },
                { img: '/img/LS-032.webp', w: 1600, h: 1067, alt: 'Heritage House bedroom', label: 'Heritage House' },
                { img: '/img/LS-028.webp', w: 773, h: 1010, alt: 'The Bridal Suite lounge', label: 'Bridal Suite' },
              ].map((room, i) => (
                <Reveal key={room.label} delay={i * 90}>
                  <figure className="group relative overflow-hidden rounded-[6px] shadow-[0_24px_60px_-30px_rgba(16,38,30,0.4)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_36px_72px_-30px_rgba(16,38,30,0.55)] hover:ring-1 hover:ring-brass-500/60">
                    <img
                      src={room.img}
                      alt={room.alt}
                      loading="lazy"
                      decoding="async"
                      width={room.w}
                      height={room.h}
                      className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                    {/* Bottom scrim + full-width label bar: never clipped */}
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-pine-950/85 via-pine-950/30 to-transparent" />
                    <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-4 pb-3.5 pt-8">
                      <span className="flex min-h-[28px] items-center gap-2 text-sm font-semibold tracking-wide text-marble-50">
                        <BedDouble className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" /> {room.label}
                      </span>
                      <span aria-hidden="true" className="hidden h-px w-8 bg-gradient-to-r from-gold-300/80 to-transparent sm:block" />
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>

          {/* CTA row — rooms are reserved and billed with the wedding itself */}
          <Reveal className="frame-corners relative mt-12">
            <span aria-hidden="true" className="fc-b absolute inset-0" />
            <div className="relative flex flex-col gap-5 rounded-[4px] border border-brass-500/30 bg-gradient-to-br from-gold-300/[0.14] via-marble-50 to-brass-500/[0.08] p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7">
              <div className="max-w-xl">
                <p className="font-display text-xl text-pine-900 sm:text-2xl">Reserve rooms with your date</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  Accommodation is booked with your wedding date and paid to the venue in one payment.
                </p>
              </div>
              <Button asChild className="btn-shine gold-surface h-11 shrink-0 rounded-full px-6 text-sm font-semibold tracking-wide">
                <a href="#visit">Book a viewing <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" /></a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Beyond weddings ───────────────────────────────────────────── */}
      <section id="events" aria-label="Beyond weddings" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-brass-600">Beyond weddings</p>
            <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900">
              Every occasion,{' '}
              <em className="gold-gradient-text gold-gradient-text--deep">the same care</em>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users, title: 'Corporate & year-end',
                line: 'Formal or canapé-style conferences and celebrations. Custom packages on request.',
                wa: 'Hi Lakeside! We are planning a corporate function and would like details.',
              },
              {
                icon: Camera, title: 'Photoshoots',
                line: `${formatZAR(PRICING.photoshoot.stillsPerHour)}/hour for couples & families up to ${PRICING.photoshoot.maxPax}; video ${formatZAR(PRICING.photoshoot.videoPerHour)}/hour. Best at weekday sunset.`,
                wa: 'Hi Lakeside! We would like to book a photoshoot on the estate.',
              },
              {
                icon: Heart, title: 'Proposals',
                line: `From ${formatZAR(PRICING.proposals.canapeDeck)} on the Canapé Deck to ${formatZAR(PRICING.proposals.marbleReception)} in the Marble Reception. Mon–Fri, one hour, add-ons available.`,
                wa: 'Hi Lakeside! I am planning a proposal and would like to check dates.',
              },
              {
                icon: Briefcase, title: 'Private celebrations',
                line: 'Birthdays, 21sts, christenings and family milestones on the lawns. Ask us for details.',
                wa: 'Hi Lakeside! We are planning a private celebration and would like details.',
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 70}>
                <article className="group flex h-full flex-col rounded-[6px] border border-marble-200 bg-marble-50 p-6 transition-shadow hover:shadow-[0_24px_60px_-32px_rgba(16,38,30,0.4)]">
                  <card.icon className="h-6 w-6 text-brass-600" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-xl text-pine-900">{card.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{card.line}</p>
                  <a
                    href={WA_LINK(card.wa)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pine-900 underline decoration-brass-500 decoration-2 underline-offset-4 hover:text-brass-600"
                  >
                    Ask on WhatsApp <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8 text-center">
            <p className="text-xs text-ink-600">
              Package contents: {PACKAGE_INCLUSIONS.weekend.mealCourses.toLowerCase()} — the full list is printed under Weekend weddings.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
