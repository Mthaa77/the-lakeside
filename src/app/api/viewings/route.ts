import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyTeam } from '@/lib/notify';

const schema = z.object({
  mode: z.enum(['in_person', 'virtual']).default('in_person'),
  preferredWhen: z.string().max(40).optional().nullable(),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('A valid email is required').max(160),
  phone: z.string().trim().min(6, 'A phone number is required').max(40),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal('')),
  guests: z.number().int().min(2).max(200).nullable().optional(),
  notes: z.string().max(1000).optional().default(''),
  consentContact: z.boolean(),
  // honeypot — must be empty
  company: z.string().max(0).optional().or(z.literal('')),
});

function shortToken(): string {
  // Human-friendly reference: LS-XXXXXX (same alphabet as quote shortIds —
  // no 0/O/1/I/L confusions when a couple reads it off their phone).
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `LS-${s}`;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`viewings:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests — please try again in a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Please check the form.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const d = parsed.data;

  // honeypot filled → pretend success, store nothing
  if (d.company) {
    return NextResponse.json({ ok: true });
  }

  try {
    const lead = await db.lead.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        weddingDate: d.weddingDate || null,
        guests: d.guests ?? null,
        source: d.mode === 'virtual' ? 'viewing_virtual' : 'viewing_in_person',
        consentContact: d.consentContact,
        status: 'viewing_booked',
        score: 20 + (d.weddingDate ? 10 : 0) + ((d.guests ?? 0) >= 80 ? 10 : 0),
      },
    });

    const viewing = await db.viewing.create({
      data: {
        leadId: lead.id,
        manageToken: shortToken(),
        mode: d.mode,
        preferredWhen: d.preferredWhen || null,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        weddingDate: d.weddingDate || null,
        guests: d.guests ?? null,
        notes: d.notes || null,
      },
    });

    // Team notification — fire-and-forget webhook (no-op unless configured)
    notifyTeam('viewing_booked', {
      reference: viewing.manageToken,
      mode: d.mode,
      name: `${d.firstName} ${d.lastName}`.trim(),
      email: d.email,
      phone: d.phone,
      preferredWhen: d.preferredWhen || null,
      weddingDate: d.weddingDate || null,
      guests: d.guests ?? null,
    });

    return NextResponse.json({
      ok: true,
      viewingId: viewing.id,
      reference: viewing.manageToken,
    });
  } catch (e) {
    console.error('viewings POST failed', e);
    return NextResponse.json(
      { error: 'We could not save your request — please try again or WhatsApp us.' },
      { status: 500 }
    );
  }
}
