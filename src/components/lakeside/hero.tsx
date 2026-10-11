'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — HERO (round 24: "the living front page")
 * ─────────────────────────────────────────────────────────────────────────────
 * Round 24: the backdrop is now a film. A 10-second, muted, seamlessly
 * looping shot of the estate at dusk (generated from the poster frame
 * itself — first frame == last frame == LS-016) plays behind the same
 * editorial composition. The three-frame ken-burns reel is kept as the
 * fallback layer: it is what paints first (LCP), and it stays if the
 * visitor prefers reduced motion or if autoplay is blocked. The film is
 * armed only after the page's `load` event so it never races the poster.
 *
 * Everything round 21 established still holds:
 *  - no scroll-linked animation; time-based cinema only,
 *  - gilded inset frame, rings ornament, circular seal, film grain,
 *  - champagne warmth pool + gold top scrim seating the gilded navbar.
 */

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Compass,
  Search,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PRICING } from '@/config/pricing';
import { CircularSeal, CornerMarks, Rings } from './ornaments';

/** Hero reel frames — 01 stays first for LCP; the rest load at low priority. */
const FRAMES = [
  {
    src: '/img/LS-016.webp',
    alt: 'The Lakeside estate at dusk: the glass chapel and the white gabled reception pavilion reflected in the still lake',
    slate: '01 · Dusk on the lake',
  },
  {
    src: '/img/LS-067.webp',
    alt: '',
    slate: '02 · Under the glass',
  },
  {
    src: '/img/LS-073.webp',
    alt: '',
    slate: '03 · Golden hour',
  },
] as const;

const REEL_MS = 7400;
const REEL_START_DELAY_MS = 2800;

/** The hero film — muted, seamless loop; first frame == the poster frame. */
const HERO_VIDEO_SRC = '/video/lakeside-hero.mp4';
/** Delay after `load` before the film starts fetching (poster wins LCP). */
const VIDEO_ARM_DELAY_MS = 900;

/** 198000 → "198 000" — pure string ops, identical on server and client. */
function thin(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
}

export function Hero() {
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('100');
  const [scrolled, setScrolled] = useState(false);
  const [frame, setFrame] = useState(0);
  const [barsOpen, setBarsOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoActive, setVideoActive] = useState(false);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reelInView = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoProgressRef = useRef<HTMLDivElement>(null);

  // Honour prefers-reduced-motion without framer-motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Scroll cue fades out once the visitor starts moving (rAF-throttled).
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 60));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Headline + content entrance reveal.
  useEffect(() => {
    const reveal = () => {
      headlineRef.current?.classList.add('revealed');
      contentRef.current?.querySelectorAll('.reveal').forEach((el) => el.classList.add('revealed'));
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      return;
    }
    const raf = requestAnimationFrame(() => requestAnimationFrame(reveal));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Letterbox entrance: bars retract shortly after first paint. (Under
  // reduced motion the bars are display:none in CSS; the class is cosmetic.)
  useEffect(() => {
    const t = window.setTimeout(() => setBarsOpen(true), 420);
    return () => window.clearTimeout(t);
  }, []);

  // The film: armed only after `load` (the poster frame wins the LCP race
  // first), and never for reduced motion — the still reel stays instead.
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setVideoSrc(HERO_VIDEO_SRC);
    };
    if (document.readyState === 'complete') {
      const t = window.setTimeout(arm, VIDEO_ARM_DELAY_MS);
      return () => {
        cancelled = true;
        window.clearTimeout(t);
      };
    }
    window.addEventListener('load', arm, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', arm);
    };
  }, [reduced]);

  // Cinema etiquette: pause the film when the tab hides or the hero scrolls
  // out of view; resume quietly on return.
  useEffect(() => {
    const v = videoRef.current;
    if (!videoSrc || !v) return;
    let inView = true;
    const sync = () => {
      if (document.hidden || !inView) {
        v.pause();
      } else {
        void v.play().catch(() => {});
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true;
        sync();
      },
      { threshold: 0.12 }
    );
    io.observe(v);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [videoSrc]);

  // The still reel: crossfade frames on a slow cadence. Pauses when the tab
  // is hidden or the hero scrolls out of view; never runs for reduced
  // motion; hands over entirely once the film is playing.
  useEffect(() => {
    if (reduced || videoActive) return;
    let idx = 0;
    let timer = 0;
    const section = sectionRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        reelInView.current = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    if (section) io.observe(section);
    const tick = () => {
      if (document.hidden || !reelInView.current) return;
      idx = (idx + 1) % FRAMES.length;
      setFrame(idx);
    };
    const start = window.setTimeout(() => {
      timer = window.setInterval(tick, REEL_MS);
    }, REEL_START_DELAY_MS);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
      io.disconnect();
    };
  }, [reduced, videoActive]);

  // Fade the film in only once playback is truly running. If autoplay is
  // blocked (e.g. iOS low-power mode) the promise rejects and the still
  // reel keeps the frame — no black flash, no broken hero.
  const onVideoReady = () => {
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => {
      setVideoActive(true);
      if (videoProgressRef.current) videoProgressRef.current.style.width = '0%';
    }).catch(() => {});
  };

  // Film progress is written straight to the DOM — no React re-render per
  // timeupdate. The loop seam resets the bar to zero for free.
  const onVideoTime = () => {
    const v = videoRef.current;
    const p = videoProgressRef.current;
    if (!v || !p || !v.duration) return;
    p.style.width = `${(v.currentTime / v.duration) * 100}%`;
  };

  const quickCheck = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('lakeside:estimate-date', { detail: { date } }));
    document.getElementById('estimate')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-label="The Lakeside — weddings &amp; events"
      className={cn(
        'relative flex min-h-[100svh] flex-col overflow-hidden bg-pine-900',
        barsOpen && 'cine-bars-open'
      )}
    >
      {/* ── Backdrop: the estate in motion, reel as the still fallback ──── */}
      <div className="absolute inset-0">
        {FRAMES.map((f, i) => (
          <img
            key={f.src}
            src={f.src}
            alt={f.alt}
            fetchPriority={i === 0 ? 'high' : 'low'}
            className={cn(
              'cine-frame h-full w-full object-cover',
              !videoActive && (i % 2 === 0 ? 'kb-a' : 'kb-b'),
              i === frame && 'is-active'
            )}
          />
        ))}
        {/* The film — muted, seamless 10s loop; the opening frame IS the
            poster above, so the crossfade reads as one continuous shot. */}
        <video
          ref={videoRef}
          src={videoSrc ?? undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={onVideoReady}
          onTimeUpdate={onVideoTime}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out',
            videoActive ? 'opacity-100' : 'opacity-0'
          )}
        />
        {/* Editorial scrims: a deep, quiet left column for the type; the
            estate stays visible on the right where the light lives. */}
        <div className="absolute inset-0 bg-gradient-to-r from-pine-950/90 via-pine-950/45 to-pine-900/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-pine-950/92 via-transparent to-pine-900/50" />
        {/* Champagne warmth where the sunset lives; gold seat for the navbar */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(64%_46%_at_74%_18%,rgba(222,184,110,0.16),transparent_66%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-pine-950/55 to-transparent"
        />
      </div>
      <div className="cine-vignette" aria-hidden="true" />
      <div className="cine-grain cine-grain--live" aria-hidden="true" />

      {/* Ambient gold + ruby light (decorative) */}
      <div aria-hidden="true" className="gold-bloom pointer-events-none absolute left-[6%] top-[22%] z-[1] h-[40vh] w-[46vw] max-w-3xl opacity-45" />
      <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute bottom-[8%] right-[10%] z-[1] h-[26vh] w-[30vw] opacity-25" />

      {/* Letterbox entrance bars */}
      <div className="cine-bar cine-bar--top" aria-hidden="true" />
      <div className="cine-bar cine-bar--bottom" aria-hidden="true" />

      {/* Gilded inset frame — the invitation border */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 z-[5] rounded-[2px] border border-gold-300/20 sm:inset-5"
      >
        <CornerMarks inset="0px" tone="gold" className="opacity-80" />
      </div>

      {/* Film slate — reel position + frame caption (decorative, refined) */}
      <div
        aria-hidden="true"
        className="absolute right-8 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-5 xl:flex"
      >
        <span className="h-20 w-px bg-gradient-to-b from-transparent to-gold-300/60" />
        {videoActive ? (
          <>
            {/* Live take: a breathing gold dot, like a camera tally light */}
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300/60 motion-reduce:animate-none" />
              <span
                className="relative inline-flex size-2.5 rounded-full bg-gold-300 shadow-[0_0_12px_rgba(237,214,164,0.8)]"
              />
            </span>
            <span
              key="film"
              className="slate-in font-body text-[10px] uppercase tracking-[0.3em] text-gold-200/85 [writing-mode:vertical-rl]"
            >
              The estate · in motion
            </span>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              {FRAMES.map((f, i) => (
                <span
                  key={f.src}
                  className={cn(
                    'h-px transition-all duration-500',
                    i === frame
                      ? 'w-8 bg-gradient-to-r from-gold-300 via-gold-200 to-ruby-400'
                      : 'w-4 bg-white/30'
                  )}
                />
              ))}
            </div>
            <span
              key={frame}
              className="slate-in font-body text-[10px] uppercase tracking-[0.3em] text-gold-200/85 [writing-mode:vertical-rl]"
            >
              {FRAMES[frame].slate}
            </span>
          </>
        )}
        <span className="h-20 w-px bg-gradient-to-t from-transparent to-gold-300/60" />
      </div>

      {/* Rotating seal — lower right, inside the gilded frame (xl+) */}
      <div
        aria-hidden="true"
        className="absolute bottom-24 right-10 z-10 hidden xl:block"
      >
        <CircularSeal text="The Lakeside · Weddings · Est. 1995 · " theme="dark" />
      </div>

      {/* Scroll cue — invites the first scroll, hides once the page moves */}
      <a
        href="#welcome"
        aria-label="Scroll down to the welcome section"
        aria-hidden={scrolled}
        tabIndex={scrolled ? -1 : 0}
        className={`absolute bottom-16 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-gold-300/75 transition-all duration-500 hover:text-gold-200 md:flex ${scrolled ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        <span className="font-body text-[10px] uppercase tracking-[0.28em]">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-gold-300/70 to-transparent" aria-hidden="true" />
        <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
      </a>

      {/* ── Content: the editorial stack, anchored lower-left ──────────── */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pb-28 pt-20 sm:px-6 sm:pb-24 lg:px-8 lg:pb-9 lg:pt-28"
      >
        <div className="max-w-3xl">
          {/* Rings ornament above the kicker */}
          <div
            aria-hidden="true"
            className="reveal mb-5 flex items-center gap-3 [transition-delay:60ms]"
          >
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold-300/70" />
            <Rings className="h-6 w-auto drop-shadow-[0_2px_8px_rgba(184,155,106,0.45)]" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold-300/70" />
          </div>

          {/* Kicker */}
          <p className="reveal eyebrow eyebrow-dash flex flex-wrap items-center gap-x-3 text-gold-300 [transition-delay:120ms]">
            <span>Tiegerpoort</span>
            <span className="wax-dot size-[5px]" aria-hidden="true" />
            <span>Pretoria East</span>
            <span className="wax-dot size-[5px]" aria-hidden="true" />
            <span>Est. 1995</span>
          </p>

          {/* The headline — three quiet sentences, the last in gold italic */}
          <h1
            ref={headlineRef}
            className="reveal mt-5 font-display text-[clamp(2.25rem,6.5vw,5.25rem)] font-medium leading-[1.04] text-marble-50 [transition-delay:200ms] [text-shadow:0_2px_40px_rgba(11,26,21,0.55)]"
          >
            <span className="block">The chapel is glass.</span>
            <span className="block">The water is still.</span>
            <em className="gold-gradient-text gold-gradient-text--live block">
              The day is yours.
            </em>
          </h1>

          {/* Lede */}
          <p className="reveal mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-marble-50/85 sm:text-lg [transition-delay:320ms]">
            A family-run estate on the water&rsquo;s edge — marble underfoot,
            chandeliers overhead, zebra grazing beyond the lawn. Thirty years
            of days done beautifully, and every price in the open.
          </p>

          {/* CTAs */}
          <div className="reveal mt-6 flex flex-wrap items-center gap-3 [transition-delay:440ms]">
            <a
              href="#pricing"
              className="btn-shine gold-surface inline-flex min-h-[48px] items-center gap-2 rounded-full px-5 text-sm font-semibold tracking-wide sm:px-7 sm:text-base"
            >
              Find your date <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#estate"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-gold-300/40 bg-white/5 px-5 text-sm font-medium text-marble-50 backdrop-blur transition-colors hover:border-gold-300/70 hover:bg-white/15 hover:text-marble-50 sm:px-7 sm:text-base"
            >
              <Compass className="h-4 w-4 text-gold-300" aria-hidden="true" />
              Wander the estate
            </a>
          </div>

          {/* Trust meta — hairline-separated, no confetti */}
          <div className="reveal mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[13px] font-medium tracking-wide text-marble-50/75 [transition-delay:540ms]">
            <span className="inline-flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              Up to {PRICING.capacity.max} guests
            </span>
            <span className="h-3.5 w-px bg-white/25" aria-hidden="true" />
            <span className="inline-flex items-center gap-2">
              <span className="wax-dot size-[5px]" aria-hidden="true" />
              Family-run since 1995
            </span>
            <span className="h-3.5 w-px bg-white/25" aria-hidden="true" />
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              Saturdays from R{thin(PRICING.venueHire.sat)} hire
            </span>
          </div>
        </div>

        {/* ── The sixty-second estimate — borderless concierge strip ────── */}
        <form
          onSubmit={quickCheck}
          aria-label="Quick price check"
          className="reveal mt-7 w-full max-w-2xl sm:mt-10 [transition-delay:660ms]"
        >
          <div className="glass-card flex flex-col gap-3 rounded-2xl p-3 shadow-[inset_0_0_0_1px_rgba(237,214,164,0.35),0_24px_70px_-28px_rgba(0,0,0,0.6),0_0_70px_-24px_rgba(222,184,110,0.4)] sm:flex-row sm:items-center sm:gap-1">
            <div className="flex flex-1 items-center gap-3 px-3 py-1 sm:py-0">
              <CalendarDays className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <label
                  htmlFor="hero-date"
                  className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-200/85"
                >
                  Wedding date
                </label>
                <Input
                  id="hero-date"
                  type="date"
                  min="2026-10-10"
                  max="2027-12-31"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-7 rounded-none border-0 border-transparent bg-transparent p-0 text-sm font-medium text-marble-50 shadow-none [color-scheme:dark] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <span className="hidden h-9 w-px bg-white/15 sm:block" aria-hidden="true" />

            <div className="flex items-center gap-3 px-3 py-1 sm:w-36 sm:py-0">
              <Users className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <label
                  htmlFor="hero-guests"
                  className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-200/85"
                >
                  Guests
                </label>
                <Input
                  id="hero-guests"
                  type="number"
                  min={20}
                  max={PRICING.capacity.max}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="h-7 rounded-none border-0 border-transparent bg-transparent p-0 text-sm font-medium text-marble-50 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-shine gold-surface inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold tracking-wide transition-transform hover:scale-[1.015] sm:h-11"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Estimate
            </button>
          </div>
          <p className="mt-2.5 hidden pl-1 text-xs text-marble-50/65 sm:block">
            VAT included, no site visit needed &middot; your total in under a
            minute &middot;{' '}
            <a
              href="#visit"
              className="underline decoration-gold-300/60 underline-offset-2 transition-colors hover:text-marble-50"
            >
              or book a viewing
            </a>
          </p>
        </form>
      </div>

      {/* Progress — the gold line tracks the film when it plays, the still
          reel otherwise; under the film it is written straight to the DOM */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-[2px] bg-white/10">
        <div
          ref={videoProgressRef}
          className={cn(
            'h-full bg-gradient-to-r from-brass-600 via-gold-300 to-ruby-400',
            !videoActive && 'transition-[width] duration-1000 ease-out'
          )}
          style={
            videoActive
              ? undefined
              : { width: `${((frame + 1) / FRAMES.length) * 100}%` }
          }
        />
      </div>
    </section>
  );
}
