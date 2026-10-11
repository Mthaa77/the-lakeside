import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * AVAILABILITY ADMIN (token-gated) — the team's availability board
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/admin/availability?token=…
 *   Body: { action: 'set',    day: 'YYYY-MM-DD', state, note? }  → upsert row
 *         { action: 'remove', day: 'YYYY-MM-DD' }                   → delete row
 *
 * Rows set here appear immediately on the public date checker via
 * GET /api/availability (which only returns non-unknown rows). Removing a row
 * puts the day back to "Ask us" (unknown) — the site never invents a state.
 *
 * Auth: shared token compare (ADMIN_TOKEN env var; dev fallback documented in
 * docs/TODO-CLIENT.md — same token as the digest). Uniform 404 on bad token.
 *
 * TODO(CLIENT): strong ADMIN_TOKEN before launch; this is an ops stop-gap
 * until a proper admin app exists.
 */

const DEV_TOKEN = 'lakeside-team'; // TODO(CLIENT): replace via ADMIN_TOKEN env var

const STATES = ['available', 'limited', 'held', 'booked'] as const;
type DayState = (typeof STATES)[number];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function authorized(token: string | null): boolean {
  if (!token) return false;
  const expected = process.env.ADMIN_TOKEN || DEV_TOKEN;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return a.equals(b);
}

/** Real calendar date, sane range (stops typos like 0202-…), not just regex. */
function validDay(day: string): boolean {
  if (!ISO_DATE_RE.test(day)) return false;
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  if (d.toISOString().slice(0, 10) !== day) return false;
  return day >= '2024-01-01' && day <= '2099-12-31';
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`availability-admin:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const token = new URL(req.url).searchParams.get('token');
  if (!authorized(token)) {
    // Uniform 404 — no hint that the route exists.
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  let body: {
    action?: 'set' | 'remove';
    day?: string;
    state?: DayState;
    note?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const action = body.action ?? 'set';
  const day = typeof body.day === 'string' ? body.day : '';

  if (!validDay(day)) {
    return NextResponse.json(
      { error: 'Pick a real day (YYYY-MM-DD).' },
      { status: 400 },
    );
  }

  try {
    if (action === 'remove') {
      await db.availabilityDay.deleteMany({ where: { day } });
      return NextResponse.json({ ok: true, day, state: 'unknown' });
    }

    if (action === 'set') {
      if (!body.state || !STATES.includes(body.state)) {
        return NextResponse.json(
          { error: 'State must be available, limited, held or booked.' },
          { status: 400 },
        );
      }
      const note =
        typeof body.note === 'string' && body.note.trim() !== ''
          ? body.note.trim().slice(0, 140)
          : null;

      const row = await db.availabilityDay.upsert({
        where: { day },
        create: { day, state: body.state, note },
        update: { state: body.state, note, updatedAt: new Date() },
      });
      return NextResponse.json({
        ok: true,
        day: row.day,
        state: row.state,
        note: row.note,
      });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (e) {
    console.error('availability POST failed', e);
    return NextResponse.json({ error: 'Could not save the day.' }, { status: 500 });
  }
}
