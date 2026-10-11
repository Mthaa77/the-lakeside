import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyTeam } from '@/lib/notify';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — POPIA DATA-REQUESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * Self-service POPIA requests (access / correction / deletion). Creates a Lead
 * with source 'privacy_request' that the team MUST action manually — this
 * endpoint never claims automated fulfilment and never deletes anything
 * itself. POPIA allows a reasonable response window; copy on the site says
 * "we'll confirm and act" without inventing a timeline.
 */

const schema = z.object({
  type: z.enum(['access', 'correction', 'deletion']),
  firstName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  detail: z.string().trim().max(1000).optional().default(''),
  consentContact: z.boolean(),
  company: z.string().max(0).optional().or(z.literal('')), // honeypot
});

const LABEL: Record<string, string> = {
  access: 'Request a copy of my personal information',
  correction: 'Correct my personal information',
  deletion: 'Delete my personal information',
};

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`privacy:${ip}`, 5, 60_000);
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
  if (d.company) return NextResponse.json({ ok: true }); // honeypot — pretend success

  try {
    const lead = await db.lead.create({
      data: {
        firstName: d.firstName,
        email: d.email,
        message: `[POPIA ${d.type.toUpperCase()}] ${LABEL[d.type]}${d.detail ? ` — ${d.detail}` : ''}`,
        source: 'privacy_request',
        consentContact: d.consentContact,
        score: 0, // compliance request — never a sales lead
        status: 'new',
      },
    });

    notifyTeam('privacy_request', {
      type: d.type,
      name: d.firstName,
      email: d.email,
      detail: d.detail || null,
      leadId: lead.id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('privacy request POST failed', e);
    return NextResponse.json(
      { error: 'We could not log your request — please email us directly at hello@thelakeside.co.za.' },
      { status: 500 }
    );
  }
}
