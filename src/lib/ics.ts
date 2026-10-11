/**
 * THE LAKESIDE — ICS GENERATOR
 * Builds an RFC-5545 .ics file from payment/planning milestones so couples
 * can drop the schedule into any calendar. Client-side (Blob download).
 */

export type IcsEvent = {
  title: string;
  date: string;          // 'YYYY-MM-DD'
  description?: string;
  /** Timed-event support (e.g. confirmed viewings). 'HH:MM', 24h, venue-local
   * (floating — South Africa has no DST, so floating is unambiguous here). */
  time?: string;
  durationMins?: number; // defaults to 60 when `time` is set
};

function icsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** 'YYYY-MM-DD' + 'HH:MM' → floating ICS datetime 'YYYYMMDDTHHMMSS'. */
function icsDateTime(dateIso: string, time: string): string {
  const [h, m] = time.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${icsDate(dateIso)}T${pad(h ?? 0)}${pad(m ?? 0)}00`;
}

function addMinutes(dateIso: string, time: string, mins: number): string {
  const [y, mo, d] = dateIso.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  dt.setUTCMinutes(dt.getUTCMinutes() + mins);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(
    dt.getUTCHours(),
  )}${pad(dt.getUTCMinutes())}00`;
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(events: IcsEvent[], calName = 'The Lakeside — Payment & planning timeline'): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Lakeside//Weddings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName)}`,
  ];
  events.forEach((e, i) => {
    const timed = !!e.time;
    const dur = e.durationMins ?? 60;
    lines.push(
      'BEGIN:VEVENT',
      `UID:lakeside-${stamp}-${i}@thelakeside.co.za`,
      `DTSTAMP:${stamp}`,
      timed ? `DTSTART:${icsDateTime(e.date, e.time as string)}` : `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      timed
        ? `DTEND:${addMinutes(e.date, e.time as string, dur)}`
        : `DTEND;VALUE=DATE:${icsDate(nextDay(e.date))}`,
      `SUMMARY:${esc(e.title)}`,
      e.description ? `DESCRIPTION:${esc(e.description)}` : 'DESCRIPTION:The Lakeside — Weddings & Events',
      'BEGIN:VALARM',
      timed ? 'TRIGGER:-PT60M' : 'TRIGGER:-P3D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(e.title)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
