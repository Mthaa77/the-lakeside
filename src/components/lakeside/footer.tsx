'use client';

/**
 * THE LAKESIDE — FOOTER (round 23: "the clubhouse lobby", v2)
 * Clean and architectural: flat deep pine, one crisp gold seam with the
 * rings medallion straddling it, typographic LogoMark, four tidy columns
 * (Brand / Explore / Celebrate / Contact) and a legal bar with back-to-top.
 * No blurry gradients — the depth comes from structure and hairlines.
 * Footer is sticky-bottom friendly (mt-auto in the page shell); pb-28
 * clears the MobileDock. (Mobile bar became the MobileDock, r18.)
 */

import { SITE, RATING_FRESH } from '@/config/site';
import { Instagram, Facebook, MapPin, Phone, Mail, Clock, ArrowUp } from 'lucide-react';
import { Rings } from './ornaments';
import { LogoMark } from './logo';
import { RatingBadge } from './rating-badge';

const EXPLORE_LINKS = [
  { label: 'The estate', href: '#estate' },
  { label: 'Check your date', href: '#date' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'FAQ & rules', href: '#faq' },
  { label: 'Privacy & POPIA', href: '#privacy' },
];

const CELEBRATE_LINKS = [
  { label: 'Weddings & pricing', href: '#pricing' },
  { label: 'Proposals', href: '#proposals' },
  { label: 'The Food Experience', href: '#chef' },
  { label: 'Stay the night', href: '#stay' },
  { label: 'Estate map', href: '#explore' },
  { label: 'Book a viewing', href: '#visit' },
];

const SOCIALS = [
  { label: 'The Lakeside on Instagram', href: SITE.social.instagram, icon: Instagram },
  { label: 'The Lakeside on Facebook', href: SITE.social.facebook, icon: Facebook },
  { label: 'The Lakeside on TikTok', href: 'https://www.tiktok.com/@thelakesideweddings', icon: null },
];

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <a
        href={href}
        className="group flex items-center gap-2.5 py-1.5 text-sm text-marble-50/70 transition-colors hover:text-gold-300"
      >
        <span
          aria-hidden="true"
          className="size-[5px] shrink-0 rotate-45 ring-1 ring-brass-400/50 transition-colors duration-200 group-hover:bg-gold-300 group-hover:ring-gold-300"
        />
        {label}
      </a>
    </li>
  );
}

export function Footer() {
  const ratingFresh = RATING_FRESH; // show + checked within 60 days — stale proof hides itself

  return (
    <footer className="relative bg-pine-950 text-marble-50">
      {/* The gold seam — one crisp hairline, medallion straddling it */}
      <div aria-hidden="true" className="relative">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-300/60 to-transparent" />
        <div className="mx-auto -mt-[26px] flex max-w-7xl justify-center px-4">
          <span className="grid size-[52px] place-items-center rounded-full bg-pine-950 shadow-[inset_0_0_0_1px_rgba(237,214,164,0.35)]">
            <Rings className="h-6 w-auto text-gold-300" />
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-12 sm:px-6 lg:px-8 lg:pb-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <LogoMark variant="dark" className="text-[10px]" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-marble-50/65">
              A family-run wedding and events estate in Tiegerpoort, Pretoria East.
              Where glass meets lake — and your guests meet the zebras.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((s) => {
                const inner = s.icon ? (
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <span className="text-[10px] font-semibold tracking-[0.08em]">TT</span>
                );
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex size-10 items-center justify-center rounded-full text-marble-50/70 ring-1 ring-gold-300/30 transition-all duration-300 hover:bg-gold-300/10 hover:text-gold-300 hover:ring-gold-300/70"
                  >
                    {inner}
                  </a>
                );
              })}
            </div>
            {ratingFresh && (
              <div className="mt-5">
                <RatingBadge tone="dark" />
              </div>
            )}
          </div>

          {/* Explore */}
          <nav aria-label="Footer — explore" className="lg:col-span-2">
            <h2 className="eyebrow text-gold-300">Explore</h2>
            <ul className="mt-4">
              {EXPLORE_LINKS.map((l) => (
                <FooterLink key={l.href} {...l} />
              ))}
            </ul>
          </nav>

          {/* Celebrate */}
          <nav aria-label="Footer — celebrate" className="lg:col-span-3">
            <h2 className="eyebrow text-gold-300">Celebrate with us</h2>
            <ul className="mt-4">
              {CELEBRATE_LINKS.map((l) => (
                <FooterLink key={l.href} {...l} />
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h2 className="eyebrow text-gold-300">Contact</h2>
            <address className="mt-4 space-y-3 text-sm not-italic leading-relaxed text-marble-50/70">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass-400" aria-hidden="true" />
                <span>{SITE.address.street}<br />{SITE.address.area}</span>
              </p>
              <p className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brass-400" aria-hidden="true" />
                <a href={`tel:${SITE.phoneE164}`} className="transition-colors hover:text-gold-300">{SITE.phoneDisplay}</a>
              </p>
              <p className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brass-400" aria-hidden="true" />
                <a href={`mailto:${SITE.emailViewings}`} className="transition-colors hover:text-gold-300">{SITE.emailViewings}</a>
              </p>
              <p className="flex gap-3 text-xs text-marble-50/50">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brass-400/80" aria-hidden="true" />
                <span>Viewings by appointment only · Estate hours 13h00–24h00 (22h00 Sun &amp; weekdays)</span>
              </p>
            </address>
          </div>
        </div>

        {/* Legal bar */}
        <div className="brass-hairline mt-12" />
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs text-marble-50/50 sm:flex-row">
          <p>© {new Date().getFullYear()} The Lakeside — Weddings &amp; Events. All rights reserved.</p>
          <p className="flex flex-wrap items-center justify-center gap-4">
            <a href="#privacy" className="underline-offset-2 transition-colors hover:text-gold-300 hover:underline">
              Privacy &amp; POPIA
            </a>
            <span aria-hidden="true">·</span>
            <span>Prices include VAT</span>
            <span aria-hidden="true">·</span>
            {/* TODO(CLIENT): host the signed T&Cs PDF and link it here */}
            <span>Full T&amp;Cs provided with every booking</span>
            <a
              href="#top"
              className="group ml-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ring-gold-300/25 transition-colors hover:text-gold-300 hover:ring-gold-300/60"
            >
              Top
              <ArrowUp className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
            </a>
          </p>
        </div>
        <p className="mt-4 border-t border-white/[0.06] pt-4 text-center text-[10.5px] leading-relaxed text-marble-50/40">
          Concept demo prepared by Carter Digitals. Not the official The Lakeside website.
          Prices and details to be confirmed by The Lakeside.
        </p>
      </div>
    </footer>
  );
}
