/**
 * THE LAKESIDE — site identity & canonical NAP.
 * One canonical name/address/phone/email, used everywhere (UI, schema, footer).
 */

/**
 * This deployment is a CONCEPT DEMO by Carter Digitals — it is noindex and
 * every canonical/OG URL points here, not at the live domain.
 * TODO(CLIENT): switch `url` back to https://thelakeside.co.za at launch.
 */
export const SITE = {
  name: 'The Lakeside',
  tagline: 'Weddings & Events',
  concept: 'Where Glass Meets Lake',
  domain: 'the-lakeside.vercel.app',
  url: 'https://the-lakeside.vercel.app',
  phoneDisplay: '+27 67 962 1014',
  phoneE164: '+27679621014',
  whatsappE164: '27679621014', // TODO(CLIENT): confirm the number is WhatsApp-enabled
  emailViewings: 'hello@thelakeside.co.za',
  emailContracts: 'info@thelakeside.co.za', // TODO(CLIENT): pick one canonical public email
  address: {
    street: '379 Tiegerpoort Road (Plot 379)',
    area: 'Tiegerpoort / Tierpoort, Pretoria East',
    country: 'South Africa',
  },
  // TODO(CLIENT): confirm exact coordinates & postcode
  geo: { lat: -25.849, lng: 28.246 }, // approximate Tiegerpoort — confirm before publishing
  social: {
    instagram: 'https://www.instagram.com/thelakesidevenue',
    instagramHandle: '@thelakesidevenue',
    tiktok: 'https://www.tiktok.com/@thelakesideweddings',
    facebook: 'https://www.facebook.com/TheLakesideVenue',
  },
  /**
   * Rating shown ONLY while verified and fresh. Two gates must both pass:
   *  - `show` (the client has confirmed the numbers), and
   *  - `checkedAt` no older than RATING_MAX_AGE_DAYS — staleness hides the
   *    badge automatically, so a stale "4.8" can never quietly linger.
   * No AggregateRating structured data — the badge is visual proof only.
   */
  rating: {
    value: 4.8,
    count: 390,
    source: 'Google',
    checkedAt: '2026-10-12', // checked by the review on 12 Oct 2026
    show: true,
    // TODO(CLIENT): add the Google Business Profile URL here to make the badge clickable
    profileUrl: '',
  },
  owners: [
    { name: 'Penelope', role: 'Owner & Decor Specialist' },
    { name: 'Callie', role: 'Owner & Wedding Specialist' },
    { name: 'Chef Jenna', role: 'Lady of Delectable Delights' },
    { name: 'Adam', role: 'Bar Manager & Event Coordinator' },
    { name: 'Abi', role: 'Event Coordinator & Decor Specialist' },
    { name: 'Kaye', role: 'Event Coordinator & Food Manager' },
  ],
} as const;

/** A rating older than this is hidden automatically — stale proof is no proof. */
export const RATING_MAX_AGE_DAYS = 60;

/**
 * Freshness gate, evaluated once at module load. A stray boundary crossing
 * between SSR and hydration is theoretically possible but practically
 * irrelevant (a sub-second window every 60 days); both sides recompute the
 * same constant otherwise.
 */
export const RATING_FRESH =
  SITE.rating.show &&
  Date.now() - new Date(`${SITE.rating.checkedAt}T00:00:00Z`).getTime() <
    RATING_MAX_AGE_DAYS * 86_400_000;

export const WA_LINK = (context: string) =>
  `https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent(context)}`;
