/**
 * THE LAKESIDE — FAQ SOURCE OF TRUTH
 * Shared by the FAQ section (client search) and the FAQPage JSON-LD
 * (page.tsx). Answers come from the venue T&Cs — never invent.
 * TODO(CLIENT): sign-off on wording before launch.
 */

export type Faq = { q: string; a: string; cat: string };

export const FAQ_CATS = [
  'All',
  'Booking',
  'Payments',
  'Guests',
  'Suppliers',
  'Stay',
  'Practical',
  'Visiting',
] as const;

export const FAQS: Faq[] = [
  {
    q: 'How do we secure our date?',
    a: 'A booking is confirmed by the signed T&Cs plus proof of payment (EFT) of the deposit: 50% of venue hire on weekends, or 25% of the package on weekdays. The deposit is non-refundable.',
    cat: 'Booking',
  },
  {
    q: 'What is the payment schedule?',
    a: 'Weekends: 50% of venue hire to book; the remaining 50% at 6 months; 50% of catering & decor at 3 months; the balance plus the R10,000 refundable breakage deposit and the named guest list at 1 month. Weekdays: 25% to book, a further 25% at 6 months, balance at 1 month. Bookings inside one month are paid in full immediately.',
    cat: 'Payments',
  },
  {
    q: 'What happens if we cancel or postpone?',
    a: 'Per the signed T&Cs: more than 6 months out, a R15,000 cancellation fee applies; within 6 months, 100% of venue hire (up to 50% refunded if the date is re-booked for a similar function); within 3 months, 100% of venue hire plus 50% of food, decor and florals; within 1 month, 100% of the total invoice.',
    cat: 'Booking',
  },
  {
    q: 'How many guests can we invite?',
    a: 'The White Marble Reception holds 160 guests with a dance floor or 200 without. Minimum paying adults apply: 80 on Saturdays and public holidays, 60 on Fridays and the day before a public holiday, 40 on Thursdays and Sundays.',
    cat: 'Guests',
  },
  {
    q: 'Can we bring our own caterer, decorator or florist?',
    a: 'No — food, decor and florals are in-house only. This keeps the quality consistent and the day seamless. Photography, videography, DJ, hair, make-up and stationery are yours to choose.',
    cat: 'Suppliers',
  },
  {
    q: 'What are the DJ and music rules?',
    a: 'Your DJ must be SAMPRA-registered and use the venue sound system. Music plays at legal decibels, with a 22h00 curfew; live bands finish by 22:00.',
    cat: 'Suppliers',
  },
  {
    q: 'Is there accommodation on site?',
    a: 'Yes — 9 rooms sleeping up to 18 guests: Heritage House rooms, Manor House rooms, the Bridal Suite and Groom’s Cabin. Reserved exclusively for the wedding party; no breakfast served. Check-out is strictly 09h00.',
    cat: 'Stay',
  },
  {
    q: 'Are children welcome?',
    a: 'Yes. Children under 12 are R380 (2026) or R400 (2027) each and receive canapés, a kids’ main and dessert.',
    cat: 'Guests',
  },
  {
    q: 'What happens with load-shedding?',
    a: 'The estate runs an auto-start backup generator. Your timeline, kitchen and sound are never affected.',
    cat: 'Practical',
  },
  {
    q: 'What about weather?',
    a: 'The glass chapel is all-season: stacking doors close against the winter chill and open to the summer breeze, and the reception is indoors over the water.',
    cat: 'Practical',
  },
  {
    q: 'Is the venue safe with wild animals?',
    a: 'Zebra, sable, gemsbok, waterbuck, golden wildebeest and emus roam the lawns. Guests love them. For their safety and the animals’: no glass outside the venue, no railings at the water, no swimming, and feeding only with the provided animal feed.',
    cat: 'Practical',
  },
  {
    q: 'Can we visit before booking?',
    a: 'Yes — viewings are by appointment, in person or virtual. Book below and we’ll confirm a time. You can also start on WhatsApp.',
    cat: 'Visiting',
  },
  {
    q: 'Do you have winter specials?',
    a: 'June, July and August carry Winter Specials — contact us directly for the season’s numbers. The glass chapel’s stacking doors close up cozy and the marble reception is indoors over the water, so winter weddings are beautiful here.',
    cat: 'Booking',
  },
];
