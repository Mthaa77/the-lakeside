import { SITE } from '@/config/site';
import { PRICING } from '@/config/pricing';
import { FAQS } from '@/content/faqs';
import { Header } from '@/components/lakeside/header';
import { Hero } from '@/components/lakeside/hero';
import { Welcome } from '@/components/lakeside/welcome';
import { FilmStrip } from '@/components/lakeside/film-strip';
import { ProofPillars } from '@/components/lakeside/proof-pillars';
import { WeddingsPricing } from '@/components/lakeside/weddings-pricing';
import GalleryCarousel from '@/components/lakeside/gallery-carousel';
import EstateExplorer from '@/components/lakeside/estate-explorer';
import { ChefAccommodation } from '@/components/lakeside/stories';
import { FaqRules } from '@/components/lakeside/faq-rules';
import { Visit } from '@/components/lakeside/visit';
import { Footer } from '@/components/lakeside/footer';
import { QuoteNudge } from '@/components/lakeside/quote-nudge';
import { SharedQuote } from '@/components/lakeside/shared-quote';
import { BackToTop } from '@/components/lakeside/back-to-top';
import { TeamDigest } from '@/components/lakeside/team-digest';
import { RippleDivider } from '@/components/lakeside/ripple-divider';
import { OrnamentRule } from '@/components/lakeside/ornament-rule';
import { ConsentNotice } from '@/components/lakeside/consent-notice';
import { PrivacyNotice } from '@/components/lakeside/privacy';
import { PackageComparator, ProposalBuilder } from '@/components/lakeside/tools';
import { Reveal } from '@/components/lakeside/reveal';
import { CinematicInterlude } from '@/components/lakeside/cinematic-interlude';
import { FloatingDock, MobileDock } from '@/components/lakeside/floating-dock';
import { OrnamentDivider, Rings } from '@/components/lakeside/ornaments';
import { ArrowRight } from 'lucide-react';

function structuredData() {
  const year = new Date().getFullYear() >= 2027 ? 2027 : 2026;
  return {
    '@context': 'https://schema.org',
    '@type': 'EventVenue',
    name: 'The Lakeside — Weddings & Events',
    alternateName: 'The Lakeside',
    url: SITE.url,
    telephone: SITE.phoneDisplay,
    email: SITE.emailViewings,
    image: [`${SITE.url}/img/LS-016.webp`, `${SITE.url}/img/LS-067.webp`, `${SITE.url}/img/LS-071.webp`],
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: 'Pretoria East',
      addressRegion: 'Gauteng',
      addressCountry: 'ZA',
    },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    maximumAttendeeCapacity: PRICING.capacity.max,
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Glass chapel', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'On-site accommodation', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Backup generator', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Wildlife grounds', value: true },
    ],
    sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.social.tiktok],
    // TODO(CLIENT): verified coordinates + openingHoursSpecification before launch
    offers: {
      '@type': 'Offer',
      name: 'Weekend wedding venue hire',
      price: PRICING.venueHire.sat,
      priceCurrency: 'ZAR',
      valueAddedTaxIncluded: true,
      url: `${SITE.url}/#pricing`,
      description: `Saturday venue hire ${year}. Food & decor ${PRICING.years[year].foodDecorPP} per guest. VAT included.`,
    },
  } as const;
}

function faqStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } as const;
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-marble-50">
      <a
        href="#pricing"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-pine-900 focus:px-5 focus:py-2.5 focus:text-marble-50"
      >
        Skip to pricing
      </a>

      <Header />

      <main className="flex-1">
        <Hero />
        <Welcome />
        <FilmStrip />
        <ProofPillars />
        <WeddingsPricing />

        {/* Package comparator */}
        <section id="compare" aria-label="Compare wedding packages" className="relative bg-marble-50">
          <div aria-hidden="true" className="champagne-wash pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
            <Reveal variant="cine" className="mx-auto mb-10 max-w-2xl text-center">
              <OrnamentDivider tone="brass" center="rings" className="mb-7" />
              <p className="eyebrow eyebrow-dash text-brass-600">One estate, two ways</p>
              <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900">
                Weekend or weekday — the{' '}
                <em className="gold-gradient-text gold-gradient-text--deep gold-gradient-text--live">honest maths</em>
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
                Same estate, same care. Choose a date and a guest count and watch both
                packages price themselves — the differences on the table, never buried.
              </p>
            </Reveal>
            <PackageComparator />
          </div>
        </section>

        {/* Brass ornament in the marble seam between comparator and gallery */}
        <OrnamentRule className="bg-marble-50" />

        {/* Marble dips into the dark gallery theatre */}
        <RippleDivider from="bg-marble-50" to="bg-pine-900" />

        {/* Gallery — a dark theatre for the 3D salon carousel */}
        <section id="gallery" aria-label="Gallery — the glass atrium" className="relative overflow-hidden bg-pine-900">
          <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -top-32 left-1/2 h-96 w-[70vw] max-w-4xl -translate-x-1/2 opacity-50" />
          <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute bottom-0 left-0 h-80 w-80 opacity-25" />
          <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute bottom-0 right-0 h-80 w-80 opacity-25" />
          <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8 lg:pt-28">
            <Reveal variant="cine" className="mx-auto max-w-2xl text-center">
              <div aria-hidden="true" className="mb-6 flex justify-center">
                <Rings className="h-7 w-auto text-gold-300 drop-shadow-[0_2px_10px_rgba(222,184,110,0.45)]" />
              </div>
              <p className="eyebrow eyebrow-dash text-gold-300">The glass atrium</p>
              <h2 className="mt-3 font-display text-4xl font-medium text-balance text-marble-50 sm:text-5xl">
                Wander the{' '}
                <em className="gold-gradient-text gold-gradient-text--live">gallery</em>
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-marble-50/80">
                A salon wall that spins — drag, flick or arrow through every frame
                shot on the estate. Click a frame to step inside.
              </p>
            </Reveal>
          </div>
          <GalleryCarousel />
        </section>

        {/* Estate explorer */}
        <section id="explore" aria-label="Explore the estate" className="bg-pine-900">
          <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8 lg:pt-28">
            <Reveal variant="cine" className="mx-auto max-w-2xl text-center">
              <p className="eyebrow eyebrow-dash text-brass-400">The grounds, the light, the flow</p>
              <h2 className="mt-3 font-display text-4xl font-medium text-balance text-marble-50 sm:text-5xl">
                Walk the estate,{' '}
                <em className="gold-gradient-text gold-gradient-text--live">space by space</em>
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-marble-50/80">
                Tap a hotspot to meet each room, shift the time of day, and plan
                your seating — the numbers then walk straight into your estimate.
              </p>
            </Reveal>
          </div>
          <EstateExplorer />
        </section>

        <ChefAccommodation />

        {/* Cinematic interlude — full-bleed golden-hour parallax cut into the proposals band */}
        <CinematicInterlude />

        {/* Proposal builder — dark band */}
        <section id="proposals" aria-label="Plan a proposal" className="relative overflow-hidden bg-pine-800">
          <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -top-28 left-1/2 h-80 w-[64vw] max-w-4xl -translate-x-1/2 opacity-30" />
          <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -bottom-28 left-0 h-80 w-80 opacity-20" />
          <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -bottom-28 right-0 h-80 w-80 opacity-20" />
          <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-32">
            <Reveal variant="cine" className="mx-auto mb-10 max-w-2xl text-center">
              <OrnamentDivider tone="gold" center="rings" className="mb-7" />
              <p className="eyebrow eyebrow-dash text-brass-400">Before the wedding</p>
              <h2 className="mt-3 font-display text-4xl font-medium text-balance text-marble-50">
                First,{' '}
                <em className="gold-gradient-text gold-gradient-text--live">the question</em>.
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-marble-50/80">
                A private hour on the estate — the deck, the glass chapel or the marble pavilion —
                planned to the last petal.
              </p>
            </Reveal>
            <ProposalBuilder />
          </div>
        </section>

        <FaqRules />

        {/* CTA band — the marble reception glowing behind gilded type */}
        <section aria-label="Ready to see it in person" className="relative overflow-hidden bg-pine-900">
          <img
            src="/img/LS-071-s.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[50%_28%] opacity-35"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-pine-900 via-pine-900/85 to-pine-900/35" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-pine-900 via-transparent to-pine-900/70" />
          <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -left-20 bottom-0 h-72 w-72 opacity-40" />
          <div aria-hidden="true" className="gold-bloom pointer-events-none absolute right-0 top-0 h-72 w-96 opacity-40" />
          <div className="band-sheen" aria-hidden="true" />
          <div className="frame-corners relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <span className="fc-b absolute inset-0" aria-hidden="true" />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <Reveal variant="cine">
                <div aria-hidden="true" className="mb-4 flex items-center gap-3">
                  <Rings className="h-6 w-auto text-gold-300/90 drop-shadow-[0_2px_8px_rgba(222,184,110,0.4)]" />
                  <span className="h-px w-16 bg-gradient-to-r from-gold-300/60 to-transparent" />
                </div>
                <p className="eyebrow eyebrow-dash text-gold-300">Saturdays book seasons ahead</p>
                <h2 className="mt-2 font-display text-3xl font-medium text-balance text-marble-50 sm:text-4xl">
                  Is <em className="gold-ruby-gradient-text">your Saturday</em> still free?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-marble-50/85">
                  Weekend dates open a season ahead and go quickly; weekdays are
                  quieter, softer on the budget, every bit as golden. Run your
                  numbers above — then come stand in the chapel.
                </p>
              </Reveal>
              <Reveal delay={100} className="flex shrink-0 flex-wrap gap-3">
                <a
                  href="#pricing"
                  className="btn-shine gold-surface inline-flex min-h-[48px] items-center gap-2 rounded-full px-7 text-base font-semibold"
                >
                  Find your date <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="#visit"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-gold-300/50 bg-white/5 px-7 text-base font-medium text-marble-50 backdrop-blur transition-colors hover:border-gold-300/80 hover:bg-white/15"
                >
                  Book a viewing
                </a>
              </Reveal>
            </div>
          </div>
        </section>

        <Visit />
        <PrivacyNotice />
      </main>

      <QuoteNudge />
      <ConsentNotice />
      <SharedQuote />
      <BackToTop />
      <TeamDigest />
      <Footer />
      <MobileDock />
      <FloatingDock />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData()) }}
      />
    </div>
  );
}
