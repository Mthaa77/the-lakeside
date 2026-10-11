/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — TEAM NOTIFICATION (webhook stub)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fire-and-forget POST to NOTIFY_WEBHOOK_URL (Make.com / Zapier / Slack
 * incoming-webhook compatible). Set the env var to activate:
 *
 *   NOTIFY_WEBHOOK_URL=https://hooks.make.com/…
 *
 * Contract: never throws, never blocks the caller's response path longer than
 * the 3s timeout, and stays silent when the env var is unset (dev default).
 * TODO(CLIENT): choose the team channel (email / WhatsApp group / Make.com)
 * and configure NOTIFY_WEBHOOK_URL in the hosting environment.
 */

const WEBHOOK_TIMEOUT_MS = 3_000;

export type NotifyEvent =
  | 'viewing_booked'
  | 'viewing_cancelled'
  | 'enquiry'
  | 'quote_saved'
  | 'estimate_email_request'
  | 'privacy_request';

export function notifyTeam(event: NotifyEvent, payload: Record<string, unknown>): void {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return; // not configured — stay silent (never invent delivery)

  const body = JSON.stringify({
    event,
    site: 'The Lakeside',
    at: new Date().toISOString(),
    ...payload,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) {
        console.warn(`notify: webhook responded ${res.status} for ${event}`);
      }
    })
    .catch((err) => {
      console.warn(`notify: webhook failed for ${event}:`, err instanceof Error ? err.message : err);
    })
    .finally(() => clearTimeout(timer));
}
