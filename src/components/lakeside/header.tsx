'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — HEADER (round 21: "the gilded bar")
 * ─────────────────────────────────────────────────────────────────────────────
 * A three-part navbar:
 *   1. a slim booking-wire announcement strip (collapses on scroll),
 *   2. the main bar — gold-ringed brand medallion, centre nav with diamond
 *      separators and a centre-out gold underline, gilded CTA,
 *   3. the reading-progress hairline in gold→ruby.
 *
 * Transparent over the hero; condenses into dark gilded glass (.navbar-glass)
 * on scroll — at home over both the pine theatre and the marble sections.
 *
 * The mobile menu remains a self-contained dialog instead of a Radix Sheet:
 * its `aria-controls` is a fixed string and the panel lives outside the
 * header element (so no transformed/filtered ancestor can hijack its fixed
 * positioning). Radix's dynamic `radix-*` ids shifted between the server
 * payload and the hydrated tree whenever the dev server hot-reloaded,
 * tripping React hydration warnings. With a static id there is nothing
 * left to mismatch.
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CalendarHeart,
  Church,
  Compass,
  Heart,
  Images,
  Menu,
  Phone,
  X,
} from 'lucide-react';
import { SITE } from '@/config/site';
import { PRICING } from '@/config/pricing';
import { Rings } from './ornaments';
import { LogoMark } from './logo';
import { DemoStrip } from './demo-strip';

const NAV = [
  { label: 'The Estate', href: '#estate', icon: Church },
  { label: 'Weddings', href: '#weddings', icon: Heart },
  { label: 'Pricing', href: '#pricing', icon: CalendarHeart },
  { label: 'Gallery', href: '#gallery', icon: Images },
  { label: 'Explore', href: '#explore', icon: Compass },
  { label: 'Contact', href: '#visit', icon: Phone },
] as const;

const MENU_ID = 'lakeside-mobile-menu';

/** 198000 → "198 000" — pure string ops, identical on server and client. */
function thin(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, y / max) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Scroll-spy: highlight the nav item for the section in view.
  // Every tracked section maps to a nav parent so the highlight never goes
  // stale on sections that have no nav entry of their own.
  useEffect(() => {
    const SECTION_TO_NAV: Record<string, string> = {
      estate: 'estate',
      weddings: 'weddings',
      pricing: 'pricing',
      estimate: 'pricing',
      estimator: 'pricing',
      compare: 'pricing',
      gallery: 'gallery',
      explore: 'explore',
      chef: 'explore',
      stay: 'explore',
      events: 'explore',
      proposals: 'weddings',
      faq: 'visit',
      visit: 'visit',
    };
    const ids = Object.keys(SECTION_TO_NAV);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const nav = SECTION_TO_NAV[visible.target.id] ?? visible.target.id;
          setActive((prev) => (prev === nav ? prev : nav));
        }
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.1, 0.25] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Mobile menu behaviour: body scroll lock, Escape to close, focus hand-off.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus({ preventScroll: true });
    }, 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  // Keep Tab cycling inside the open menu.
  const trapTab = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = document.activeElement;
    if (e.shiftKey && (current === first || current === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && current === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled
            ? 'navbar-glass'
            : 'bg-gradient-to-b from-pine-950/75 via-pine-950/25 to-transparent'
        )}
      >
        {/* ── Demo disclosure — dismissible, rides the fixed header; both it
            and the booking wire collapse away once the visitor scrolls ── */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-500',
            scrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'
          )}
        >
          <DemoStrip />
        </div>

        {/* ── Announcement wire — collapses away once the visitor scrolls ── */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-500',
            scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
          )}
        >
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-x-4 gap-y-0 px-4 text-[11px] font-medium tracking-wide text-gold-200/90 sm:gap-6">
            <span className="flex items-center gap-2">
              <span className="wax-dot size-[5px]" aria-hidden="true" />
              Now booking 2026 &amp; 2027
            </span>
            <span className="hidden h-3 w-px bg-gold-300/30 sm:block" aria-hidden="true" />
            <span className="hidden sm:block">
              Saturday venue hire R{thin(PRICING.venueHire.sat)} · from R{thin(PRICING.venueHire.monThu)} Mon–Thu
            </span>
            <span className="hidden h-3 w-px bg-gold-300/30 md:block" aria-hidden="true" />
            <span className="hidden md:block">Family-run</span>
          </div>
        </div>

        {/* ── Main bar ──────────────────────────────────────────────────── */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand — typographic lockup with a gold ring accent */}
          <a
            href="#top"
            className="group flex shrink-0 items-center gap-3"
            aria-label="The Lakeside — back to top"
          >
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-300/85 via-brass-500/55 to-ruby-400/40 p-[1.5px] shadow-[0_10px_28px_-12px_rgba(184,155,106,0.9)] transition-shadow duration-500 group-hover:shadow-[0_12px_34px_-10px_rgba(222,184,110,0.85)]"
            >
              <span className="grid h-full w-full place-items-center rounded-full bg-pine-950 font-display text-[13px] font-medium text-gold-300">
                TL
              </span>
            </span>
            <LogoMark
              variant="dark"
              className={cn(
                'hidden transition-all duration-500 sm:block',
                scrolled ? 'text-[7px]' : 'text-[8px]',
              )}
            />
          </a>

          {/* Desktop nav — diamond separators, centre-out gold underline */}
          <nav aria-label="Primary" className="hidden items-center lg:flex">
            {NAV.map((item, i) => {
              const isActive = active === item.href.slice(1);
              return (
                <span key={item.href} className="flex items-center">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mx-3 size-[5px] rotate-45 border transition-colors duration-300',
                        scrolled
                          ? 'border-brass-500/45'
                          : 'border-gold-300/40'
                      )}
                    />
                  )}
                  <a
                    href={item.href}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'group relative px-1 py-2 text-[13px] font-medium tracking-wide transition-colors',
                      scrolled
                        ? 'text-marble-100 hover:text-gold-300'
                        : 'text-marble-50 drop-shadow-[0_1px_6px_rgba(16,38,30,0.7)] hover:text-gold-200',
                      isActive && (scrolled ? 'text-gold-300' : 'text-gold-200')
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 -bottom-0.5 h-px origin-center bg-gradient-to-r from-transparent via-gold-300 to-transparent transition-transform duration-300',
                        isActive
                          ? 'scale-x-100 opacity-100'
                          : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'
                      )}
                    />
                  </a>
                </span>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={`tel:${SITE.phoneE164}`}
              aria-label={`Call ${SITE.phoneDisplay}`}
              className={cn(
                'hidden size-10 items-center justify-center rounded-full border transition-all duration-300 sm:flex',
                scrolled
                  ? 'border-gold-300/30 text-gold-300 hover:border-gold-300/70 hover:bg-white/5'
                  : 'border-white/25 text-marble-50 hover:border-gold-300/70 hover:text-gold-300'
              )}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <Button
              asChild
              className="btn-shine gold-surface hidden rounded-full px-5 font-semibold tracking-wide sm:inline-flex"
            >
              <a href="#pricing">
                <CalendarHeart className="mr-2 h-4 w-4" aria-hidden="true" />
                Check a date
              </a>
            </Button>

            {/* Mobile menu trigger — static aria wiring, no dynamic ids */}
            <button
              ref={triggerRef}
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={MENU_ID}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                'inline-flex size-11 items-center justify-center rounded-full border transition-colors lg:hidden',
                scrolled
                  ? 'border-gold-300/30 text-gold-300 hover:bg-white/5'
                  : 'border-white/25 text-marble-50 hover:border-gold-300/70 hover:text-gold-300'
              )}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Reading-progress hairline — gold → ruby */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
          <div
            className="h-full origin-left bg-gradient-to-r from-gold-300 via-brass-400 to-ruby-400 transition-transform duration-150 ease-out"
            style={{ transform: `scaleX(${progress})`, width: '100%' }}
          />
        </div>
      </header>

      {/* Mobile menu — self-contained dialog, sibling of the header so no
          ancestor can become its containing block. Always mounted but
          `inert` + off-canvas when closed: exit animations still play while
          the closed state stays invisible to pointers, focus and AT. */}
      <div
        id={MENU_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        onKeyDown={trapTab}
        className={cn(
          'fixed inset-0 z-[70] overflow-hidden lg:hidden',
          !open && 'pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className={cn(
            'absolute inset-0 bg-pine-950/70 backdrop-blur-sm transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Panel */}
        <div
          ref={panelRef}
          tabIndex={-1}
          className={cn(
            'absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto bg-gradient-to-b from-pine-900 via-pine-900 to-pine-950 shadow-[-24px_0_80px_-24px_rgba(0,0,0,0.55)] outline-none transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:w-[380px]',
            open ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* Ambient light inside the panel */}
          <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -right-20 -top-20 h-72 w-72 opacity-40" />
          <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -left-16 bottom-0 h-64 w-64 opacity-25" />

          {/* Top row: brand + close */}
          <div className="relative flex items-center justify-between px-6 pb-4 pt-5">
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-300/80 via-brass-500/50 to-ruby-400/40 p-[1.5px]"
              >
                <span className="grid h-full w-full place-items-center rounded-full bg-pine-950 font-display text-[13px] font-medium text-gold-300">
                  TL
                </span>
              </span>
              <LogoMark variant="dark" className="text-[7.5px]" />
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-marble-50 transition-colors hover:border-gold-300/60 hover:text-gold-300"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div aria-hidden="true" className="mx-6 h-px bg-gradient-to-r from-transparent via-gold-300/50 to-transparent" />

          {/* Links — icon medallions, staggered rise when the menu opens */}
          <nav aria-label="Mobile" className="relative flex-1 px-6 py-5">
            {NAV.map((item, i) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: open ? `${140 + i * 55}ms` : '0ms' }}
                  className={cn(
                    'group flex items-center gap-4 border-b border-white/10 py-4 text-marble-50 transition-[opacity,transform] duration-500',
                    open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold-300/25 bg-white/5 text-gold-300 transition-colors group-hover:border-gold-300/70 group-hover:text-gold-200">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="font-display text-[22px] leading-none transition-colors group-hover:text-gold-300">
                    {item.label}
                  </span>
                  <span className="eyebrow ml-auto text-brass-400/80">0{i + 1}</span>
                </a>
              );
            })}
          </nav>

          {/* Rings signature */}
          <div aria-hidden="true" className="relative flex justify-center pb-1">
            <Rings className="h-7 w-auto text-gold-300/80" />
          </div>

          {/* CTAs + NAP footer */}
          <div className="relative space-y-3 px-6 pb-8 pt-2">
            <Button
              asChild
              className="gold-surface btn-shine w-full rounded-full py-6 text-pine-950 hover:brightness-110"
            >
              <a href="#pricing" onClick={() => setOpen(false)}>
                <CalendarHeart className="mr-2 h-4 w-4" aria-hidden="true" />
                Check a date
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full border-white/25 bg-transparent py-6 text-marble-50 hover:bg-white/10 hover:text-marble-50"
            >
              <a href={`tel:${SITE.phoneE164}`} onClick={() => setOpen(false)}>
                <Phone className="mr-2 h-4 w-4" aria-hidden="true" />
                Call {SITE.phoneDisplay}
              </a>
            </Button>
            <p className="pt-2 text-center text-xs leading-relaxed text-marble-50/60">
              {SITE.address.street} · Pretoria East
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
