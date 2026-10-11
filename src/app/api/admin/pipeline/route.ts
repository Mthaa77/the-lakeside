import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PIPELINE ADMIN (token-gated) — move leads & viewings through the pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/admin/pipeline?token=…
 *   Body: { kind: 'lead',    id, status, note? }            → update a Lead
 *         { kind: 'viewing', id, status, scheduledAt? }     → update a Viewing
 *
 * Why this exists: the team digest could only LOOK at rows. Setting a viewing
 * to `scheduled` with a real slot is what makes the couple's own manage link
 * (/#visit → check my viewing) show "Confirmed for <date/time>" — the loop is
 * closed by the venue team, not invented by the site.
 *
 * Status vocabularies mirror prisma/schema.prisma comments:
 *   Lead:    new | contacted | viewing_booked | viewed | proposal_sent | booked | lost | spam
 *   Viewing: requested | scheduled | cancelled | done
 *
 * Auth: same shared-token compare as the digest/availability routes (uniform
 * 404 on a bad token).
 *
 * TODO(CLIENT): strong ADMIN_TOKEN before launch — this route can change what
 * couples see on their viewing confirmations.
 */

const DEV_TOKEN = 'lakeside-team'; // TODO(CLIENT): replace via ADMIN_TOKEN env var

const LEAD_STATUSES = [
  'new', 'contacted', 'viewing_booked', 'viewed', 'proposal_sent', 'booked', 'lost', 'spam',
] as const;
const VIEWING_STATUSES = ['requested', 'scheduled', 'cancelled', 'done'] as const;

const schema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('lead'),
    id: z.string().trim().min(10).max(64),
    status: z.enum(LEAD_STATUSES),
    note: z.string().trim().max(280).optional(),
  }),
  z.object({
    kind: z.literal('viewing'),
    id: z.string().trim().min(10).max(64),
    status: z.enum(VIEWING_STATUSES),
    // Optional confirmed slot (ISO datetime). Accepted alongside any status so
    // the team can correct a slot without two round-trips.
    scheduledAt: z.string().datetime({ offset: true }).optional(),
  }),
]);

function authorized(token: string | null): boolean {
  if (!token) return false;
  const expected = process.env.ADMIN_TOKEN || DEV_TOKEN;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return a.equals(b);
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`pipeline-admin:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const token = new URL(req.url).searchParams.get('token');
  if (!authorized(token)) {
    // Uniform 404 — no hint that the route exists.
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid pipeline update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    if (d.kind === 'lead') {
      const data: { status: string; notes?: string | null } = { status: d.status };
      if (d.note !== undefined) data.notes = d.note === '' ? null : d.note;

      const row = await db.lead.update({
        where: { id: d.id },
        data,
        select: { id: true, status: true, notes: true, score: true },
      });
      return NextResponse.json({ ok: true, kind: 'lead', ...row });
    }

    // viewing
    const data: { status: string; scheduledAt?: Date } = { status: d.status };
    if (typeof d.scheduledAt === 'string') {
      const ts = new Date(d.scheduledAt);
      if (Number.isNaN(ts.getTime())) {
        return NextResponse.json({ error: 'That date and time didn’t parse.' }, { status: 400 });
      }
      // Sanity window — same range the availability board accepts.
      const year = ts.getUTCFullYear();
      if (year < 2024 || year > 2099) {
        return NextResponse.json({ error: 'Pick a slot between 2024 and 2099.' }, { status: 400 });
      }
      data.scheduledAt = ts;
    }

    const row = await db.viewing.update({
      where: { id: d.id },
      data,
      select: { id: true, status: true, scheduledAt: true, manageToken: true },
    });
    return NextResponse.json({
      ok: true,
      kind: 'viewing',
      id: row.id,
      status: row.status,
      scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
      manageToken: row.manageToken,
    });
  } catch (e: unknown) {
    // Prisma P2025 = record not found — say so plainly, keep 404 semantics.
    const isMissing =
      typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === 'P2025';
    if (isMissing) {
      return NextResponse.json({ error: 'That row is gone — refresh the digest.' }, { status: 404 });
    }
    console.error('pipeline POST failed', e);
    return NextResponse.json({ error: 'Could not save the update.' }, { status: 500 });
  }
}
