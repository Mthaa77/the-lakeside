import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyTeam } from '@/lib/notify';

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().default(''),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  phone: z.string().trim().min(6).max(40).optional().or(z.literal('')),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  guests: z.number().int().min(2).max(200).nullable().optional(),
  message: z.string().max(1500).optional().default(''),
  source: z.string().max(80).optional().default('website'),
  consentMarketing: z.boolean().optional().default(false),
  consentContact: z.boolean(),
  company: z.string().max(0).optional().or(z.literal('')), // honeypot
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`leads:${ip}`, 8, 60_000);
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check the form.' },
      { status: 400 }
    );
  }
  const d = parsed.data;
  if (d.company) return NextResponse.json({ ok: true });

  if (!d.email && !d.phone) {
    return NextResponse.json({ error: 'An email or phone number is required.' }, { status: 400 });
  }

  try {
    const lead = await db.lead.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName || null,
        email: d.email || null,
        phone: d.phone || null,
        weddingDate: d.weddingDate || null,
        guests: d.guests ?? null,
        message: d.message || null,
        source: d.source,
        consentMarketing: d.consentMarketing,
        consentContact: d.consentContact,
        score: 10 + (d.weddingDate ? 10 : 0) + ((d.guests ?? 0) >= 80 ? 10 : 0),
      },
    });
    // Team notification — fire-and-forget webhook (no-op unless configured)
    notifyTeam('enquiry', {
      name: `${d.firstName} ${d.lastName}`.trim(),
      email: d.email || null,
      phone: d.phone || null,
      weddingDate: d.weddingDate || null,
      guests: d.guests ?? null,
      source: d.source,
      message: d.message || null,
      score: lead.score,
    });

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (e) {
    console.error('leads POST failed', e);
    return NextResponse.json({ error: 'We could not save your enquiry — please try WhatsApp.' }, { status: 500 });
  }
}
