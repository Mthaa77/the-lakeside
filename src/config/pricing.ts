/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — PRICING SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────────
 * Every price, minimum, capacity, deposit and fee on the site (UI, calendar,
 * payment schedule, PDF, structured data) MUST come from this file.
 * No prices hard-coded in components or copy.
 *
 * All amounts in ZAR, VAT included.
 * TODO(CLIENT): confirm service-provider fee, 2nd-main-choice price, kosher
 * surcharge, Nespresso bar (2027) and winter specials (Jun–Aug, contact us).
 */

export type YearRateCard = {
  foodDecorPP: number;
  topUpPP: number;
  rooms: { heritage: number; manor: number; suite: number };
  addons: {
    fairyLights: number;
    patioHeaters: number;
    harvestTablePP: number;
    lateSnacksPP: number;
    animalFeed: number;
    childU12: number;
    venueOT: number;
    barOT: number;
    venueBarOT: number;
    nespressoBar: number;
    corkageWine: number;
    corkageChampagneSpirits: number;
  };
};

export type DayType = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const PRICING = {
  currency: 'ZAR',
  vatIncluded: true,
  /** Rate cards per wedding year (event date year). */
  years: {
    2026: {
      foodDecorPP: 1300,
      topUpPP: 400,
      rooms: { heritage: 1700, manor: 1900, suite: 1900 },
      addons: {
        fairyLights: 1200,
        patioHeaters: 1200,
        harvestTablePP: 90,
        lateSnacksPP: 70,
        animalFeed: 1600,
        childU12: 380,
        venueOT: 3000,
        barOT: 1500,
        venueBarOT: 4000,
        nespressoBar: 3800,
        corkageWine: 120,
        corkageChampagneSpirits: 360,
      },
    },
    2027: {
      foodDecorPP: 1400,
      topUpPP: 400,
      rooms: { heritage: 1800, manor: 2000, suite: 2000 },
      addons: {
        fairyLights: 1500,
        patioHeaters: 1500,
        harvestTablePP: 90,
        lateSnacksPP: 80,
        animalFeed: 1700,
        childU12: 400,
        venueOT: 3300,
        barOT: 1600,
        venueBarOT: 4500,
        nespressoBar: 3800, // TODO(CLIENT): confirm 2027 Nespresso bar price
        corkageWine: 120,
        corkageChampagneSpirits: 360,
      },
    },
  } as Record<number, YearRateCard>,

  /** Weekend-card venue hire, identical for 2026 and 2027. */
  venueHire: { monThu: 34000, fri: 58000, sat: 68000, sun: 44000 },

  /** Minimum paying adults per day type. */
  minAdults: {
    mon: 40, tue: 40, wed: 40, thu: 40,
    fri: 60, sat: 80, sun: 40,
    publicHoliday: 80, dayBeforePH: 60,
  },

  capacity: { max: 200, withDanceFloor: 160 },

  /** Weekday all-inclusive (Mon–Thu, excl. December, public holidays + eves). */
  weekday: {
    tiers: { 20: 58000, 30: 70000, 40: 85000, 50: 100000, 60: 110000, 70: 120000, 80: 130000, 90: 140000, 100: 150000 } as Record<number, number>,
    extraGuest: 1600,
    porFrom: 110, // guests >= 110 → price on request
    thursdayMinAdults: 40,
    monWedMinGuests: 20, // TODO(CLIENT): T&Cs mention a 10-guest minimum — confirm
    excludedMonths: [12],
    deposit: 0.25,
  },

  weekendDeposit: 0.5,
  breakageDeposit: 10000,

  /** Proposals (Mon–Fri, max 1 hour). */
  proposals: {
    canapeDeck: 1500,
    glassHouse: 2500,
    marbleReception: 4000,
    picnic: 1500,
    whiteCarpet: 500, // Glass House only
    petalsRed: 850,
    petalsWhite: 1000,
    marqueeLights: 3800,
  },

  photoshoot: { stillsPerHour: 750, videoPerHour: 1300, maxPax: 5 },

  cancellation: { over6mFlat: 15000 },

  fees: {
    lateCeremonyPerHour: 1000,
    extraSetupPerHour: 1000,
    kitchenEntry: 1000,
    externalAlcohol: 2000,
    lateCheckoutPerRoomHour: 1000,
  },

  accommodation: { maxRooms: 9, maxGuests: 18, lateCheckoutPerRoomHour: 1000 },
} as const;

export type Pricing = typeof PRICING;

/** Wedding years with published rates. Dates beyond → "price on request". */
export const CONFIGURED_YEARS = [2026, 2027];

/**
 * South African public holidays for the configured wedding years
 * (incl. observed days when a holiday falls on a Sunday).
 * TODO: extend when 2028 rates are published.
 */
export const SA_PUBLIC_HOLIDAYS: Record<number, string[]> = {
  2026: [
    '2026-01-01', '2026-03-21', '2026-04-03', '2026-04-06', '2026-04-27',
    '2026-05-01', '2026-06-16', '2026-08-09', '2026-08-10', '2026-09-24',
    '2026-12-16', '2026-12-25', '2026-12-26',
  ],
  2027: [
    '2027-01-01', '2027-03-21', '2027-03-26', '2027-03-29', '2027-04-27',
    '2027-05-01', '2027-06-16', '2027-08-09', '2027-09-24', '2027-12-16',
    '2027-12-25', '2027-12-26', '2027-12-27',
  ],
};

/** Human labels for inclusions, used by the package comparator + rate card. */
export const PACKAGE_INCLUSIONS = {
  weekend: {
    mealCourses: '4 courses — 4 canapés, plated starter, plated or buffet main, plated dessert',
    djIncluded: false,
    cakeIncluded: false,
    florals: 'In-house only (no external florists)',
    deposit: '50% of venue hire (non-refundable)',
    extras: [
      'Exclusive use of the estate',
      'Flavoured water bar',
      'Silver cutlery, glass underplates, mesh runners, vases & votives',
      'Beauty Room, Bridal Suite & Groom’s Suite day use',
      'Honeymoon suite overnight for 2',
      'Auto-start generator + coordinator 08h00–22h00',
      'Engagement shoot on the premises',
      'Decor & food meetings + final meeting',
      'Food Experience for 2',
      'Canapé area after closing (no music)',
      'Canapé kit (1 waiter / 24 guests, 1 barman / 60)',
      'Ceremony kit (arch, registry table, Tiffany chairs, confetti stands)',
      'Reception kit (tables, ghost chairs, sound system, podium, cake plinth)',
    ],
  },
  topUp: {
    extras: [
      'Iced tea (summer) or hot-chocolate station (winter) on arrival',
      'Frozen mimosa (summer) or glühwein (winter) at canapés',
      'Harvest table or extra canapés',
      'Sorbet',
      'Choice of 2 mains (RSVP selection)',
      'Nespresso / hot-drinks station',
      'Late-night snacks (half guest count)',
    ],
  },
  weekday: {
    mealCourses: '3-course plated meal',
    djIncluded: true,
    cakeIncluded: true,
    florals: 'Selected decor included; florals in-house only',
    deposit: '25% of package (non-refundable)',
    extras: [
      'Venue hire + 3-course plated meal',
      'Flavoured water bar',
      '1-tier semi-naked cake',
      'Sparkling wine for toasts (2 bottles per 10 guests)',
      'DJ & sound system',
      'Selected decor + dry mock-up',
      'Beauty Room, Bridal Suite & Groom’s Suite day use',
      'Honeymoon suite overnight for 2',
      'Generator + coordinator until 22h00',
      'Engagement shoot on the premises',
      'Decor & final meetings',
      'Canapé area after closing (no music)',
    ],
  },
} as const;
