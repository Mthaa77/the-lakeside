'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — POPIA PRIVACY NOTICE + DATA-REQUESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * Plain-language privacy notice (Protection of Personal Information Act, 2013)
 * covering exactly what THIS website collects, and a self-service form to
 * request access / correction / deletion. Requests are captured as leads the
 * team actions by hand — no invented automation, no invented retention times.
 * TODO(CLIENT): formal privacy-policy PDF + Information Officer details.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Reveal } from './reveal';
import { SITE } from '@/config/site';
import { Check, Database, Lock, ScrollText, ShieldCheck } from 'lucide-react';

type RequestType = 'access' | 'correction' | 'deletion';

const TYPES: { value: RequestType; label: string }[] = [
  { value: 'access', label: 'Send me a copy of my information' },
  { value: 'correction', label: 'Correct my information' },
  { value: 'deletion', label: 'Delete my information' },
];

const FACTS = [
  {
    icon: Database,
    title: 'What this site keeps',
    points: [
      'Enquiries, viewing bookings and estimates you send us (name, contact, wedding details).',
      'Estimates you save stay on your own device — “your estimates on this device” is local storage, not our database.',
      'Nothing is sold, and we don’t run ads or trackers.',
    ],
  },
  {
    icon: Lock,
    title: 'How it’s used',
    points: [
      'Only to answer your enquiry, confirm viewings and prepare your quote.',
      'Marketing messages (like the Food Experience waitlist) only if you ticked “keep me posted”.',
      'You can ask us to stop contacting you at any time — we will.',
    ],
  },
  {
    icon: ScrollText,
    title: 'Your POPIA rights',
    points: [
      'Ask for a copy of what we hold, ask us to correct it, or ask us to delete it.',
      'Object to us keeping your details, or complain to the Information Regulator — your call.',
      'Use the form below or email us; a real person confirms every request.',
    ],
  },
];

export function PrivacyNotice() {
  const [type, setType] = useState<RequestType>('access');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [detail, setDetail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, firstName, email, detail, consentContact: consent }),
      });
      const json = res.ok ? await res.json() : null;
      if (res.ok && json?.ok) {
        setState('sent');
      } else {
        setErrorMsg(json?.error ?? 'Something went wrong — please email us directly.');
        setState('error');
      }
    } catch {
      setErrorMsg('No connection — please email us directly.');
      setState('error');
    }
  }

  return (
    <section id="privacy" aria-label="Your privacy (POPIA)" className="border-t border-marble-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Reveal className="max-w-2xl">
          <p className="eyebrow eyebrow-dash text-brass-600">Your privacy, in plain words</p>
          <h2 className="mt-3 flex items-center gap-3 font-display text-3xl font-medium text-pine-900 sm:text-4xl">
            <ShieldCheck className="h-7 w-7 text-brass-600" aria-hidden="true" />
            Privacy &amp; POPIA
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
            We plan weddings — we don’t trade in data. This is everything this website
            collects and what happens to it, without the legalese. POPIA is South
            Africa’s Protection of Personal Information Act, and these are your rights
            over the details you share with us.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {FACTS.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} as="article" className="glass-card-light h-full rounded-[6px] p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-900/[0.06] text-brass-600">
                <f.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-medium text-pine-900">{f.title}</h3>
              <ul className="mt-3 space-y-2">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm leading-relaxed text-ink-600">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-brass-600" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        {/* Data-request form */}
        <Reveal className="mt-10">
          <div className="grid gap-8 rounded-[6px] border border-marble-200 bg-marble-50 p-6 shadow-[0_20px_60px_-40px_rgba(16,38,30,0.35)] sm:p-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h3 className="font-display text-xl text-pine-900">Ask us about your information</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Pick a request, tell us who you are, and one of our team will confirm and
                act on it personally — the same person who’d answer your WhatsApp.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-ink-600/80">
                Prefer email? Write to{' '}
                <a href={`mailto:${SITE.emailViewings}`} className="font-medium text-pine-900 underline underline-offset-2 hover:text-brass-600">
                  {SITE.emailViewings}
                </a>
                .{/* TODO(CLIENT): link the signed privacy-policy PDF once hosted */}
              </p>
            </div>

            <div className="lg:col-span-7">
              {state === 'sent' ? (
                <div role="status" className="flex h-full min-h-[180px] flex-col items-start justify-center rounded-[4px] border border-brass-500/40 bg-brass-500/[0.07] p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brass-500 text-white">
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-medium text-pine-900">Request received.</p>
                  <p className="mt-1 text-sm text-ink-600">
                    We’ll confirm it’s really you (reply to {email || 'your email'}) and act on it.
                    Your request is logged with our team right now — reference saved against your email.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} noValidate={false} className="space-y-4">
                  <fieldset>
                    <legend className="text-xs font-semibold uppercase tracking-wider text-ink-900">Your request</legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {TYPES.map((t) => {
                        const on = t.value === type;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setType(t.value)}
                            className={
                              'min-h-[44px] rounded-[4px] border px-3 text-xs font-medium leading-snug transition-colors ' +
                              (on
                                ? 'border-pine-900 bg-pine-900 text-marble-50'
                                : 'border-marble-200 bg-white text-pine-900 hover:border-brass-500 hover:bg-brass-500/10')
                            }
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="p-name">First name *</Label>
                      <Input
                        id="p-name"
                        required
                        maxLength={80}
                        placeholder="Alex"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="p-email">Email the request comes from *</Label>
                      <Input
                        id="p-email"
                        type="email"
                        required
                        maxLength={160}
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="p-detail">Anything specific? (optional)</Label>
                    <Textarea
                      id="p-detail"
                      rows={2}
                      maxLength={1000}
                      className="resize-none"
                      placeholder="e.g. the viewing request I made in March"
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                    />
                  </div>

                  <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-600">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brass-500"
                    />
                    <span>
                      The Lakeside may contact me to verify and complete this request. *{' '}
                      <a href="#privacy" className="underline underline-offset-2 hover:text-brass-600">POPIA notice above</a>
                    </span>
                  </label>

                  {/* Honeypot — hidden from humans */}
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                  {state === 'error' && (
                    <p role="alert" className="rounded-[4px] border border-ember-500/50 bg-ember-500/10 px-4 py-2.5 text-sm text-ink-900">
                      {errorMsg}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={state === 'sending'}
                    className="min-h-[48px] w-full rounded-[4px] bg-pine-900 text-base text-marble-50 hover:bg-pine-800 disabled:opacity-60 sm:w-auto sm:px-8"
                  >
                    {state === 'sending' ? 'Sending…' : 'Send my request'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
