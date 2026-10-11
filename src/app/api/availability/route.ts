import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/availability
 * Returns only real rows edited by the venue team. Days with no row are
 * "unknown" → the UI shows "Ask us". We NEVER invent availability.
 */
export async function GET() {
  try {
    const days = await db.availabilityDay.findMany({
      where: { state: { not: 'unknown' } },
      select: { day: true, state: true, note: true },
      orderBy: { day: 'asc' },
    });
    return NextResponse.json(
      { days },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error('availability GET failed', e);
    // Fail closed: no data → all days unknown ("Ask us")
    return NextResponse.json({ days: [] }, { status: 200 });
  }
}
