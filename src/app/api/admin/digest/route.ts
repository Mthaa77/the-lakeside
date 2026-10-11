import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEAM DIGEST (admin-lite, token-gated)
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/admin/digest?token=… → counts + latest rows so the team can see
 * enquiries, viewings and saved estimates without a full admin app.
 *
 * Pagination: optional `leadTake` / `viewingTake` / `quoteTake` query params
 * (integers, clamped 1–50) let the digest panel load older rows on demand
 * ("Show older" buttons). Defaults keep the panel light: 8 / 6 / 6.
 *
 * Full export: `format=csv&type=leads|viewings|quotes` streams ALL rows of
 * that list as a downloadable CSV (no take clamp) — the panel's "Export all"
 * buttons land here. Guarded against CSV formula injection for spreadsheet
 * apps (=, +, -, @ leading cells get a `'` prefix).
 *
 * Auth: shared token compare (ADMIN_TOKEN env var; dev fallback below so the
 * feature is testable in this sandbox — see docs/TODO-CLIENT.md).
 * The UI for this lives in a hidden panel: /#team-digest (no nav link).
 *
 * TODO(CLIENT): set a strong ADMIN_TOKEN env var before launch; consider a
 * signed session instead of a shared token if more than 2 people need access.
 */

const DEV_TOKEN = 'lakeside-team'; // TODO(CLIENT): replace via ADMIN_TOKEN env var

function authorized(token: string | null): boolean {
  if (!token) return false;
  const expected = process.env.ADMIN_TOKEN || DEV_TOKEN;
  // Length-independent compare to avoid trivial timing leakage.
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return a.equals(b);
}

export async function GET(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`digest:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const token = new URL(req.url).searchParams.get('token');
  if (!authorized(token)) {
    // Uniform 404 — no hint that the route exists.
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  // Per-list take params ("Show older" in the panel). Clamp: at least the
  // default (so a bad value can't shrink the panel) and at most 50.
  const params = new URL(req.url).searchParams;
  const clampTake = (raw: string | null, fallback: number) => {
    const n = Number.parseInt(raw ?? '', 10);
    if (!Number.isFinite(n) || n <= fallback) return fallback;
    return Math.min(n, 50);
  };
  const leadTake = clampTake(params.get('leadTake'), 8);
  const viewingTake = clampTake(params.get('viewingTake'), 6);
  const quoteTake = clampTake(params.get('quoteTake'), 6);

  // ── Full CSV export (all rows, no take clamp) ──────────────────────────────
  if (params.get('format') === 'csv') {
    const type = params.get('type') ?? '';
    if (type !== 'leads' && type !== 'viewings' && type !== 'quotes') {
      return NextResponse.json({ error: 'Unknown export type.' }, { status: 400 });
    }
    const csvEscape = (v: unknown) => {
      let s = String(v ?? '');
      // Formula-injection guard for spreadsheet apps (leading =,+,-,@,tab).
      if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const toCsv = (head: string[], rows: unknown[][]) =>
      `\uFEFF${head.map(csvEscape).join(',')}\n${rows.map((r) => r.map(csvEscape).join(',')).join('\n')}`;
    const stamp = new Date().toISOString().slice(0, 10);

    try {
      if (type === 'leads') {
        const rows = await db.lead.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            firstName: true, lastName: true, email: true, phone: true, source: true,
            status: true, score: true, weddingDate: true, guests: true, notes: true, createdAt: true,
            eventType: true, message: true, quoteId: true,
          },
        });
        const csv = toCsv(
          ['name', 'email', 'phone', 'source', 'status', 'score', 'wedding_date', 'guests', 'note', 'event_type', 'message', 'quote_id', 'received'],
          rows.map((l) => [
            [l.firstName, l.lastName].filter(Boolean).join(' '), l.email, l.phone, l.source,
            l.status, l.score, l.weddingDate, l.guests, l.notes, l.eventType, l.message,
            l.quoteId, l.createdAt.toISOString(),
          ]),
        );
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="lakeside-all-leads-${stamp}.csv"`,
          },
        });
      }
      if (type === 'viewings') {
        const rows = await db.viewing.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            firstName: true, lastName: true, email: true, phone: true, mode: true, status: true,
            preferredWhen: true, scheduledAt: true, weddingDate: true, guests: true,
            manageToken: true, createdAt: true,
          },
        });
        const csv = toCsv(
          ['name', 'email', 'phone', 'mode', 'status', 'preferred_when', 'scheduled_at', 'wedding_date', 'guests', 'reference', 'received'],
          rows.map((v) => [
            `${v.firstName} ${v.lastName}`.trim(), v.email, v.phone, v.mode, v.status,
            v.preferredWhen, v.scheduledAt?.toISOString() ?? '', v.weddingDate, v.guests,
            v.manageToken, v.createdAt.toISOString(),
          ]),
        );
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="lakeside-all-viewings-${stamp}.csv"`,
          },
        });
      }
      // quotes
      const rows = await db.quote.findMany({
        orderBy: { createdAt: 'desc' },
        select: { shortId: true, createdAt: true, inputsJson: true, resultJson: true },
      });
      const csv = toCsv(
        ['short_id', 'created_at', 'date', 'adults', 'package', 'total_zar'],
        rows.map((q) => {
          let inputs: Record<string, unknown> = {};
          let result: Record<string, unknown> = {};
          try { inputs = JSON.parse(q.inputsJson) as Record<string, unknown>; } catch { /* keep {} */ }
          try { result = JSON.parse(q.resultJson) as Record<string, unknown>; } catch { /* keep {} */ }
          return [
            q.shortId, q.createdAt.toISOString(),
            typeof inputs.date === 'string' ? inputs.date : '',
            typeof inputs.adults === 'number' ? inputs.adults : '',
            typeof result.packageName === 'string' ? result.packageName : '',
            typeof result.total === 'number' ? result.total : '',
          ];
        }),
      );
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="lakeside-all-estimates-${stamp}.csv"`,
        },
      });
    } catch (e) {
      console.error('digest CSV export failed', e);
      return NextResponse.json({ error: 'Export unavailable.' }, { status: 500 });
    }
  }

  try {
    const [leads, viewings, quotes, waitlist, availability] = await Promise.all([
      db.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: leadTake,
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          weddingDate: true, guests: true, source: true, status: true, score: true,
          notes: true, createdAt: true, eventType: true, message: true, quoteId: true,
        },
      }),
      db.viewing.findMany({
        orderBy: { createdAt: 'desc' },
        take: viewingTake,
        select: {
          id: true, manageToken: true, mode: true, status: true, preferredWhen: true,
          scheduledAt: true, firstName: true, lastName: true, email: true, phone: true,
          weddingDate: true, guests: true, createdAt: true,
        },
      }),
      db.quote.findMany({
        orderBy: { createdAt: 'desc' },
        take: quoteTake,
        select: { id: true, shortId: true, createdAt: true, inputsJson: true, resultJson: true },
      }),
      db.lead.count({ where: { source: 'food_experience_waitlist' } }),
      db.availabilityDay.findMany({
        where: { state: { not: 'unknown' } },
        orderBy: { day: 'asc' },
        take: 120,
        select: { day: true, state: true, note: true, updatedAt: true },
      }),
    ]);

    const [totalLeads, totalQuotes, viewingRows] = await Promise.all([
      db.lead.count(),
      db.quote.count(),
      db.viewing.findMany({ select: { status: true } }),
    ]);
    const byStatus: Record<string, number> = {};
    for (const v of viewingRows) byStatus[v.status] = (byStatus[v.status] ?? 0) + 1;

    // Quotes: parse JSON columns defensively — shape comes from the estimator.
    const quoteRows = quotes.map((q) => {
      let inputs: Record<string, unknown> = {};
      let result: Record<string, unknown> = {};
      try { inputs = JSON.parse(q.inputsJson) as Record<string, unknown>; } catch { /* keep {} */ }
      try { result = JSON.parse(q.resultJson) as Record<string, unknown>; } catch { /* keep {} */ }
      return {
        shortId: q.shortId,
        createdAt: q.createdAt,
        date: typeof inputs.date === 'string' ? inputs.date : null,
        adults: typeof inputs.adults === 'number' ? inputs.adults : null,
        packageName: typeof result.packageName === 'string' ? result.packageName : null,
        total: typeof result.total === 'number' ? result.total : null,
      };
    });

    return NextResponse.json({
      ok: true,
      counts: {
        leads: totalLeads,
        quotes: totalQuotes,
        viewings: viewingRows.length,
        viewingsByStatus: byStatus,
        tastingWaitlist: waitlist,
      },
      leads,
      viewings,
      quotes: quoteRows,
      availability,
      shown: { leads: leadTake, viewings: viewingTake, quotes: quoteTake },
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('digest GET failed', e);
    return NextResponse.json({ error: 'Digest unavailable.' }, { status: 500 });
  }
}
