'use client';

/**
 * THE LAKESIDE — VISIT US + VIEWING SCHEDULER
 * In-person or virtual viewing request → POST /api/viewings.
 * Success state offers next steps (WhatsApp, add to plan).
 */

import { useState } from 'react';
import { SITE, WA_LINK } from '@/config/site';
import { buildIcs, downloadIcs } from '@/lib/ics';
import { Reveal } from './reveal';
import { CornerMarks, Rings } from './ornaments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin, Phone, Mail, Instagram, MessageCircle, CalendarCheck, CalendarPlus, CheckCircle2, Loader2,
  Copy, Check, Search, Navigation, XCircle,
} from 'lucide-react';

type Mode = 'in_person' | 'virtual';

function prettyWhen(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * MANAGE MY VIEWING — token-gated self-service.
 * The couple gets a reference (LS-XXXXXX) when they request a viewing;
 * with it they can check the status or ask to cancel. No login, no
 * personal data beyond what they typed themselves.
 */
type ManagedViewing = {
  reference: string;
  mode: string;
  status: string;
  preferredWhen: string | null;
  scheduledAt: string | null;
  firstName: string;
  weddingDate: string | null;
  guests: number | null;
  createdAt: string;
};

function ManageViewing({ initialReference }: { initialReference?: string }) {
  const [token, setToken] = useState(initialReference ?? '');
  const [state, setState] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<ManagedViewing | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function lookup(t: string) {
    setState('loading');
    setError('');
    setConfirming(false);
    try {
      const res = await fetch(`/api/viewings/manage?token=${encodeURIComponent(t)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      setViewing(json.viewing as ManagedViewing);
      setState('found');
    } catch (err) {
      setViewing(null);
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function cancel() {
    if (!viewing) return;
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/viewings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: viewing.reference, action: 'cancel' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      setViewing(json.viewing as ManagedViewing);
      setState('found');
      setConfirming(false);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  const statusLabel: Record<string, string> = {
    requested: 'Requested — we’ll confirm shortly',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
    done: 'Completed',
  };

  /** Confirmed slot → .ics in the couple's own calendar (same wall-clock the
   * card shows; venue has no DST so a floating time is unambiguous). */
  function addViewingToCalendar() {
    if (!viewing?.scheduledAt) return;
    const d = new Date(viewing.scheduledAt);
    if (Number.isNaN(d.getTime())) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const content = buildIcs(
      [
        {
          title: `Viewing — The Lakeside (${viewing.reference})`,
          date: dateIso,
          time,
          description: `${
            viewing.mode === 'virtual' ? 'Virtual viewing call' : 'Viewing on the estate'
          } — The Lakeside, ${SITE.address.street}, Pretoria East. Reference ${viewing.reference}. Questions? ${SITE.phoneDisplay} or ${SITE.emailViewings}`,
        },
      ],
      `The Lakeside — viewing ${viewing.reference}`,
    );
    downloadIcs(`lakeside-viewing-${viewing.reference}.ics`, content);
  }

  return (
    <div className="mt-6 rounded-[6px] border border-white/15 bg-white/5 p-5">
      <h4 className="font-display text-lg">Already requested a viewing?</h4>
      <p className="mt-1 text-xs leading-relaxed text-marble-50/70">
        Enter the reference from your confirmation (it looks like LS-ABC123) to
        check where it stands or to ask us to cancel it.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const t = token.trim().toUpperCase();
          if (t.length >= 6) void lookup(t);
        }}
      >
        <Label htmlFor="manage-token" className="sr-only">Viewing reference</Label>
        <Input
          id="manage-token"
          value={token}
          onChange={(e) => setToken(e.target.value.toUpperCase())}
          placeholder="LS-ABC123"
          autoComplete="off"
          className="flex-1 border-white/25 bg-white/10 text-marble-50 uppercase placeholder:text-marble-50/40"
        />
        <Button
          type="submit"
          disabled={state === 'loading' || token.trim().length < 6}
          className="rounded-full bg-marble-50 text-pine-900 hover:bg-white disabled:opacity-50"
        >
          {state === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          Check status
        </Button>
      </form>

      {state === 'error' && (
        <p role="alert" className="mt-3 rounded-[4px] border border-ember-500/50 bg-ember-500/10 px-3 py-2 text-xs text-marble-50">
          {error}
        </p>
      )}

      {state === 'found' && viewing && (
        <div className="mt-4 rounded-[4px] border border-white/15 bg-pine-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-marble-50">
              {viewing.mode === 'virtual' ? 'Virtual viewing' : 'Viewing on the estate'}
              {' · '}
              <span className="text-marble-50/70">{viewing.firstName}</span>
            </p>
            <span
              className={
                viewing.status === 'cancelled'
                  ? 'rounded-full border border-white/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-marble-50/60'
                  : 'rounded-full bg-brass-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brass-400'
              }
            >
              {statusLabel[viewing.status] ?? viewing.status}
            </span>
          </div>
          <p className="mt-2 text-xs text-marble-50/70">
            {viewing.status === 'cancelled'
              ? 'This request has been cancelled.'
              : viewing.scheduledAt
                ? `Confirmed for ${prettyWhen(viewing.scheduledAt)}`
                : viewing.preferredWhen
                  ? `You asked for ${prettyWhen(viewing.preferredWhen)} — we’ll confirm the exact time.`
                  : 'We’ll propose a time shortly.'}
            {viewing.weddingDate ? ` · Wedding date ${viewing.weddingDate}` : ''}
            {viewing.guests ? ` · ± ${viewing.guests} guests` : ''}
          </p>
          {viewing.scheduledAt && viewing.status !== 'cancelled' ? (
            <button
              type="button"
              onClick={addViewingToCalendar}
              className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border border-white/25 bg-white/5 px-3.5 py-2 text-xs font-medium text-marble-50 transition-colors hover:border-brass-500 hover:bg-brass-500/10 hover:text-brass-400"
            >
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Add to calendar (.ics)
            </button>
          ) : null}
          {viewing.status === 'requested' || viewing.status === 'scheduled' ? (
            confirming ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="text-xs text-marble-50/80">Cancel this viewing request?</p>
                <Button
                  size="sm"
                  onClick={() => void cancel()}
                  className="h-8 rounded-full bg-ember-500 px-3 text-xs text-white hover:bg-ember-600"
                >
                  Yes, cancel it
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirming(false)}
                  className="h-8 rounded-full px-3 text-xs text-marble-50/70 hover:bg-white/10 hover:text-marble-50"
                >
                  Keep it
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-marble-50/60 underline-offset-2 transition-colors hover:text-marble-50 hover:underline"
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Can’t make it? Cancel this request
              </button>
            )
          ) : null}
          {viewing.status === 'cancelled' && (
            <p className="mt-2 text-xs text-marble-50/60">
              Changed your mind? Book a new viewing above or WhatsApp us.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function Visit() {
  const [mode, setMode] = useState<Mode>('in_person');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [when, setWhen] = useState('');
  const [reference, setReference] = useState('');
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          preferredWhen: when,
          firstName: String(fd.get('firstName') ?? ''),
          lastName: String(fd.get('lastName') ?? ''),
          email: String(fd.get('email') ?? ''),
          phone: String(fd.get('phone') ?? ''),
          weddingDate: String(fd.get('weddingDate') ?? ''),
          guests: Number(fd.get('guests') ?? 0) || null,
          notes: String(fd.get('notes') ?? ''),
          consentContact: fd.get('consentContact') === 'on',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong');
      setReference(typeof json.reference === 'string' ? json.reference : '');
      setState('done');
      form.reset();
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  function copyReference() {
    if (!reference) return;
    void navigator.clipboard?.writeText(reference).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* clipboard unavailable — the chip is still visible */ });
  }

  return (
    <section id="visit" aria-label="Visit The Lakeside" className="relative overflow-hidden bg-pine-900 text-marble-50">
      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        { }
        <img src="/img/LS-082.webp" alt="" width={1600} height={1067} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left: info */}
          <Reveal className="lg:col-span-5">
            <Rings className="mb-5 h-6 w-auto text-gold-300/80 drop-shadow-[0_2px_8px_rgba(222,184,110,0.35)]" />
            <p className="eyebrow text-brass-400">Visit us</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">
              Come stand in the glass chapel.
            </h2>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-marble-50/85">
              Viewings are by appointment — in person on the estate or as a virtual walkthrough,
              whichever suits your planning. Tell us when, and we&rsquo;ll confirm.
            </p>

            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex items-start gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-gold-300/30 bg-white/5 text-brass-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-2 text-marble-50/85">
                  {SITE.address.street}<br />{SITE.address.area}<br />{SITE.address.country}
                </span>
              </li>
              <li className="flex items-start gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-gold-300/30 bg-white/5 text-brass-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </span>
                <a href={`tel:${SITE.phoneE164}`} className="pt-2 text-marble-50/85 underline-offset-4 hover:underline">
                  {SITE.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-gold-300/30 bg-white/5 text-brass-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <a href={`mailto:${SITE.emailViewings}`} className="pt-2 text-marble-50/85 underline-offset-4 hover:underline">
                  {SITE.emailViewings}
                </a>
              </li>
              <li className="flex items-start gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-gold-300/30 bg-white/5 text-brass-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </span>
                <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" className="pt-2 text-marble-50/85 underline-offset-4 hover:underline">
                  {SITE.social.instagramHandle}
                </a>
              </li>
            </ul>

            <div className="mt-8 rounded-[6px] border border-white/15 bg-white/5 p-5">
              <p className="text-sm font-medium text-marble-50">Just 30 minutes from Pretoria</p>
              <p className="mt-1 text-sm leading-relaxed text-marble-50/70">
                Tiegerpoort sits east of the city — close enough for guests, far enough for
                the sky. Directions are shared with every confirmed viewing.
                {/* TODO(CLIENT): verify drive times from Pretoria CBD, Menlyn, Joburg, OR Tambo */}
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=The+Lakeside+venue+Tiegerpoort+Road+Pretoria+East"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 px-4 text-sm font-medium text-marble-50 transition-colors hover:bg-white/10"
              >
                <Navigation className="h-4 w-4 text-brass-400" aria-hidden="true" />
                Get directions (Google Maps)
              </a>
            </div>
          </Reveal>

          {/* Right: scheduler */}
          <Reveal delay={120} className="lg:col-span-7">
            <div className="glass-card relative rounded-[6px] p-6 sm:p-8">
              <CornerMarks inset="12px" tone="gold" />
              {state === 'done' ? (
                <div className="flex flex-col items-center py-10 text-center" role="status">
                  <CheckCircle2 className="h-12 w-12 text-brass-400" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-2xl">Thank you — request received.</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-marble-50/80">
                    We&rsquo;ll confirm your {mode === 'in_person' ? 'viewing on the estate' : 'virtual viewing'} shortly.
                    Meanwhile, share the date you have in mind with your partner, or ask us anything on WhatsApp.
                  </p>
                  {reference ? (
                    <div className="mt-6 w-full max-w-sm rounded-[6px] border border-brass-500/40 bg-brass-500/10 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-brass-400">Your reference</p>
                      <div className="mt-1.5 flex items-center justify-center gap-2">
                        <span className="font-display text-2xl tracking-wide text-marble-50">{reference}</span>
                        <button
                          type="button"
                          onClick={copyReference}
                          aria-label={copied ? 'Reference copied' : 'Copy reference'}
                          className="flex size-9 items-center justify-center rounded-full border border-white/20 text-marble-50/80 transition-colors hover:bg-white/10 hover:text-marble-50"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-brass-400" aria-hidden="true" />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <p aria-live="polite" className="mt-1.5 text-xs leading-relaxed text-marble-50/70">
                        {copied ? 'Copied — save it somewhere handy.' : 'Save this to check your viewing status or reschedule later.'}
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button asChild className="rounded-full bg-brass-500 text-pine-900 hover:bg-brass-400">
                      <a href={WA_LINK("Hi Lakeside! I've just requested a viewing on your website.")}>
                        <MessageCircle className="mr-1.5 h-4 w-4" aria-hidden="true" /> WhatsApp us
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full border-white/25 bg-transparent text-marble-50 hover:bg-white/10 hover:text-marble-50">
                      <a href="#date">Check your date</a>
                    </Button>
                  </div>
                  <div className="mt-2 w-full max-w-md text-left">
                    <ManageViewing initialReference={reference} />
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} noValidate={false}>
                  <h3 className="font-display text-2xl">Book a viewing</h3>
                  <p className="mt-1 text-sm text-marble-50/70">
                    Takes under a minute. No deposit, no obligation.
                  </p>

                  {/* Mode toggle */}
                  <fieldset className="mt-6">
                    <legend className="text-xs uppercase tracking-[0.12em] text-marble-50/70">How would you like to view?</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Viewing mode">
                      {(['in_person', 'virtual'] as Mode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={mode === m}
                          onClick={() => setMode(m)}
                          className={`rounded-[4px] border px-4 py-3 text-sm font-medium transition-colors ${
                            mode === m
                              ? 'border-brass-500 bg-brass-500/15 text-marble-50'
                              : 'border-white/20 bg-white/5 text-marble-50/70 hover:border-white/40'
                          }`}
                        >
                          <CalendarCheck className="mr-2 inline h-4 w-4" aria-hidden="true" />
                          {m === 'in_person' ? 'In person' : 'Virtual call'}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="v-first" className="text-marble-50/80">First name *</Label>
                      <Input id="v-first" name="firstName" required autoComplete="given-name" className="border-white/25 bg-white/10 text-marble-50 placeholder:text-marble-50/40" placeholder="Alex" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="v-last" className="text-marble-50/80">Last name *</Label>
                      <Input id="v-last" name="lastName" required autoComplete="family-name" className="border-white/25 bg-white/10 text-marble-50 placeholder:text-marble-50/40" placeholder="Mokoena" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="v-email" className="text-marble-50/80">Email *</Label>
                      <Input id="v-email" name="email" type="email" required autoComplete="email" className="border-white/25 bg-white/10 text-marble-50 placeholder:text-marble-50/40" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="v-phone" className="text-marble-50/80">Phone (WhatsApp) *</Label>
                      <Input id="v-phone" name="phone" type="tel" required autoComplete="tel" className="border-white/25 bg-white/10 text-marble-50 placeholder:text-marble-50/40" placeholder="+27 …" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="v-when" className="text-marble-50/80">
                        {mode === 'in_person' ? 'Preferred date & time' : 'Preferred call time'}
                      </Label>
                      <Input
                        id="v-when"
                        type="datetime-local"
                        value={when}
                        onChange={(e) => setWhen(e.target.value)}
                        className="border-white/25 bg-white/10 text-marble-50 [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="v-date" className="text-marble-50/80">Wedding date (if set)</Label>
                      <Input id="v-date" name="weddingDate" type="date" min="2026-10-10" max="2027-12-31" className="border-white/25 bg-white/10 text-marble-50 [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="v-guests" className="text-marble-50/80">Guests (estimate)</Label>
                      <Input id="v-guests" name="guests" type="number" min={2} max={200} className="border-white/25 bg-white/10 text-marble-50" placeholder="100" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="v-notes" className="text-marble-50/80">Anything we should know?</Label>
                      <Textarea id="v-notes" name="notes" rows={2} className="resize-none border-white/25 bg-white/10 text-marble-50 placeholder:text-marble-50/40" placeholder="We love the chapel for a winter ceremony…" />
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-3">
                    <Checkbox id="v-consent" name="consentContact" required className="mt-0.5 border-white/40 data-[state=checked]:bg-brass-500 data-[state=checked]:text-pine-900" />
                    <Label htmlFor="v-consent" className="text-xs leading-relaxed text-marble-50/70">
                      The Lakeside may contact me about this enquiry. *
                    </Label>
                  </div>

                  {state === 'error' && (
                    <p role="alert" className="mt-4 rounded-[4px] border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm text-marble-50">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={state === 'sending'}
                    className="mt-6 w-full rounded-full bg-brass-500 py-6 text-base font-medium text-pine-900 hover:bg-brass-400 disabled:opacity-60"
                  >
                    {state === 'sending' ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Sending…</>
                    ) : (
                      'Request my viewing'
                    )}
                  </Button>
                  <p className="mt-3 text-center text-xs text-marble-50/60">
                    Prefer to talk now?{' '}
                    <a href={`tel:${SITE.phoneE164}`} className="underline underline-offset-2 hover:text-marble-50">Call {SITE.phoneDisplay}</a>
                    {' '}or{' '}
                    <a href={WA_LINK("Hi Lakeside! I'd like to book a viewing.")} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-marble-50">
                      WhatsApp
                    </a>
                  </p>
                </form>
              )}

              {/* Always reachable: a couple returning with a saved reference
                  must be able to check/cancel without re-booking first. Sits
                  OUTSIDE the booking form (no nested <form>) and next to the
                  copy on the thank-you card. */}
              {state !== 'done' ? (
                <div className="mt-6 border-t border-gold-300/20 pt-5">
                  <ManageViewing />
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
