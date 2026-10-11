import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyTeam } from '@/lib/notify';

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(200),
  children: z.number().int().min(0).max(100).optional().default(0),
  topUp: z.boolean().optional().default(false),
  packageName: z.string().max(60).optional().default(''),
  total: z.number().int().min(0).max(5_000_000),
  deposit: z.number().int().min(0).max(5_000_000).optional(),
});

function shortId(): string {
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

// GET /api/quotes?shortId=ABC123 → restore a saved estimate for a share link.
// Returns only what the couple already saw in the estimator — no live
// availability claims, just the saved inputs + engine result snapshot.
export async function GET(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`quotes-get:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests — try again shortly.' }, { status: 429 });
  }

  const url = new URL(req.url);
  const shortId = (url.searchParams.get('shortId') ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(shortId)) {
    return NextResponse.json({ error: 'That estimate link doesn’t look right.' }, { status: 400 });
  }

  try {
    const quote = await db.quote.findUnique({ where: { shortId } });
    if (!quote) {
      return NextResponse.json({ error: 'We couldn’t find that saved estimate.' }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      quote: {
        shortId: quote.shortId,
        createdAt: quote.createdAt.toISOString(),
        inputs: JSON.parse(quote.inputsJson) as unknown,
        result: JSON.parse(quote.resultJson) as unknown,
      },
    });
  } catch (e) {
    console.error('quotes GET failed', e);
    return NextResponse.json({ error: 'Something went wrong — please try again.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`quotes:${ip}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests — please try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid quote payload.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    const quote = await db.quote.create({
      data: {
        shortId: shortId(),
        inputsJson: JSON.stringify({
          date: d.date, adults: d.adults, children: d.children, topUp: d.topUp,
        }),
        resultJson: JSON.stringify({
          packageName: d.packageName, total: d.total, deposit: d.deposit ?? null,
        }),
      },
    });

    // Team notification — fire-and-forget webhook (no-op unless configured).
    // Quotes fire on every estimator result, so the webhook URL should point
    // at a digesting endpoint (Make.com filter), not a chat ping, or it will
    // get noisy. Kept because "couple reached the results step" is gold signal.
    notifyTeam('quote_saved', {
      shortId: quote.shortId,
      date: d.date,
      adults: d.adults,
      children: d.children,
      packageName: d.packageName,
      total: d.total,
      deposit: d.deposit ?? null,
    });

    return NextResponse.json({ ok: true, shortId: quote.shortId });
  } catch (e) {
    console.error('quotes POST failed', e);
    return NextResponse.json({ error: 'Could not save the quote.' }, { status: 500 });
  }
}
