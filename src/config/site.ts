/**
 * THE LAKESIDE — site identity & canonical NAP.
 * One canonical name/address/phone/email, used everywhere (UI, schema, footer).
 */

export const SITE = {
  name: 'The Lakeside',
  tagline: 'Weddings & Events',
  concept: 'Where Glass Meets Lake',
  domain: 'thelakeside.co.za',
  url: 'https://thelakeside.co.za',
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
  /** Rating shown ONLY while verified and fresh. checkedAt older than 60 days → hide. */
  rating: {
    value: 4.8,
    count: 390,
    source: 'Google',
    // TODO(CLIENT): verify live rating before launch; update checkedAt when verified.
    checkedAt: '2026-10-01',
    show: false, // false until the client verifies — never publish unverified proof
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

export const WA_LINK = (context: string) =>
  `https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent(context)}`;
