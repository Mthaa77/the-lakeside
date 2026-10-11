import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyTeam } from '@/lib/notify';

/**
 * MANAGE MY VIEWING
 * Token-gated self-service for a viewing request.
 *   GET  /api/viewings/manage?token=LS-XXXXXX  → safe summary
 *   POST { token, action: 'cancel' }           → mark cancelled
 * The token is shown to the couple at booking time; without it the API
 * answers nothing. Status text is honest — the team confirms times.
 */

const getSchema = z.object({
  token: z.string().trim().min(6).max(40),
});

const postSchema = z.object({
  token: z.string().trim().min(6).max(40),
  action: z.literal('cancel'),
});

function summary(v: {
  manageToken: string;
  mode: string;
  status: string;
  preferredWhen: string | null;
  scheduledAt: Date | null;
  firstName: string;
  weddingDate: string | null;
  guests: number | null;
  createdAt: Date;
}) {
  return {
    reference: v.manageToken,
    mode: v.mode,
    status: v.status,
    preferredWhen: v.preferredWhen,
    scheduledAt: v.scheduledAt ? v.scheduledAt.toISOString() : null,
    firstName: v.firstName,
    weddingDate: v.weddingDate,
    guests: v.guests,
    createdAt: v.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`viewings-manage-get:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests — try again shortly.' }, { status: 429 });
  }

  const url = new URL(req.url);
  const parsed = getSchema.safeParse({ token: url.searchParams.get('token') ?? '' });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter the reference from your confirmation.' }, { status: 400 });
  }

  try {
    const viewing = await db.viewing.findUnique({
      where: { manageToken: parsed.data.token.toUpperCase() },
    });
    // Do not reveal whether a token exists to brute force — same message shape.
    if (!viewing) {
      return NextResponse.json({ error: 'We couldn’t find that reference. Check it, or WhatsApp us.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, viewing: summary(viewing) });
  } catch (e) {
    console.error('viewings manage GET failed', e);
    return NextResponse.json({ error: 'Something went wrong — please try again.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`viewings-manage-post:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests — try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const viewing = await db.viewing.findUnique({
      where: { manageToken: parsed.data.token.toUpperCase() },
    });
    if (!viewing) {
      return NextResponse.json({ error: 'We couldn’t find that reference. Check it, or WhatsApp us.' }, { status: 404 });
    }
    if (viewing.status === 'cancelled') {
      return NextResponse.json({ ok: true, viewing: summary(viewing) });
    }
    if (viewing.status === 'done') {
      return NextResponse.json({ error: 'This viewing has already taken place.' }, { status: 409 });
    }

    const updated = await db.viewing.update({
      where: { manageToken: viewing.manageToken },
      data: { status: 'cancelled' },
    });

    // Team notification — fire-and-forget webhook (no-op unless configured)
    notifyTeam('viewing_cancelled', {
      reference: updated.manageToken,
      name: `${updated.firstName} ${updated.lastName}`.trim(),
      email: updated.email,
      phone: updated.phone,
      preferredWhen: updated.preferredWhen,
    });

    return NextResponse.json({ ok: true, viewing: summary(updated) });
  } catch (e) {
    console.error('viewings manage POST failed', e);
    return NextResponse.json({ error: 'Something went wrong — please try again.' }, { status: 500 });
  }
}
