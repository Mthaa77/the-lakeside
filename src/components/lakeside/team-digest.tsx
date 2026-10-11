'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — TEAM DIGEST (hidden admin-lite panel)
 * ─────────────────────────────────────────────────────────────────────────────
 * No nav link, no crawler value: the panel only mounts when the URL hash is
 * #team-digest (the team bookmarks /#team-digest). Token-gated against
 * GET /api/admin/digest?token=… (ADMIN_TOKEN env var, dev fallback documented
 * there). Shows real rows only — counts + latest enquiries, viewings, quotes.
 *
 * Editable in-place (POST /api/admin/pipeline & /api/admin/availability):
 *   • lead status + a short ops note
 *   • viewing status + the confirmed slot (couple's manage link shows it)
 *   • the availability board the public date checker reads
 * Everything else mirrors the database. CSV export of enquiries is generated
 * client-side from the rows already shown — nothing extra is exposed.
 *
 * TODO(CLIENT): set a strong ADMIN_TOKEN before launch; this panel is a
 * stop-gap until a proper admin app exists.
 */

import * as React from 'react';
import {
  CalendarCheck2,
  Check,
  ChevronDown,
  Copy,
  Download,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatZAR } from '@/lib/pricing-engine';

type Digest = {
  ok: boolean;
  counts: {
    leads: number;
    quotes: number;
    viewings: number;
    viewingsByStatus: Record<string, number>;
    tastingWaitlist: number;
  };
  leads: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    weddingDate: string | null;
    guests: number | null;
    source: string | null;
    status: string;
    score: number;
    notes: string | null;
    eventType: string;
    message: string | null;
    quoteId: string | null;
    createdAt: string;
  }[];
  viewings: {
    id: string;
    manageToken: string;
    mode: string;
    status: string;
    preferredWhen: string | null;
    scheduledAt: string | null;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    weddingDate: string | null;
    guests: number | null;
    createdAt: string;
  }[];
  quotes: {
    shortId: string;
    createdAt: string;
    date: string | null;
    adults: number | null;
    packageName: string | null;
    total: number | null;
  }[];
  availability: {
    day: string;
    state: string;
    note: string | null;
    updatedAt: string;
  }[];
  shown?: { leads: number; viewings: number; quotes: number };
  generatedAt: string;
};

const dt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

const dtt = (iso: string) =>
  new Date(iso).toLocaleString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });

// ── Status vocabularies (mirror prisma/schema.prisma comments) ──────────────

const LEAD_STATUSES = [
  'new', 'contacted', 'viewing_booked', 'viewed', 'proposal_sent', 'booked', 'lost', 'spam',
] as const;

const VIEWING_STATUSES = ['requested', 'scheduled', 'cancelled', 'done'] as const;

const LEAD_STATUS_LABEL: Record<string, string> = {
  new: 'new',
  contacted: 'contacted',
  viewing_booked: 'viewing booked',
  viewed: 'viewed',
  proposal_sent: 'proposal sent',
  booked: 'booked',
  lost: 'lost',
  spam: 'spam',
};

/** Small status dot — groups statuses into fresh / active / won / gone. */
const STATUS_DOT: Record<string, string> = {
  // leads
  new: 'bg-brass-400',
  contacted: 'bg-marble-50/70',
  viewing_booked: 'bg-marble-50/70',
  viewed: 'bg-marble-50/70',
  proposal_sent: 'bg-marble-50/70',
  booked: 'bg-pine-400',
  lost: 'bg-ember-500',
  spam: 'bg-ember-500',
  // viewings
  requested: 'bg-brass-400',
  scheduled: 'bg-pine-400',
  cancelled: 'bg-ember-500',
  done: 'bg-marble-50/70',
};

// ── WhatsApp deep link from a stored phone number ───────────────────────────

function waHref(phone: string | null | undefined, text?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 8) return null;
  // Local-format numbers starting with 0 get the SA country code.
  const normalized = digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
  return text
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${normalized}`;
}

/** Clipboard write with the execCommand fallback (file:// / permission edge). */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  }
}

function WaLink({ phone, name }: { phone: string | null | undefined; name: string }) {
  const href = waHref(phone);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`WhatsApp ${name}`}
      title={`WhatsApp ${name}`}
      className="inline-flex size-8 items-center justify-center rounded-[4px] text-marble-50/60 transition-colors hover:bg-brass-500/10 hover:text-brass-400"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

// ── Shared status select (native — usable on every phone the team owns) ─────

function StatusSelect({
  value,
  options,
  labels,
  onCommit,
  disabled,
  ariaLabel,
}: {
  value: string;
  options: readonly string[];
  labels?: Record<string, string>;
  onCommit: (next: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <span className="relative inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[value] ?? 'bg-marble-50/40')}
      />
      <select
        aria-label={ariaLabel}
        disabled={disabled}
        value={value}
        onChange={(e) => onCommit(e.target.value)}
        className="h-8 cursor-pointer appearance-none rounded-full border border-white/20 bg-white/10 pr-6 pl-2.5 text-[10px] font-medium uppercase tracking-wide text-marble-50 transition-colors [color-scheme:dark] hover:border-brass-500/60 focus:border-brass-500 focus:outline-none disabled:opacity-50"
      >
        {options.map((s) => (
          <option key={s} value={s} className="bg-pine-900 text-marble-50 normal-case">
            {labels?.[s] ?? s}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2 h-3 w-3 text-marble-50/60"
      />
    </span>
  );
}

// ── Lead note editor (expandable per row) ───────────────────────────────────

function LeadNoteEditor({
  initial,
  busy,
  onSave,
}: {
  initial: string;
  busy: boolean;
  onSave: (note: string) => void;
}) {
  const [draft, setDraft] = React.useState(initial);
  return (
    <div className="mt-2 border-t border-white/10 pt-2">
      <label className="text-[11px] font-medium text-marble-50/70">
        Ops note (only the team sees this)
      </label>
      <textarea
        value={draft}
        maxLength={280}
        rows={2}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. wants Saturday Oct 2027, sent brochure, decide after Heritage Day"
        className="mt-1 w-full rounded-[4px] border border-white/20 bg-white/10 px-3 py-2 text-xs text-marble-50 placeholder:text-marble-50/40 focus:border-brass-500 focus:outline-none"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSave(draft)}
          className="inline-flex h-9 items-center rounded-[4px] border border-brass-500/60 px-3 text-xs font-medium text-brass-400 transition-colors hover:bg-brass-500/10 disabled:opacity-50"
        >
          Save note
        </button>
        <span className="text-[10px] text-marble-50/40">{draft.length}/280</span>
      </div>
    </div>
  );
}

// ── Confirmed-slot picker (viewing → scheduled) ──────────────────────────────

function SlotPicker({
  initial,
  busy,
  onSave,
}: {
  initial: string | null;
  busy: boolean;
  onSave: (isoLocal: string) => void;
}) {
  // datetime-local wants "YYYY-MM-DDTHH:mm"
  const initialLocal = initial
    ? new Date(initial)
      .toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .replace(' ', 'T')
    : '';
  const [value, setValue] = React.useState(initialLocal);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2">
      <label htmlFor={`slot-${initial ?? 'new'}`} className="sr-only">
        Confirmed slot date and time
      </label>
      <input
        id={`slot-${initial ?? 'new'}`}
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 rounded-[4px] border border-white/20 bg-white/10 px-2 text-xs text-marble-50 [color-scheme:dark] focus:border-brass-500 focus:outline-none"
      />
      <button
        type="button"
        disabled={busy || !value}
        onClick={() => onSave(value)}
        className="inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-brass-500 px-3 text-xs font-medium text-pine-900 transition-colors hover:bg-brass-400 disabled:opacity-50"
      >
        <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
        Confirm slot
      </button>
      <span className="text-[10px] text-marble-50/50">
        The couple sees “Confirmed for …” on their reference.
      </span>
    </div>
  );
}

// ── "Show older" — widens one list's page size (server clamps to 50) ────────

function ShowOlder({
  shown,
  total,
  step,
  loading,
  onClick,
}: {
  shown: number;
  total: number;
  step: number;
  loading: boolean;
  onClick: () => void;
}) {
  if (shown >= total) return null;
  const remaining = total - shown;
  return (
    <div className="mt-2 flex items-center justify-between gap-3 px-1">
      <p className="text-[11px] text-marble-50/50" aria-live="polite">
        Showing <span className="tabular-nums">{shown}</span> of{' '}
        <span className="tabular-nums">{total}</span>
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] border border-white/20 px-3 text-[11px] font-medium text-marble-50/80 transition-colors hover:border-brass-500 hover:text-brass-400 disabled:opacity-50"
      >
        {loading ? 'Loading…' : `Show ${Math.min(remaining, step)} older`}
      </button>
    </div>
  );
}

// ── Digest filters (pill selects matching the status-select language) ───────

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
}) {
  return (
    <span className="relative inline-flex items-center gap-1.5">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 cursor-pointer appearance-none rounded-full border border-white/20 bg-white/5 pr-6 pl-2.5 text-[10px] font-medium uppercase tracking-wide text-marble-50/80 transition-colors [color-scheme:dark] hover:border-brass-500/60 focus:border-brass-500 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-pine-900 text-marble-50 normal-case">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2 h-3 w-3 text-marble-50/60"
      />
    </span>
  );
}

// ── Viewing message templates (copy-to-clipboard WhatsApp nudges) ───────────
// Text is composed ONLY from the row's own data (name, slot, reference) —
// nothing invented. The team pastes it into their existing WhatsApp chat.

function viewingTemplates(v: Digest['viewings'][number]): {
  key: string;
  label: string;
  text: string;
}[] {
  const first = v.firstName.trim();
  const slot = v.scheduledAt ? dtt(v.scheduledAt) : null;
  const ref = v.manageToken;
  const manageHint = `you can check the details any time on our website under “Book a viewing → Already requested a viewing?”`;
  const t: { key: string; label: string; text: string }[] = [];
  if (slot) {
    t.push({
      key: 'announce',
      label: 'Announce slot',
      text: `Hi ${first}! Your visit to The Lakeside is confirmed for ${slot}. Your reference is ${ref} — ${manageHint}, and you can add it to your calendar from there. See you soon! — The Lakeside`,
    });
    t.push({
      key: 'remind',
      label: 'Reminder',
      text: `Hi ${first}, a friendly reminder about your visit to The Lakeside on ${slot} (reference ${ref}). If anything has changed, just reply here. — The Lakeside`,
    });
    t.push({
      key: 'reschedule',
      label: 'Offer reschedule',
      text: `Hi ${first}, if the ${slot} visit no longer suits, just reply with a day and time that works and we'll move your booking (reference ${ref}). — The Lakeside`,
    });
  } else {
    t.push({
      key: 'ask-slot',
      label: 'Ask for a time',
      text: `Hi ${first}, thanks for requesting a viewing at The Lakeside! Your reference is ${ref}. Which day and time suit you for a walk-through? — The Lakeside`,
    });
  }
  if (v.status === 'done') {
    t.push({
      key: 'thanks',
      label: 'Thank-you after visit',
      text: `Hi ${first}, thank you for visiting The Lakeside. Whenever you're ready, we're here for dates, estimates or a second walk-around (reference ${ref}). — The Lakeside`,
    });
  }
  return t;
}

function ViewingMsg({ viewing }: { viewing: Digest['viewings'][number] }) {
  return (
    <TemplateMsg
      name={`${viewing.firstName} ${viewing.lastName}`.trim()}
      phone={viewing.phone}
      templates={viewingTemplates(viewing)}
    />
  );
}

// ── Shared template chip expander (Copy | Send pill pairs) ─────────────────

function TemplateMsg({
  name,
  phone,
  templates,
  emptyNote,
}: {
  name: string;
  phone: string | null;
  templates: { key: string; label: string; text: string }[];
  emptyNote?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const sendHref = waHref(phone); // one-tap chat link when the row has a number

  if (templates.length === 0) {
    return emptyNote ? (
      <p className="mt-1 text-[11px] text-marble-50/40">{emptyNote}</p>
    ) : null;
  }

  async function copy(key: string, text: string) {
    const ok = await copyText(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 2000);
    }
  }

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex min-h-[28px] items-center gap-1 text-[11px] font-medium text-brass-400/90 underline-offset-2 transition-colors hover:text-brass-400 hover:underline"
      >
        <MessageCircle className="h-3 w-3" aria-hidden="true" />
        {open ? 'Hide messages' : 'Message…'}
      </button>
      {open ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5 border-t border-white/10 pt-1.5">
          {templates.map((tpl) => {
            const sendWithText = waHref(phone, tpl.text);
            return (
              <span
                key={tpl.key}
                className="inline-flex items-stretch overflow-hidden rounded-full border border-white/20 transition-colors focus-within:border-brass-500 hover:border-brass-500/60"
              >
                <button
                  type="button"
                  onClick={() => void copy(tpl.key, tpl.text)}
                  aria-label={`Copy “${tpl.label}” WhatsApp message for ${name}`.trim()}
                  className={cn(
                    'inline-flex min-h-[32px] items-center gap-1 px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/70',
                    copiedKey === tpl.key
                      ? 'bg-pine-400/10 text-pine-400'
                      : 'text-marble-50/80 hover:bg-white/5 hover:text-brass-400',
                  )}
                >
                  {copiedKey === tpl.key ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  )}
                  {copiedKey === tpl.key ? 'Copied ✓' : tpl.label}
                </button>
                {sendWithText ? (
                  <>
                    <span aria-hidden className="my-1.5 w-px bg-white/15" />
                    <a
                      href={sendWithText}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open WhatsApp for ${name} with the “${tpl.label}” message prefilled`}
                      title="Open WhatsApp with this message prefilled"
                      className="inline-flex min-h-[32px] items-center gap-1 px-2.5 text-[11px] font-medium text-brass-400/90 transition-colors hover:bg-brass-500/10 hover:text-brass-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brass-400/70"
                    >
                      <Send className="h-3 w-3" aria-hidden="true" />
                      Send
                    </a>
                  </>
                ) : null}
              </span>
            );
          })}
          <span className="w-full text-[10px] text-marble-50/40">
            Copy to paste, or “Send” opens WhatsApp with the message prefilled
            {sendHref ? '' : ' — no number on this row, copy instead'}.
          </span>
        </div>
      ) : null}
    </div>
  );
}

// ── Enquiry follow-up templates (lead rows — same honesty rules) ────────────

function leadTemplates(l: Digest['leads'][number]): {
  key: string;
  label: string;
  text: string;
}[] {
  const first = (l.firstName ?? '').trim();
  if (!first) return []; // no name on the row — a template would read wrong
  const when = l.weddingDate ? dt(l.weddingDate) : null;
  const guests = l.guests ? `${l.guests} guests` : null;
  const dayPart = [when, guests].filter(Boolean).join(' · ');
  const t: { key: string; label: string; text: string }[] = [];

  if (l.status === 'new' || l.status === 'contacted') {
    t.push({
      key: 'thanks',
      label: 'Thanks + viewing invite',
      text: `Hi ${first}! Thank you for your enquiry about a wedding at The Lakeside${dayPart ? ` (${dayPart})` : ''}. We'd love to walk you through the chapel and the reception — which day suits you for a viewing? — The Lakeside`,
    });
  }
  if (when) {
    t.push({
      key: 'date-check',
      label: 'Ask about their date',
      text: `Hi ${first}! About ${when} at The Lakeside${guests ? ` for ${guests}` : ''} — we can confirm in person what's still open for that day. Would you like to come and see the estate? — The Lakeside`,
    });
  }
  if (l.status === 'viewed') {
    t.push({
      key: 'after-visit',
      label: 'After the visit',
      text: `Hi ${first}, thank you for visiting The Lakeside. Whenever you're ready, we're here for dates, estimates or a second walk-around. — The Lakeside`,
    });
  }
  if (l.status === 'proposal_sent') {
    t.push({
      key: 'proposal-follow-up',
      label: 'Proposal follow-up',
      text: `Hi ${first}, just checking in — did the proposal for your day at The Lakeside land well? Happy to walk through any of the numbers whenever suits you. — The Lakeside`,
    });
  }
  if (l.status === 'booked') {
    t.push({
      key: 'congrats',
      label: 'Congratulations',
      text: `Hi ${first}! Congratulations again on choosing The Lakeside${when ? ` for ${when}` : ''}. Reply here any time — we're with you all the way to the day. — The Lakeside`,
    });
  }
  return t;
}

function LeadMsg({ lead }: { lead: Digest['leads'][number] }) {
  return (
    <TemplateMsg
      name={[lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'this enquiry'}
      phone={lead.phone}
      templates={leadTemplates(lead)}
    />
  );
}

const DAY_STATES = ['available', 'limited', 'held', 'booked'] as const;
type DayState = (typeof DAY_STATES)[number];

const DAY_STATE_CHIP: Record<string, string> = {
  available: 'bg-pine-600/40 text-marble-50',
  limited: 'bg-brass-500/20 text-brass-400',
  held: 'bg-sand-300/20 text-sand-300',
  booked: 'bg-ember-500/20 text-ember-500',
};

function prettyDay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

function AvailabilityBoard({
  token,
  rows,
  onChanged,
}: {
  token: string;
  rows: Digest['availability'];
  onChanged: () => void;
}) {
  const [day, setDay] = React.useState('');
  const [state, setState] = React.useState<DayState>('available');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function submit(action: 'set' | 'remove', dayOverride?: string) {
    const target = dayOverride ?? day;
    if (action === 'set' && !target) {
      setMsg({ kind: 'error', text: 'Pick a day first.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/availability?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'remove'
            ? { action, day: target }
            : { action, day: target, state, note: note.trim() || undefined },
        ),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMsg({ kind: 'error', text: json?.error ?? 'Could not save the day.' });
      } else {
        setMsg({
          kind: 'ok',
          text:
            action === 'remove'
              ? `${prettyDay(target)} is back to “Ask us”.`
              : `${prettyDay(target)} → ${state}${note.trim() ? ' · note saved' : ''}. Live on the date checker.`,
        });
        if (action === 'set') {
          setNote('');
        }
        // Parent re-pulls the digest; the public date checker re-fetches on
        // this event (same tab and cross-tab via the panel's own reload).
        onChanged();
        window.dispatchEvent(new CustomEvent('lakeside:availability-changed'));
      }
    } catch {
      setMsg({ kind: 'error', text: 'Network error — try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <h3 className="font-display text-lg">Availability board</h3>
      <p className="mt-1 text-xs text-marble-50/60">
        What you set here is what couples see on “Check your date” — nothing is
        guessed. Remove a day to put it back to “Ask us”.
      </p>

      <div className="mt-3 grid gap-6 lg:grid-cols-2">
        {/* Set / remove a day */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit('set');
          }}
          className="rounded-[4px] border border-white/10 bg-white/5 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="avail-day" className="text-xs font-medium text-marble-50/80">
                Day
              </label>
              <input
                id="avail-day"
                type="date"
                required
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  if (msg) setMsg(null);
                }}
                className="mt-1 h-11 w-full rounded-[4px] border border-white/20 bg-white/10 px-3 text-sm text-marble-50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label htmlFor="avail-note" className="text-xs font-medium text-marble-50/80">
                Note (optional, shows on tap)
              </label>
              <input
                id="avail-note"
                type="text"
                maxLength={140}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. held for the du Toit viewing"
                className="mt-1 h-11 w-full rounded-[4px] border border-white/20 bg-white/10 px-3 text-sm text-marble-50 placeholder:text-marble-50/40"
              />
            </div>
          </div>

          <fieldset className="mt-3">
            <legend className="text-xs font-medium text-marble-50/80">State</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DAY_STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setState(s)}
                  aria-pressed={state === s}
                  className={cn(
                    'min-h-[36px] rounded-[4px] border px-3 text-xs font-medium capitalize transition-colors',
                    state === s
                      ? 'border-brass-500 bg-brass-500/20 text-brass-400'
                      : 'border-white/20 text-marble-50/70 hover:border-brass-500/50 hover:bg-white/5',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-[44px] items-center rounded-[4px] bg-brass-500 px-5 text-sm font-medium text-pine-900 transition-colors hover:bg-brass-400 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save day'}
            </button>
            <button
              type="button"
              disabled={busy || !day}
              onClick={() => void submit('remove')}
              className="inline-flex min-h-[44px] items-center rounded-[4px] border border-white/20 px-4 text-sm font-medium text-marble-50/80 transition-colors hover:border-ember-500 hover:text-ember-500 disabled:opacity-40"
            >
              Remove day
            </button>
            {msg ? (
              <p
                role="status"
                aria-live="polite"
                className={cn('text-xs', msg.kind === 'ok' ? 'text-brass-400' : 'text-ember-500')}
              >
                {msg.text}
              </p>
            ) : null}
          </div>
        </form>

        {/* Current rows */}
        <div>
          <p className="text-xs font-medium text-marble-50/80">
            Days couples can see ({rows.length})
          </p>
          <ul className="max-h-scroll mt-2 divide-y divide-white/10 rounded-[4px] border border-white/10">
            {rows.length === 0 ? (
              <li className="px-4 py-4 text-sm text-marble-50/60">
                No days set yet — the public calendar shows “Ask us” everywhere.
              </li>
            ) : (
              rows.map((a) => (
                <li key={a.day} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-marble-50">
                      {prettyDay(a.day)}
                      <span
                        className={cn(
                          'ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide',
                          DAY_STATE_CHIP[a.state] ?? 'bg-white/10 text-marble-50/70',
                        )}
                      >
                        {a.state}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-marble-50/60">
                      {a.note ? `${a.note} · ` : ''}updated {dt(a.updatedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submit('remove', a.day)}
                    aria-label={`Remove ${prettyDay(a.day)} from the availability board`}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-[4px] text-marble-50/60 transition-colors hover:bg-ember-500/10 hover:text-ember-500 disabled:opacity-40"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Remove</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function TeamDigest() {
  const [visible, setVisible] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [digest, setDigest] = React.useState<Digest | null>(null);
  const [state, setState] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rowMsg, setRowMsg] = React.useState<{ id: string; kind: 'ok' | 'error'; text: string } | null>(null);
  const [openNote, setOpenNote] = React.useState<string | null>(null);
  const [openMsg, setOpenMsg] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);
  // Enquiry filters (client-side over the rows already loaded — honest by
  // design: the match line always says what's filtered from what).
  const [sourceFilter, setSourceFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  // Per-list page sizes for the "Show older" buttons (server clamps to 50).
  const [takes, setTakes] = React.useState({ leads: 8, viewings: 6, quotes: 6 });
  const takesRef = React.useRef(takes);
  const rootRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const sync = () => setVisible(window.location.hash === '#team-digest');
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // The panel mounts after the browser's native hash-scroll has already given
  // up (the section renders nothing until visible) — scroll to it ourselves.
  React.useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  const load = React.useCallback(
    (value: string, overrideTakes?: typeof takes) => {
      const t = overrideTakes ?? takesRef.current;
      setState('loading');
      fetch(
        `/api/admin/digest?token=${encodeURIComponent(value)}` +
          `&leadTake=${t.leads}&viewingTake=${t.viewings}&quoteTake=${t.quotes}`,
      )
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status));
          return (await res.json()) as Digest;
        })
        .then((data) => {
          setDigest(data);
          setState('idle');
          setLoadingMore(false);
        })
        .catch(() => setState('error'));
    },
    [],
  );

  /** "Show older": widen one list's page size and refetch the digest. */
  function showMore(list: 'leads' | 'viewings' | 'quotes') {
    const step = list === 'leads' ? 8 : 6;
    const next = { ...takesRef.current, [list]: Math.min(50, takesRef.current[list] + step) };
    takesRef.current = next;
    setTakes(next);
    setLoadingMore(true);
    load(token, next);
  }

  // Auto-load when the panel opens with a remembered token (sessionStorage).
  React.useEffect(() => {
    if (!visible) return;
    try {
      const saved = window.sessionStorage.getItem('lakeside-digest-token');
      if (saved && !digest) {
        setToken(saved);
        load(saved);
      }
    } catch {
      /* storage unavailable — manual entry still works */
    }
  }, [visible, digest, load]);

  // ── Enquiry filters (derived, over the rows already loaded) ────────────────
  const sourceOptions = React.useMemo(() => {
    const set = new Set<string>();
    digest?.leads.forEach((l) => set.add(l.source ?? 'unknown'));
    return [
      { value: 'all', label: 'All sources' },
      ...Array.from(set).sort().map((s) => ({
        value: s,
        label: s === 'unknown' ? 'unknown source' : s,
      })),
    ];
  }, [digest?.leads]);

  const filteredLeads = React.useMemo(() => {
    if (!digest) return [];
    return digest.leads.filter((l) => {
      const srcOk = sourceFilter === 'all' || (l.source ?? 'unknown') === sourceFilter;
      const stOk = statusFilter === 'all' || l.status === statusFilter;
      return srcOk && stOk;
    });
  }, [digest, sourceFilter, statusFilter]);

  const filtersActive = sourceFilter !== 'all' || statusFilter !== 'all';

  if (!visible) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      window.sessionStorage.setItem('lakeside-digest-token', token);
    } catch { /* non-essential */ }
    load(token);
  }

  /** POST /api/admin/pipeline and refresh the digest. */
  async function pipeline(
    id: string,
    body:
      | { kind: 'lead'; id: string; status: string; note?: string }
      | { kind: 'viewing'; id: string; status: string; scheduledAt?: string },
    okText: string,
  ) {
    setBusyId(id);
    setRowMsg(null);
    try {
      const res = await fetch(`/api/admin/pipeline?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setRowMsg({ id, kind: 'error', text: json?.error ?? 'Could not save the update.' });
      } else {
        setRowMsg({ id, kind: 'ok', text: okText });
        load(token);
      }
    } catch {
      setRowMsg({ id, kind: 'error', text: 'Network error — try again.' });
    } finally {
      setBusyId(null);
    }
  }

  /** Copy the couple-facing estimate link (?q=SHORTID). */
  async function copyQuoteLink(shortId: string) {
    const ok = await copyText(`${window.location.origin}/?q=${shortId}`);
    if (ok) {
      setCopiedId(shortId);
      setTimeout(() => setCopiedId((c) => (c === shortId ? null : c)), 2000);
    }
  }

  /** Client-side CSV of the enquiries currently visible (filters honoured). */
  function downloadLeadsCsv() {
    if (!digest) return;
    const esc = (v: string | number | null | undefined) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = ['name', 'email', 'phone', 'source', 'status', 'score', 'wedding_date', 'guests', 'note', 'event_type', 'message', 'quote_id', 'received'];
    const lines = filteredLeads.map((l) =>
      [
        [l.firstName, l.lastName].filter(Boolean).join(' '),
        l.email,
        l.phone,
        l.source,
        l.status,
        l.score,
        l.weddingDate,
        l.guests,
        l.notes,
        l.eventType,
        l.message,
        l.quoteId,
        l.createdAt,
      ].map(esc).join(','),
    );
    const csv = `\uFEFF${head.join(',')}\n${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lakeside-enquiries-${new Date().toISOString().slice(0, 10)}${filtersActive ? '-filtered' : ''}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Server-side CSV of ALL rows (GET /api/admin/digest?format=csv&type=…). */
  function exportAllCsv(type: 'leads' | 'viewings' | 'quotes') {
    window.location.assign(
      `/api/admin/digest?token=${encodeURIComponent(token)}&format=csv&type=${type}`,
    );
  }

  const stat = (label: string, value: string | number, hint?: string) => (
    <div className="rounded-[4px] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-marble-50/60">{label}</p>
      <p className="mt-0.5 font-display text-2xl tabular-nums text-marble-50">{value}</p>
      {hint ? <p className="text-[11px] text-brass-400">{hint}</p> : null}
    </div>
  );

  return (
    <section
      id="team-digest"
      ref={rootRef}
      aria-label="Team digest — internal"
      className="border-y-2 border-brass-500/40 bg-pine-900 text-marble-50"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="eyebrow text-brass-400">Internal · do not share</p>
        <h2 className="mt-1 font-display text-2xl md:text-3xl">Team digest</h2>
        <p className="mt-2 max-w-prose text-sm text-marble-50/70">
          Real rows from the website — enquiries, viewing requests, saved
          estimates and the availability couples see. Filter the pipeline, edit
          lead statuses and viewing slots, copy ready-to-paste WhatsApp nudges,
          export CSVs, and set the availability board couples read.
        </p>

        {!digest ? (
          <form onSubmit={submit} className="mt-6 max-w-md">
            <label htmlFor="digest-token" className="text-xs font-medium text-marble-50/80">
              Team token
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="digest-token"
                type="password"
                autoComplete="off"
                required
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (state === 'error') setState('idle');
                }}
                className="h-11 flex-1 rounded-[4px] border border-white/20 bg-white/10 px-3 text-marble-50 placeholder:text-marble-50/40"
                placeholder="Ask the developer for the token"
              />
              <button
                type="submit"
                disabled={state === 'loading'}
                className="h-11 shrink-0 rounded-[4px] bg-brass-500 px-5 text-sm font-medium text-pine-900 transition-colors hover:bg-brass-400 disabled:opacity-60"
              >
                {state === 'loading' ? 'Loading…' : 'Open digest'}
              </button>
            </div>
            {state === 'error' ? (
              <p role="alert" className="mt-2 text-xs text-ember-500">
                Token not accepted. Check it and try again.
              </p>
            ) : null}
          </form>
        ) : (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-marble-50/60">
                Generated {new Date(digest.generatedAt).toLocaleString('en-ZA')}
              </p>
              <button
                type="button"
                onClick={() => load(token)}
                className="inline-flex min-h-[44px] items-center rounded-[4px] border border-white/20 px-4 text-xs font-medium text-marble-50 transition-colors hover:border-brass-500 hover:bg-white/5"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {stat('Enquiries', digest.counts.leads)}
              {stat('Viewings', digest.counts.viewings, Object.entries(digest.counts.viewingsByStatus).map(([k, v]) => `${k} ${v}`).join(' · '))}
              {stat('Estimates', digest.counts.quotes)}
              {stat('Tasting waitlist', digest.counts.tastingWaitlist)}
              {stat('Viewing refs', digest.viewings.length, 'latest shown')}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {/* Latest enquiries — status + note editable, filterable */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg">Latest enquiries</h3>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => exportAllCsv('leads')}
                      aria-label="Download every enquiry as a CSV file"
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] border border-white/20 px-2.5 text-[11px] font-medium text-marble-50/80 transition-colors hover:border-brass-500 hover:text-brass-400"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      All (CSV)
                    </button>
                    <button
                      type="button"
                      onClick={downloadLeadsCsv}
                      disabled={filteredLeads.length === 0}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] border border-white/20 px-2.5 text-[11px] font-medium text-marble-50/80 transition-colors hover:border-brass-500 hover:text-brass-400 disabled:opacity-40"
                      aria-label={filtersActive
                        ? 'Download the filtered enquiries shown as a CSV file'
                        : 'Download the enquiries shown as a CSV file'}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      CSV
                    </button>
                  </span>
                </div>
                {/* Filters — over the rows loaded below ("Show older" widens the pool) */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <FilterSelect
                    label="Filter enquiries by source"
                    value={sourceFilter}
                    options={sourceOptions}
                    onChange={setSourceFilter}
                  />
                  <FilterSelect
                    label="Filter enquiries by status"
                    value={statusFilter}
                    options={[
                      { value: 'all', label: 'All statuses' },
                      ...LEAD_STATUSES.map((s) => ({
                        value: s,
                        label: LEAD_STATUS_LABEL[s] ?? s,
                      })),
                    ]}
                    onChange={setStatusFilter}
                  />
                  {filtersActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSourceFilter('all');
                        setStatusFilter('all');
                      }}
                      className="inline-flex min-h-[28px] items-center text-[11px] font-medium text-brass-400/90 underline-offset-2 transition-colors hover:text-brass-400 hover:underline"
                    >
                      Clear
                    </button>
                  ) : null}
                  {filtersActive ? (
                    <p className="text-[11px] text-marble-50/50" aria-live="polite">
                      <span className="tabular-nums">{filteredLeads.length}</span> of{' '}
                      <span className="tabular-nums">{digest.leads.length}</span> shown match
                    </p>
                  ) : null}
                </div>
                <ul className="max-h-scroll mt-3 divide-y divide-white/10 rounded-[4px] border border-white/10">
                  {filteredLeads.length === 0 ? (
                    <li className="px-4 py-4 text-sm text-marble-50/60">
                      {filtersActive
                        ? 'No enquiries match these filters — clear them to see the rest.'
                        : 'No enquiries yet.'}
                    </li>
                  ) : (
                    filteredLeads.map((l) => {
                    const name = [l.firstName, l.lastName].filter(Boolean).join(' ') || '—';
                    return (
                      <li key={l.id} className="px-4 py-3 text-sm transition-colors hover:bg-white/[0.03]">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate font-medium">{name}</p>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <WaLink phone={l.phone} name={name} />
                            <StatusSelect
                              value={l.status}
                              options={LEAD_STATUSES}
                              labels={LEAD_STATUS_LABEL}
                              disabled={busyId === l.id}
                              ariaLabel={`Status for ${name}`}
                              onCommit={(next) =>
                                void pipeline(l.id, { kind: 'lead', id: l.id, status: next }, `${name} → ${LEAD_STATUS_LABEL[next] ?? next}.`)
                              }
                            />
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-marble-50/60">
                          {[l.email, l.phone].filter(Boolean).join(' · ') || 'no contact'}
                          {' · '}
                          {dt(l.createdAt)}
                        </p>
                        <div className="mt-0.5 flex items-start justify-between gap-2">
                          <p className="text-xs text-marble-50/50">
                            {l.source ?? 'unknown source'}
                            {l.eventType && l.eventType !== 'wedding' ? ` · ${l.eventType}` : ''}
                            {l.weddingDate ? ` · date ${l.weddingDate}` : ''}
                            {l.guests ? ` · ${l.guests} guests` : ''}
                            {' · '}
                            <span className="tabular-nums">{`score ${l.score}`}</span>
                          </p>
                          <span className="flex shrink-0 items-center gap-3">
                            {l.message ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMsg(openMsg === l.id ? null : l.id);
                                  setOpenNote(null);
                                }}
                                aria-expanded={openMsg === l.id}
                                className="inline-flex min-h-[24px] items-center gap-1 text-[11px] font-medium text-brass-400/90 underline-offset-2 transition-colors hover:text-brass-400 hover:underline"
                              >
                                <MessageCircle className="h-3 w-3" aria-hidden="true" />
                                {openMsg === l.id ? 'Hide message' : 'Message'}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenNote(openNote === l.id ? null : l.id);
                                setOpenMsg(null);
                              }}
                              aria-expanded={openNote === l.id}
                              className="shrink-0 text-[11px] font-medium text-brass-400/90 underline-offset-2 transition-colors hover:text-brass-400 hover:underline"
                            >
                              {openNote === l.id ? 'Hide note' : l.notes ? 'Note ✓' : 'Add note'}
                            </button>
                          </span>
                        </div>
                        {openMsg === l.id && l.message ? (
                          <div className="mt-2 rounded-r-[4px] border-l-2 border-brass-500/70 bg-white/[0.04] px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-brass-400/90">
                              What they wrote
                            </p>
                            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-marble-50/85">
                              {l.message}
                            </p>
                          </div>
                        ) : null}
                        {openNote === l.id ? (
                          <LeadNoteEditor
                            initial={l.notes ?? ''}
                            busy={busyId === l.id}
                            onSave={(note) =>
                              void pipeline(l.id, { kind: 'lead', id: l.id, status: l.status, note }, 'Note saved.')
                            }
                          />
                        ) : null}
                        <LeadMsg lead={l} />
                        {rowMsg?.id === l.id ? (
                          <p
                            role="status"
                            aria-live="polite"
                            className={cn('mt-1.5 text-xs', rowMsg.kind === 'ok' ? 'text-brass-400' : 'text-ember-500')}
                          >
                            {rowMsg.text}
                          </p>
                        ) : null}
                      </li>
                    );
                    })
                  )}
                </ul>
                <ShowOlder
                  shown={digest.leads.length}
                  total={digest.counts.leads}
                  step={8}
                  loading={loadingMore}
                  onClick={() => showMore('leads')}
                />
              </div>

              {/* Viewing requests — status + confirmed slot editable, message nudges */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg">Viewing requests</h3>
                  <button
                    type="button"
                    onClick={() => exportAllCsv('viewings')}
                    aria-label="Download every viewing request as a CSV file"
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] border border-white/20 px-2.5 text-[11px] font-medium text-marble-50/80 transition-colors hover:border-brass-500 hover:text-brass-400"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    All (CSV)
                  </button>
                </div>
                <ul className="max-h-scroll mt-3 divide-y divide-white/10 rounded-[4px] border border-white/10">
                  {digest.viewings.map((v) => {
                    const name = `${v.firstName} ${v.lastName}`.trim();
                    return (
                      <li key={v.id} className="px-4 py-3 text-sm transition-colors hover:bg-white/[0.03]">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate font-medium">{name}</p>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <WaLink phone={v.phone} name={name} />
                            <StatusSelect
                              value={v.status}
                              options={VIEWING_STATUSES}
                              disabled={busyId === v.id}
                              ariaLabel={`Status for ${name}'s viewing`}
                              onCommit={(next) =>
                                void pipeline(v.id, { kind: 'viewing', id: v.id, status: next }, `${name}'s viewing → ${next}.`)
                              }
                            />
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-marble-50/60">
                          {v.mode === 'virtual' ? 'Virtual' : 'In person'}
                          {v.preferredWhen ? ` · prefers ${v.preferredWhen}` : ''}
                          {v.weddingDate ? ` · date ${v.weddingDate}` : ''}
                          {v.guests ? ` · ${v.guests} guests` : ''}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                          <p className="text-xs text-marble-50/50">
                            {[v.email, v.phone].filter(Boolean).join(' · ')}
                          </p>
                          <p className="font-mono text-[11px] text-brass-400">{v.manageToken}</p>
                        </div>
                        {v.scheduledAt ? (
                          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-pine-600/30 px-2 py-0.5 text-[11px] text-marble-50">
                            <CalendarCheck2 className="h-3.5 w-3.5 text-brass-400" aria-hidden="true" />
                            Confirmed for {dtt(v.scheduledAt)}
                          </p>
                        ) : null}
                        <ViewingMsg viewing={v} />
                        {v.status === 'scheduled' ? (
                          <SlotPicker
                            initial={v.scheduledAt}
                            busy={busyId === v.id}
                            onSave={(local) =>
                              void pipeline(
                                v.id,
                                { kind: 'viewing', id: v.id, status: 'scheduled', scheduledAt: new Date(local).toISOString() },
                                v.scheduledAt ? 'Slot updated — the couple sees the new time.' : 'Slot confirmed — the couple sees it on their reference.',
                              )
                            }
                          />
                        ) : null}
                        {rowMsg?.id === v.id ? (
                          <p
                            role="status"
                            aria-live="polite"
                            className={cn('mt-1.5 text-xs', rowMsg.kind === 'ok' ? 'text-brass-400' : 'text-ember-500')}
                          >
                            {rowMsg.text}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <ShowOlder
                  shown={digest.viewings.length}
                  total={digest.counts.viewings}
                  step={6}
                  loading={loadingMore}
                  onClick={() => showMore('viewings')}
                />
              </div>
            </div>

            {/* Saved estimates — one-click couple-facing link */}
            <div className="mt-8">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg">Saved estimates</h3>
                <button
                  type="button"
                  onClick={() => exportAllCsv('quotes')}
                  aria-label="Download every saved estimate as a CSV file"
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] border border-white/20 px-2.5 text-[11px] font-medium text-marble-50/80 transition-colors hover:border-brass-500 hover:text-brass-400"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  All (CSV)
                </button>
              </div>
              <ul className="max-h-scroll mt-3 divide-y divide-white/10 rounded-[4px] border border-white/10">
                {digest.quotes.map((q) => (
                  <li key={q.shortId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm transition-colors hover:bg-white/[0.03]">
                    <p className="font-mono text-xs text-brass-400">{q.shortId}</p>
                    <p className="text-xs text-marble-50/70">
                      {q.date ?? '—'}
                      {q.adults ? ` · ${q.adults} adults` : ''}
                      {q.packageName ? ` · ${q.packageName}` : ''}
                    </p>
                    <p className="font-display text-base tabular-nums">
                      {typeof q.total === 'number' ? formatZAR(q.total) : '—'}
                    </p>
                    <span className="flex items-center gap-2">
                      <p className="text-xs text-marble-50/50">{dt(q.createdAt)}</p>
                      <button
                        type="button"
                        onClick={() => void copyQuoteLink(q.shortId)}
                        aria-label={`Copy the link to estimate ${q.shortId}`}
                        className="inline-flex size-9 items-center justify-center rounded-[4px] text-marble-50/60 transition-colors hover:bg-brass-500/10 hover:text-brass-400"
                      >
                        {copiedId === q.shortId ? (
                          <Check className="h-4 w-4 text-pine-400" aria-hidden="true" />
                        ) : (
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                      {copiedId === q.shortId ? (
                        <span role="status" className="text-[11px] text-pine-400">
                          Link copied
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <ShowOlder
                shown={digest.quotes.length}
                total={digest.counts.quotes}
                step={6}
                loading={loadingMore}
                onClick={() => showMore('quotes')}
              />
            </div>

            {/* Availability board — edits feed the public date checker */}
            <AvailabilityBoard
              token={token}
              rows={digest.availability}
              onChanged={() => load(token)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
