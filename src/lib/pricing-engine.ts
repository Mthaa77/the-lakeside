/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — PRICING ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure functions only. The UI never calculates; it renders this engine's
 * output. Every rand on the site flows through here.
 *
 * Required test vectors (2026 unless stated):
 * - Sat, 100 adults, standard → R198,000 · with top-up → R238,000
 * - Fri, 80 adults → R162,000 · Sun, 40 adults → R96,000
 * - Thu, 40 adults (weekend card) → R86,000; weekday package 40 pax → R85,000
 * - Sat, 60 adults → billed as 80 → R172,000 (+ notice)
 * - Weekday 20 → R58,000 · 45 → R93,000 (indicative) · 100 → R150,000 · 115 → POR
 * - Sat 2027, 100 adults → R208,000
 * - 2026 Heritage ×3 → R5,100 per night
 * - Sat deposit = R34,000; weekday 40 pax deposit = R21,250
 * - December weekday → falls back to weekend-card pricing (reason shown)
 */

import {
  PRICING, CONFIGURED_YEARS, SA_PUBLIC_HOLIDAYS,
  type DayType,
} from '@/config/pricing';

// ── Date classification ─────────────────────────────────────────────────────

export type DateClass = {
  date: string;            // 'YYYY-MM-DD'
  dayType: DayType;
  isPublicHoliday: boolean;
  isDayBeforePH: boolean;
  isWinter: boolean;       // Jun–Aug → winter specials, contact us
  isDecember: boolean;
  year: number;
  yearConfigured: boolean;
  effectiveDayType: 'sat' | 'publicHoliday' | 'fri' | 'dayBeforePH' | 'thu' | 'sun' | 'weekday';
  hireKey: 'monThu' | 'fri' | 'sat' | 'sun';
};

export function classifyDate(iso: string): DateClass {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0=Sun … 6=Sat
  const dayType: DayType = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as DayType[])[dow];
  const year = y;

  const holidays = SA_PUBLIC_HOLIDAYS[year] ?? [];
  const isPublicHoliday = holidays.includes(iso);
  const prev = new Date(dt);
  prev.setUTCDate(prev.getUTCDate() - 1);
  const prevIso = prev.toISOString().slice(0, 10);
  const isDayBeforePH = holidays.includes(prevIso);

  const month = m;
  const isWinter = month >= 6 && month <= 8;
  const isDecember = month === 12;

  const yearConfigured = CONFIGURED_YEARS.includes(year);

  // effective day type for hire + minimums
  let hireKey: DateClass['hireKey'];
  let effectiveDayType: DateClass['effectiveDayType'];
  if (dow === 6) { hireKey = 'sat'; effectiveDayType = 'sat'; }
  else if (dow === 5) { hireKey = 'fri'; effectiveDayType = isDayBeforePH ? 'dayBeforePH' : 'fri'; }
  else if (dow === 0) { hireKey = 'sun'; effectiveDayType = 'sun'; }
  else if (dow === 4) { hireKey = 'monThu'; effectiveDayType = 'thu'; }
  else { hireKey = 'monThu'; effectiveDayType = isPublicHoliday ? 'publicHoliday' : (isDayBeforePH ? 'dayBeforePH' : 'weekday'); }
  if (isPublicHoliday && dow !== 6) { hireKey = dow === 0 ? 'sun' : 'monThu'; effectiveDayType = 'publicHoliday'; }

  return { date: iso, dayType, isPublicHoliday, isDayBeforePH, isWinter, isDecember, year, yearConfigured, effectiveDayType, hireKey };
}

function venueHireFor(c: DateClass): number {
  switch (c.hireKey) {
    case 'sat': return PRICING.venueHire.sat;
    case 'fri': return PRICING.venueHire.fri;
    case 'sun': return PRICING.venueHire.sun;
    default: return PRICING.venueHire.monThu;
  }
}

export function minAdultsFor(c: DateClass): number {
  switch (c.effectiveDayType) {
    case 'sat': return PRICING.minAdults.sat;
    case 'publicHoliday': return PRICING.minAdults.publicHoliday;
    case 'fri': return PRICING.minAdults.fri;
    case 'dayBeforePH': return PRICING.minAdults.dayBeforePH;
    case 'thu': return PRICING.minAdults.thu;
    case 'sun': return PRICING.minAdults.sun;
    default: return PRICING.minAdults.mon;
  }
}

/** Weekday all-inclusive eligibility (Mon–Thu, not Dec / PH / day-before-PH). */
export function weekdayEligible(c: DateClass): boolean {
  const dow = c.dayType;
  return ['mon', 'tue', 'wed', 'thu'].includes(dow)
    && !c.isDecember
    && !c.isPublicHoliday
    && !c.isDayBeforePH
    && c.yearConfigured;
}

// ── Estimate inputs / outputs ───────────────────────────────────────────────

export type AddonSelection = {
  fairyLights?: boolean;
  patioHeaters?: boolean;
  nespressoBar?: boolean;
  animalFeed?: boolean;
  harvestTable?: boolean;      // per person
  lateSnacks?: boolean;        // per person (half guest count billed by venue rule → engine bills half count)
  venueOTHours?: number;
  barOTHours?: number;
};

export type RoomSelection = { heritage?: number; manor?: number; suite?: number; nights?: number };

export type EstimateInput = {
  date: string;                      // 'YYYY-MM-DD'
  adults: number;
  children?: number;                 // under 12
  topUp?: boolean;
  danceFloor?: boolean;
  addons?: AddonSelection;
  rooms?: RoomSelection;
};

export type EstimateLine = { label: string; amount: number; note?: string };

export type PaymentMilestone = {
  label: string;
  dueDate: string | null;   // ISO or null = "on booking"
  amount: number | null;    // null = variable (e.g. final balance needs total)
  refundable: boolean;
  note?: string;
  clamped?: boolean;        // standard date passed before booking — payment is due on booking
};

export type PackageOption = 'weekend' | 'weekend-topup' | 'weekday';

export type EstimateResult = {
  ok: true;
  package: PackageOption;
  packageName: string;
  dateClass: DateClass;
  adults: number;
  billableAdults: number;
  minAdults: number;
  minNotice: string | null;
  capacityWarning: string | null;
  venueHire: number;
  foodDecor: number;
  addonsTotal: number;
  roomsTotal: number;
  total: number;
  lines: EstimateLine[];
  deposit: { amount: number; rule: string };
  breakageDeposit: number;
  paymentSchedule: PaymentMilestone[];
  year: number;
  isIndicative: boolean;   // between weekday tiers
  priceOnRequest: boolean;
  disclaimers: string[];
};

export type EstimateError =
  | { ok: false; code: 'unconfigured-year'; message: string }
  | { ok: false; code: 'over-capacity'; message: string }
  | { ok: false; code: 'past-date'; message: string }
  | { ok: false; code: 'invalid-date'; message: string };

// ── Helpers ─────────────────────────────────────────────────────────────────

export function formatZAR(n: number): string {
  return 'R ' + new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 })
    .format(Math.round(n))
    .replace(/\u00a0/g, ' ');
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + months);
  return dt.toISOString().slice(0, 10);
}
function addWeeks(iso: string, weeks: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - weeks * 7);
  return dt.toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekdayTierFor(guests: number): { base: number; baseGuests: number; indicative: boolean } | null {
  const tiers = Object.entries(PRICING.weekday.tiers)
    .map(([g, p]) => ({ guests: Number(g), price: p as number }))
    .sort((a, b) => a.guests - b.guests);
  const exact = tiers.find(t => t.guests === guests);
  if (exact) return { base: exact.price, baseGuests: exact.guests, indicative: false };
  const lower = tiers.filter(t => t.guests < guests).pop();
  if (!lower) return null; // below 20
  return { base: lower.price, baseGuests: lower.guests, indicative: true };
}

// ── Weekend-card estimate (also used for Thursday / December fallback) ──────

export function estimateWeekendCard(input: EstimateInput, forcePackage: 'weekend' | 'weekend-topup'): EstimateResult | EstimateError {
  const c = classifyDate(input.date);
  if (!c.yearConfigured) {
    return { ok: false, code: 'unconfigured-year', message: 'Price on request — we have published rates for 2026 and 2027. Ask us about your date.' };
  }
  const today = todayIso();
  if (input.date < today) {
    return { ok: false, code: 'past-date', message: 'That date is in the past; pick a future date.' };
  }

  const withTopUp = forcePackage === 'weekend-topup';
  const card = PRICING.years[c.year];
  const minAdults = minAdultsFor(c);
  const billableAdults = Math.max(input.adults, minAdults);
  const minNotice = input.adults < minAdults
    ? `${['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][new Date(input.date + 'T00:00:00Z').getUTCDay()]}${c.isPublicHoliday ? ' (public holiday)' : ''} has a minimum of ${minAdults} paying adults, so we've priced for ${minAdults}.`
    : null;

  const capacityMax = input.danceFloor ? PRICING.capacity.withDanceFloor : PRICING.capacity.max;
  const totalAttendance = input.adults + (input.children ?? 0);
  const capacityWarning = totalAttendance > PRICING.capacity.max
    ? `The marble reception holds ${PRICING.capacity.max} guests without a dance floor, or ${PRICING.capacity.withDanceFloor} with one.`
    : input.danceFloor && totalAttendance > PRICING.capacity.withDanceFloor
      ? `With a dance floor the reception holds ${PRICING.capacity.withDanceFloor}. We've removed the dance floor so your ${totalAttendance} guests fit.`
      : null;

  const venue = venueHireFor(c);
  const pp = card.foodDecorPP + (withTopUp ? card.topUpPP : 0);
  const food = billableAdults * pp;

  const lines: EstimateLine[] = [
    { label: `Venue hire (${c.isPublicHoliday ? 'public holiday' : dayLabel(c)})`, amount: venue },
    { label: `Food & decor — ${billableAdults} guests × ${formatZAR(pp)}`, amount: food, note: withTopUp ? 'Top-up package included (+R400 pp)' : '4-course menu' },
  ];

  const a = input.addons ?? {};
  const addons: EstimateLine[] = [];
  if (a.fairyLights) addons.push({ label: 'Fairy lights', amount: card.addons.fairyLights });
  if (a.patioHeaters) addons.push({ label: 'Patio heaters (×4)', amount: card.addons.patioHeaters });
  if (a.nespressoBar) addons.push({ label: 'Nespresso bar', amount: card.addons.nespressoBar });
  if (a.animalFeed) addons.push({ label: 'Animal feed', amount: card.addons.animalFeed });
  if (a.harvestTable) addons.push({ label: `Harvest table — ${billableAdults} × ${formatZAR(card.addons.harvestTablePP)}`, amount: billableAdults * card.addons.harvestTablePP });
  if (a.lateSnacks) {
    const half = Math.ceil(billableAdults / 2);
    addons.push({ label: `Late-night snacks — ${half} × ${formatZAR(card.addons.lateSnacksPP)}`, amount: half * card.addons.lateSnacksPP, note: 'billed for half the guest count' });
  }
  if (a.venueOTHours) addons.push({ label: `Venue overtime — ${a.venueOTHours} h`, amount: a.venueOTHours * card.addons.venueOT });
  if (a.barOTHours) addons.push({ label: `Bar overtime — ${a.barOTHours} h`, amount: a.barOTHours * card.addons.barOT });
  if ((input.children ?? 0) > 0) addons.push({ label: `Children under 12 — ${input.children} × ${formatZAR(card.addons.childU12)}`, amount: (input.children ?? 0) * card.addons.childU12, note: 'canapés, kids’ main, dessert' });
  const addonsTotal = addons.reduce((s, l) => s + l.amount, 0);
  lines.push(...addons);

  const r = input.rooms ?? {};
  const nights = r.nights ?? 1;
  const roomsLines: EstimateLine[] = [];
  const roomCount = (r.heritage ?? 0) + (r.manor ?? 0) + (r.suite ?? 0);
  let roomsTotal = 0;
  if (roomCount > 0) {
    if (r.heritage) { const amt = r.heritage * card.rooms.heritage * nights; roomsTotal += amt; roomsLines.push({ label: `Heritage House room × ${r.heritage} (${nights} night${nights > 1 ? 's' : ''})`, amount: amt }); }
    if (r.manor) { const amt = r.manor * card.rooms.manor * nights; roomsTotal += amt; roomsLines.push({ label: `Manor House room × ${r.manor} (${nights} night${nights > 1 ? 's' : ''})`, amount: amt }); }
    if (r.suite) { const amt = r.suite * card.rooms.suite * nights; roomsTotal += amt; roomsLines.push({ label: `Bridal Suite / Groom’s Cabin × ${r.suite} (${nights} night${nights > 1 ? 's' : ''})`, amount: amt }); }
    if (roomCount > PRICING.accommodation.maxRooms) roomsLines.push({ label: 'Note', amount: 0, note: '9 rooms max — collect extra rooms with the bridal party' });
    lines.push(...roomsLines);
  }

  const total = venue + food + addonsTotal + roomsTotal;
  const depositAmount = Math.round(venue * PRICING.weekendDeposit);

  const schedule = buildPaymentSchedule({
    eventDate: input.date,
    kind: 'weekend',
    venueHire: venue,
    foodDecorTotal: food + addonsTotal,
    roomsTotal,
    depositAmount,
    depositDueNow: true,
  });

  return {
    ok: true,
    package: withTopUp ? 'weekend-topup' : 'weekend',
    packageName: withTopUp ? 'Weekend + Top-up' : 'Weekend standard',
    dateClass: c,
    adults: input.adults,
    billableAdults,
    minAdults,
    minNotice,
    capacityWarning,
    venueHire: venue,
    foodDecor: food,
    addonsTotal,
    roomsTotal,
    total,
    lines,
    deposit: { amount: depositAmount, rule: `50% of venue hire (non-refundable) secures your date` },
    breakageDeposit: PRICING.breakageDeposit,
    paymentSchedule: schedule,
    year: c.year,
    isIndicative: false,
    priceOnRequest: false,
    disclaimers: [
      'Prices include VAT.',
      'Indicative estimate — your date is secured only by the signed T&Cs and the non-refundable deposit.',
      'Florals, decor and food are in-house only.',
    ],
  };
}

// ── Weekday all-inclusive estimate ──────────────────────────────────────────

export function estimateWeekday(input: EstimateInput): EstimateResult | EstimateError {
  const c = classifyDate(input.date);
  if (!c.yearConfigured) {
    return { ok: false, code: 'unconfigured-year', message: 'Price on request — we have published rates for 2026 and 2027.' };
  }
  if (input.date < todayIso()) {
    return { ok: false, code: 'past-date', message: 'That date is in the past; pick a future date.' };
  }

  const tier = weekdayTierFor(input.adults);
  if (input.adults >= PRICING.weekday.porFrom || !tier) {
    return { ok: false, code: 'unconfigured-year', message: 'Weekday weddings for 110+ guests are priced on request — send us your date and guest count.' };
  }

  const isThursday = c.dayType === 'thu';
  const minGuests = isThursday ? PRICING.weekday.thursdayMinAdults : PRICING.weekday.monWedMinGuests;

  const extraGuests = Math.max(0, input.adults - tier.baseGuests);
  const base = tier.base;
  const extra = extraGuests * PRICING.weekday.extraGuest;
  const packageTotal = base + extra;

  const lines: EstimateLine[] = [
    { label: `Weekday all-inclusive — ${tier.baseGuests} guests`, amount: base, note: 'venue hire, 3-course plated meal, cake, sparkling wine toasts, DJ & sound, selected decor' },
  ];
  if (extraGuests > 0) {
    lines.push({ label: `Additional guests — ${extraGuests} × ${formatZAR(PRICING.weekday.extraGuest)}`, amount: extra, note: 'indicative: confirm with us' });
  }

  // accommodation + a few add-ons still apply
  const card = PRICING.years[c.year];
  const a = input.addons ?? {};
  const r = input.rooms ?? {};
  const nights = r.nights ?? 1;
  let roomsTotal = 0;
  const roomCount = (r.heritage ?? 0) + (r.manor ?? 0) + (r.suite ?? 0);
  if (roomCount > 0) {
    if (r.heritage) { const amt = r.heritage * card.rooms.heritage * nights; roomsTotal += amt; lines.push({ label: `Heritage House room × ${r.heritage}`, amount: amt }); }
    if (r.manor) { const amt = r.manor * card.rooms.manor * nights; roomsTotal += amt; lines.push({ label: `Manor House room × ${r.manor}`, amount: amt }); }
    if (r.suite) { const amt = r.suite * card.rooms.suite * nights; roomsTotal += amt; lines.push({ label: `Bridal Suite / Groom’s Cabin × ${r.suite}`, amount: amt }); }
  }
  let addonsTotal = 0;
  if (a.fairyLights) { addonsTotal += card.addons.fairyLights; lines.push({ label: 'Fairy lights', amount: card.addons.fairyLights }); }
  if (a.patioHeaters) { addonsTotal += card.addons.patioHeaters; lines.push({ label: 'Patio heaters (×4)', amount: card.addons.patioHeaters }); }
  if (a.animalFeed) { addonsTotal += card.addons.animalFeed; lines.push({ label: 'Animal feed', amount: card.addons.animalFeed }); }

  const total = packageTotal + roomsTotal + addonsTotal;
  const depositAmount = Math.round(packageTotal * PRICING.weekday.deposit);

  const schedule = buildPaymentSchedule({
    eventDate: input.date,
    kind: 'weekday',
    venueHire: 0,
    foodDecorTotal: 0,
    roomsTotal,
    depositAmount,
    depositDueNow: true,
    packageTotal,
  });

  return {
    ok: true,
    package: 'weekday',
    packageName: 'Weekday all-inclusive',
    dateClass: c,
    adults: input.adults,
    billableAdults: input.adults,
    minAdults: minGuests,
    minNotice: input.adults < minGuests
      ? `${isThursday ? 'Thursdays' : 'Mon–Wed'} require a minimum of ${minGuests} ${isThursday ? 'paying adults' : 'guests'}${!isThursday ? ' — below 20, please contact us' : ''}.`
      : null,
    capacityWarning: null,
    venueHire: 0,
    foodDecor: packageTotal,
    addonsTotal,
    roomsTotal,
    total,
    lines,
    deposit: { amount: depositAmount, rule: '25% of the package (non-refundable) secures your date' },
    breakageDeposit: PRICING.breakageDeposit,
    paymentSchedule: schedule,
    year: c.year,
    isIndicative: tier.indicative,
    priceOnRequest: false,
    disclaimers: [
      'Prices include VAT.',
      'Weekday packages exclude December, public holidays and the day before a public holiday.',
      'Indicative estimate — your date is secured only by the signed T&Cs and the non-refundable deposit.',
    ],
  };
}

// ── Master estimate: picks packages, handles Thursday & December duals ──────

export type EstimateBundle = {
  weekend: EstimateResult | EstimateError;
  weekday: EstimateResult | EstimateError | null;
  showBoth: boolean;
  fallbackReason: string | null; // e.g. December weekday explanation
};

export function estimate(input: EstimateInput): EstimateBundle {
  const c = classifyDate(input.date);
  const withTopUp = input.topUp ?? false;
  const weekend = estimateWeekendCard(input, withTopUp ? 'weekend-topup' : 'weekend');

  let weekday: EstimateResult | EstimateError | null = null;
  let showBoth = false;
  let fallbackReason: string | null = null;

  if (weekdayEligible(c)) {
    weekday = estimateWeekday(input);
    if (c.dayType === 'thu') {
      showBoth = true; // Thursday: show weekend card + weekday package side by side
    } else if (c.isDecember) {
      showBoth = false;
      fallbackReason = 'December weekday: the all-inclusive weekday package excludes December, so the weekend rate card applies.';
    }
  } else if (['mon', 'tue', 'wed', 'thu'].includes(c.dayType)) {
    if (c.isDecember) fallbackReason = 'The weekday all-inclusive package excludes December — the weekend rate card applies.';
    else if (c.isPublicHoliday) fallbackReason = 'This is a public holiday, so the weekend rate card applies.';
    else if (c.isDayBeforePH) fallbackReason = 'The day before a public holiday follows Friday minimums, so the weekend rate card applies.';
  }

  return { weekend, weekday, showBoth, fallbackReason };
}

// ── Payment schedule ────────────────────────────────────────────────────────

type ScheduleInput = {
  eventDate: string;
  kind: 'weekend' | 'weekday';
  venueHire: number;
  foodDecorTotal: number;
  roomsTotal: number;
  depositAmount: number;
  depositDueNow: boolean;
  packageTotal?: number;
};

export function buildPaymentSchedule(s: ScheduleInput): PaymentMilestone[] {
  const ed = s.eventDate;
  const out: PaymentMilestone[] = [];
  const within1Month = monthsBetween(todayIso(), ed) < 1;

  if (within1Month) {
    const total = s.kind === 'weekday' ? (s.packageTotal ?? 0) + s.roomsTotal : s.venueHire + s.foodDecorTotal + s.roomsTotal;
    return [{
      label: 'Booking within one month of the wedding — full payment is due immediately',
      dueDate: todayIso(),
      amount: total,
      refundable: false,
      note: 'Per the signed T&Cs',
    }];
  }

  if (s.kind === 'weekend') {
    out.push({ label: 'Deposit — 50% of venue hire', dueDate: s.depositDueNow ? todayIso() : null, amount: s.depositAmount, refundable: false, note: 'Non-refundable; secures your date' });
    out.push({ label: 'Remaining 50% of venue hire', dueDate: addMonths(ed, -6), amount: s.venueHire - s.depositAmount, refundable: false });
    out.push({ label: '50% of catering & decor', dueDate: addMonths(ed, -3), amount: Math.round(s.foodDecorTotal / 2), refundable: false });
    out.push({ label: 'Final guest numbers due', dueDate: addWeeks(ed, 6), amount: null, refundable: false, note: 'Confirm your count' });
    out.push({ label: 'Balance + R10,000 refundable breakage deposit + named guest list', dueDate: addMonths(ed, -1), amount: Math.ceil(s.foodDecorTotal / 2) + PRICING.breakageDeposit, refundable: false, note: 'Breakage deposit is refunded after the wedding' });
  } else {
    out.push({ label: 'Deposit — 25% of package', dueDate: s.depositDueNow ? todayIso() : null, amount: s.depositAmount, refundable: false, note: 'Non-refundable; secures your date' });
    out.push({ label: 'Additional 25% of package', dueDate: addMonths(ed, -6), amount: Math.round((s.packageTotal ?? 0) * 0.25), refundable: false });
    out.push({ label: 'Final guest numbers due', dueDate: addWeeks(ed, 6), amount: null, refundable: false, note: 'Confirm your count' });
    out.push({ label: `Balance + R10,000 refundable breakage deposit + named guest list`, dueDate: addMonths(ed, -1), amount: Math.max(0, (s.packageTotal ?? 0) - s.depositAmount - Math.round((s.packageTotal ?? 0) * 0.25)) + PRICING.breakageDeposit, refundable: false, note: 'Breakage deposit is refunded after the wedding' });
  }
  if (s.roomsTotal > 0) {
    out.push({ label: 'Accommodation payment (one payment to the venue)', dueDate: addWeeks(ed, 2), amount: s.roomsTotal, refundable: false, note: 'Bridal party collects room payments' });
  }
  // Late bookings: milestones whose standard date has already passed are owed on booking
  // (the T&Cs set each payment at "≥ X months/weeks before" — if that date is gone, it is due now).
  const today = todayIso();
  return out.map((m) => {
    if (m.dueDate && m.dueDate < today) {
      const notes = [m.note, 'Standard date has passed — due on booking'].filter(Boolean).join(' · ');
      return { ...m, dueDate: today, clamped: true, ...(notes ? { note: notes } : {}) };
    }
    return m;
  });
}

function monthsBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + (td - fd) / 30;
}

// ── Cancellation calculator (informational; "per the signed T&Cs") ─────────

export type CancellationResult = {
  band: string;
  refundDescription: string;
};

export function cancellationOutcome(eventDate: string, cancelDate: string, venueHire: number, foodDecorTotal: number): CancellationResult {
  const months = monthsBetween(cancelDate, eventDate);
  if (months > 6) {
    return { band: 'More than 6 months before', refundDescription: `Cancellation fee of ${formatZAR(PRICING.cancellation.over6mFlat)} applies.` };
  }
  if (months > 3) {
    return { band: 'Within 6 months', refundDescription: `100% of venue hire is payable; up to 50% may be refunded if the date is re-booked for a similar function.` };
  }
  if (months > 1) {
    return { band: 'Within 3 months', refundDescription: '100% of venue hire plus 50% of food, decor and florals is payable.' };
  }
  return { band: 'Within 1 month', refundDescription: '100% of the total invoice is payable.' };
}

// ── Day label helper ────────────────────────────────────────────────────────

export function dayLabel(c: DateClass): string {
  if (c.isPublicHoliday) return 'public holiday';
  if (c.effectiveDayType === 'dayBeforePH') return 'day before a public holiday';
  const names: Record<DayType, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
  return names[c.dayType];
}
