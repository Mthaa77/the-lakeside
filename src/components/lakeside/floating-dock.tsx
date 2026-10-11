'use client';

/**
 * THE LAKESIDE — FLOATING DOCK (round 18, new)
 * Two flavours of one premium dock:
 * - FloatingDock (desktop, lg+): a glass-and-gold pill that rises after the
 *   hero, with macOS-style magnification (framer-motion spring scales driven
 *   by pointer distance), scroll-spy active state, tooltips, a WhatsApp slot
 *   with a ruby "message us" dot and a glossy gold "Check a date" CTA.
 * - MobileDock (mobile, <lg): a floating light-glass pill that replaces the
 *   old full-width action bar — gold-rimmed, with a raised gold WhatsApp FAB.
 * Both honour the safe-area inset and stay clear of QuoteNudge / BackToTop.
 */

import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Images,
  Landmark,
  Map,
  MessageCircle,
  Phone,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { SITE } from '@/config/site';
import { cn } from '@/lib/utils';

type DockItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: DockItem[] = [
  { id: 'estate', label: 'The estate', href: '#estate', icon: Landmark },
  { id: 'pricing', label: 'Pricing', href: '#pricing', icon: Receipt },
  { id: 'estimate', label: 'Estimate', href: '#estimate', icon: CalendarCheck },
  { id: 'gallery', label: 'Gallery', href: '#gallery', icon: Images },
  { id: 'explore', label: 'Estate map', href: '#explore', icon: Map },
  { id: 'visit', label: 'Visit us', href: '#visit', icon: CalendarDays },
];

/** Section id → dock item id (mirrors the header's scroll-spy mapping). */
const SECTION_TO_DOCK: Record<string, string> = {
  estate: 'estate',
  weddings: 'pricing',
  pricing: 'pricing',
  estimate: 'estimate',
  estimator: 'estimate',
  compare: 'pricing',
  gallery: 'gallery',
  explore: 'explore',
  chef: 'explore',
  stay: 'explore',
  events: 'explore',
  proposals: 'pricing',
  faq: 'visit',
  visit: 'visit',
};

// ── Desktop dock ─────────────────────────────────────────────────────────────

function MagnifyItem({
  item,
  mouseX,
  active,
}: {
  item: DockItem;
  mouseX: MotionValue<number>;
  active: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();

  const distance = useTransform(mouseX, (x: number) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return 9999;
    return x - bounds.x - bounds.width / 2;
  });
  const scale = useTransform(distance, [-130, 0, 130], [1, 1.38, 1]);
  const y = useTransform(distance, [-130, 0, 130], [0, -11, 0]);

  const Icon = item.icon;

  return (
    <motion.a
      ref={ref}
      href={item.href}
      aria-label={item.label}
      aria-current={active ? 'true' : undefined}
      style={reduced ? undefined : { scale, y }}
      className={cn(
        'group relative grid size-11 place-items-center rounded-full transition-colors duration-200',
        active
          ? 'bg-gradient-to-b from-gold-300/30 to-ruby-500/25 text-gold-200 shadow-[inset_0_0_0_1px_rgba(237,214,164,0.45)]'
          : 'text-marble-50/80 hover:bg-white/10 hover:text-gold-200'
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      {/* Tooltip */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold-300/30 bg-[#0b1a15]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-200 opacity-0 shadow-lg transition-all duration-200 group-hover:-top-11 group-hover:opacity-100"
      >
        {item.label}
      </span>
      {/* Active dot */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-300 to-ruby-400 transition-opacity duration-200',
          active ? 'opacity-100' : 'opacity-0'
        )}
      />
    </motion.a>
  );
}

export function FloatingDock() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState('');
  const mouseX = useMotionValue(Infinity);
  const reduced = useReducedMotion();

  // Rise after the hero has mostly scrolled away; bow out near the page end
  // so the footer's legal line stays readable.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const nearEnd = max > 0 && y >= max - 220;
        setVisible(y > window.innerHeight * 0.65 && !nearEnd);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Scroll-spy (same band as the header so the two never disagree).
  useEffect(() => {
    const ids = Object.keys(SECTION_TO_DOCK);
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
          const nav = SECTION_TO_DOCK[visible.target.id] ?? visible.target.id;
          setActive((prev) => (prev === nav ? prev : nav));
        }
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.1, 0.25] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          aria-label="Floating dock — quick sections and actions"
          initial={reduced ? false : { opacity: 0, y: 64, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? undefined : { opacity: 0, y: 64, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="dock-glass fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 items-end gap-1 rounded-2xl px-2.5 py-2 lg:flex"
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
        >
          {NAV_ITEMS.map((item) => (
            <MagnifyItem key={item.id} item={item} mouseX={mouseX} active={active === item.id} />
          ))}

          <span aria-hidden="true" className="mx-1 h-8 w-px self-center bg-gradient-to-b from-transparent via-gold-300/50 to-transparent" />

          {/* WhatsApp slot with ruby attention dot */}
          <a
            href={`https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent("Hi Lakeside! I'm planning my wedding and would like to know more.")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="group relative grid size-11 place-items-center rounded-full text-marble-50/80 transition-colors hover:bg-white/10 hover:text-gold-200"
          >
            <MessageCircle className="size-[18px]" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="wax-dot absolute right-1 top-1 size-2"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold-300/30 bg-[#0b1a15]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-200 opacity-0 shadow-lg transition-all duration-200 group-hover:-top-11 group-hover:opacity-100"
            >
              WhatsApp
            </span>
          </a>

          {/* Glossy gold CTA */}
          <a
            href="#pricing"
            className="btn-shine gold-surface ml-1 inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold tracking-wide"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Check a date
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

// ── Mobile dock ──────────────────────────────────────────────────────────────

export function MobileDock() {
  return (
    <nav
      aria-label="Quick actions"
      className="dock-glass--light fixed inset-x-3 bottom-3 z-40 rounded-2xl pb-safe lg:hidden"
    >
      <div className="grid grid-cols-4 items-center px-2">
        <a
          href="#pricing"
          className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-pine-900 transition-colors active:text-ruby-600"
        >
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-semibold tracking-wide">Check date</span>
        </a>

        <a
          href={`tel:${SITE.phoneE164}`}
          className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-pine-900 transition-colors active:text-ruby-600"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-semibold tracking-wide">Call</span>
        </a>

        {/* Raised gold WhatsApp FAB */}
        <a
          href={`https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent("Hi Lakeside! I'm planning my wedding and would like to know more.")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="relative -mt-5 justify-self-center"
        >
          <span className="gold-surface grid size-14 place-items-center rounded-full">
            <MessageCircle className="size-6" aria-hidden="true" />
          </span>
          <span aria-hidden="true" className="wax-dot absolute right-0.5 top-0.5" />
        </a>

        <a
          href="#gallery"
          className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-pine-900 transition-colors active:text-ruby-600"
        >
          <Images className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-semibold tracking-wide">Gallery</span>
        </a>
      </div>
    </nav>
  );
}
