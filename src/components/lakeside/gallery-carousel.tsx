'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — GALLERY CAROUSEL ("the salon") — round 21, built new
 * ─────────────────────────────────────────────────────────────────────────────
 * A modern 3D coverflow carousel. Completely replaces the arc:
 *  - Frames ride a continuous circular track: the active frame stands flat
 *    and forward, neighbours recede and turn like the panels of a salon wall.
 *  - Buttery physics: pointer drag with velocity fling + snap, horizontal
 *    trackpad wheel, arrow keys, prev/next buttons, dot/counter navigation.
 *  - Idle autoplay (paused on hover, drag, off-screen, hidden tab, lightbox
 *    and reduced-motion), gold→ruby progress, diamond dots, live captions.
 *  - Lake reflection under every frame (flipped + blurred + masked).
 *  - "Classic grid" masonry toggle persisted in localStorage, and a Dialog
 *    lightbox with keyboard navigation shared by both views.
 *
 * All motion is driven by one rAF loop writing transforms directly to the
 * panels (no per-frame React renders). The centre frame index is the only
 * piece of render state.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import curated from '@/content/curated-images.json';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';

// ── Data ────────────────────────────────────────────────────────────────────

type CuratedImage = {
  key: string;
  category: string;
  use: string[];
  alt: string;
  w: number;
  h: number;
  aspect: number;
  orientation: string;
};

const IMAGES = curated as CuratedImage[];

/** Frames on the salon track: every curated image marked for 3D use. */
const ALL_3D = IMAGES.filter((i) => i.use.includes('3d'));
/** Classic grid: everything curated for 3d or thumb use. */
const GRID_IMAGES = IMAGES.filter(
  (i) => i.use.includes('3d') || i.use.includes('thumb'),
);

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'chapel', label: 'Chapel' },
  { id: 'reception', label: 'Reception' },
  { id: 'lakeside', label: 'Lakeside' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'real-wedding', label: 'Real Weddings' },
  { id: 'suites', label: 'Suites' },
  { id: 'details', label: 'Details' },
] as const;

type ChipId = (typeof CATEGORIES)[number]['id'];
type ViewMode = 'carousel' | 'grid';
type Lightbox = { list: 'carousel' | 'grid'; index: number } | null;

// ── Geometry ────────────────────────────────────────────────────────────────

const MAX_PANELS = 14;
const VISIBLE_HALF = 3.4; // frames rendered either side of centre
const ROTATION_DEG = 38; // tilt of the nearest neighbour frames
const LERP = 0.135; // approach factor per frame
const IDLE_MS = 4200; // stillness required before autoplay resumes
const AUTOPLAY_MS = 5400;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const imgSrc = (key: string, small = true, blur = false) => {
  if (blur) return `/img/${key}-blur.webp`;
  return `/img/${key}${small ? '-s' : ''}.webp`;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

// ── Frame ───────────────────────────────────────────────────────────────────

function SalonFrame({
  item,
  index,
  total,
  eager,
  onOpen,
  onAnnounce,
}: {
  item: CuratedImage;
  index: number;
  total: number;
  eager: boolean;
  onOpen: () => void;
  onAnnounce: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const aspect = clamp(item.aspect, 0.6, 1.8);

  // Cached images can finish BEFORE React attaches onLoad — catch that here.
  const imgRef = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <button
      type="button"
      className="lscar-panel"
      data-index={index}
      style={
        {
          width: 'min(58vw, 300px)',
          aspectRatio: `${aspect}`,
        } as CSSProperties
      }
      onClick={onOpen}
      onFocus={onAnnounce}
      aria-label={`Photo ${index + 1} of ${total}: ${item.alt} — open large view`}
    >
      <span className="lscar-card" style={{ backgroundImage: `url(${imgSrc(item.key, false, true)})` }}>
        <img
          ref={imgRef}
          src={imgSrc(item.key)}
          alt={item.alt}
          width={item.w}
          height={item.h}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
        <span
          className="lscar-cap absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b1a15]/95 via-pine-900/45 to-transparent px-3 pb-2.5 pt-8 text-left text-[11px] leading-snug text-gold-200"
          aria-hidden="true"
        >
          {item.alt}
        </span>
      </span>
      {/* Lake reflection: flipped, blurred, masked — the salon stands on water */}
      <span className="lscar-refl" aria-hidden="true">
        <img
          src={imgSrc(item.key)}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          draggable={false}
          className="h-full w-full object-cover"
          style={{
            transform: 'scaleY(-1) scale(1.08)',
            filter: 'blur(6px) brightness(0.7) sepia(0.4) saturate(1.4)',
          }}
        />
      </span>
    </button>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export default function GalleryCarousel() {
  const [view, setView] = useState<ViewMode>('carousel');
  const [chip, setChip] = useState<ChipId>('all');
  const [dragging, setDragging] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [lightbox, setLightbox] = useState<Lightbox>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [inView, setInView] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  // Motion state — refs only; the render reads just activeIdx.
  const curRef = useRef(0); // float position on the track
  const targetRef = useRef(0);
  const spacingRef = useRef(240);
  const appliedRef = useRef(NaN); // last cur written to the DOM
  const dragRef = useRef(false);
  const dragDistRef = useRef(0);
  const lastDragEndRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const velRef = useRef(0); // px/ms of pointer travel
  const lastInteractRef = useRef(0);
  const wheelAccRef = useRef(0);

  const hoverRef = useRef(false);
  const reducedRef = useRef(false);
  const onScreenRef = useRef(true);
  const tabVisibleRef = useRef(true);
  const lightboxOpenRef = useRef(false);

  const list = useMemo(
    () =>
      (chip === 'all' ? ALL_3D : ALL_3D.filter((i) => i.category === chip)).slice(
        0,
        MAX_PANELS,
      ),
    [chip],
  );

  const lbList = lightbox?.list === 'grid' ? GRID_IMAGES : list;
  const lbItem = lightbox ? lbList[lightbox.index] : undefined;

  // ── Preload neighbours (r22) ───────────────────────────────────────────────
  // Warms the small variants for ±2 frames around the active one, plus the
  // active frame's large variant for the lightbox. A Set ref keeps repeats out.
  const preloadedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (typeof window === 'undefined' || list.length === 0) return;
    const n = list.length;
    const warm = (key: string, src: string) => {
      const url = `${key}::${src}`;
      if (preloadedRef.current.has(url)) return;
      preloadedRef.current.add(url);
      const im = new window.Image();
      im.decoding = 'async';
      im.src = src;
    };
    for (let off = -2; off <= 2; off++) {
      const item = list[(((activeIdx + off) % n) + n) % n];
      if (item) warm(item.key, imgSrc(item.key));
    }
    const active = list[activeIdx];
    if (active) warm(active.key, imgSrc(active.key, false));
  }, [activeIdx, list]);

  // ── Reduced motion ────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      reducedRef.current = mq.matches;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // ── Tab visibility + off-screen pause ─────────────────────────────────────
  useEffect(() => {
    const onVis = () => {
      tabVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVis);
    let io: IntersectionObserver | null = null;
    const el = stageRef.current;
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          onScreenRef.current = entries[0]?.isIntersecting ?? true;
          setInView(entries[0]?.isIntersecting ?? false);
        },
        { threshold: 0.05 },
      );
      io.observe(el);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      io?.disconnect();
    };
  }, []);

  useEffect(() => {
    lightboxOpenRef.current = lightbox !== null;
  }, [lightbox]);

  // ── Spacing follows the stage width ───────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      const w = stageRef.current?.clientWidth ?? 1200;
      spacingRef.current = clamp(w * 0.26, 148, 252);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ── The one rAF loop: lerp toward target, paint every panel ───────────────
  useEffect(() => {
    let raf = 0;
    const n = list.length;
    const paint = () => {
      const panels = stageRef.current?.querySelectorAll<HTMLButtonElement>(
        '.lscar-panel',
      );
      if (!panels) return;
      const cur = curRef.current;
      const spacing = spacingRef.current;
      panels.forEach((el) => {
        const i = Number(el.dataset.index);
        if (Number.isNaN(i) || n === 0) return;
        let d = i - cur;
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n; // signed shortest circular distance
        const ad = Math.abs(d);
        if (ad > VISIBLE_HALF + 1) {
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          return;
        }
        el.style.visibility = 'visible';
        const cd = clamp(d, -1, 1);
        const x = d * spacing;
        const z = -Math.min(ad, 3) * spacing * 0.62;
        const ry = -cd * ROTATION_DEG;
        const scale = 1 - Math.min(ad * 0.075, 0.3);
        const opacity = ad < 0.5 ? 1 : clamp(1 - (ad - 0.4) * 0.19, 0, 1);
        el.style.opacity = String(opacity);
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.zIndex = String(100 - Math.round(ad * 10));
        el.style.filter =
          ad < 0.5 ? '' : `brightness(${(1 - Math.min(ad * 0.15, 0.5)).toFixed(3)})`;
        el.dataset.active = ad < 0.5 ? 'true' : 'false';
      });
    };

    const tick = () => {
      if (!dragRef.current && n > 0) {
        const target = targetRef.current;
        const cur = curRef.current;
        const k = reducedRef.current ? 1 : LERP;
        const next = Math.abs(target - cur) < 0.0004 ? target : cur + (target - cur) * k;
        curRef.current = next;
        if (next !== appliedRef.current) {
          paint();
          appliedRef.current = next;
          const idx = ((Math.round(next) % n) + n) % n;
          setActiveIdx((prev) => (prev === idx ? prev : idx));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [list]);

  // Repaint when the track contents change (chip filter).
  useEffect(() => {
    curRef.current = 0;
    targetRef.current = 0;
    appliedRef.current = NaN;
    lastInteractRef.current = 0;
  }, [chip]);

  // ── Restore saved view ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('lakeside-gallery-view');
      if (saved === 'grid' || saved === 'carousel') setView(saved);
    } catch {
      /* localStorage unavailable (private mode) — keep default */
    }
  }, []);

  const switchView = (v: ViewMode) => {
    setView(v);
    try {
      window.localStorage.setItem('lakeside-gallery-view', v);
    } catch {
      /* ignore */
    }
  };

  // ── Navigation primitives ─────────────────────────────────────────────────
  const step = useCallback((dir: 1 | -1) => {
    targetRef.current = Math.round(targetRef.current) + dir;
    lastInteractRef.current = performance.now();
  }, []);

  const goTo = useCallback((index: number) => {
    // Choose the shortest way around the circle.
    const n = list.length;
    if (n === 0) return;
    let d = index - curRef.current;
    d = ((d % n) + n) % n;
    if (d > n / 2) d -= n;
    targetRef.current = curRef.current + d;
    lastInteractRef.current = performance.now();
  }, [list.length]);

  // ── Autoplay ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (list.length < 2) return;
    const timer = window.setInterval(() => {
      if (
        !dragRef.current &&
        !hoverRef.current &&
        !reducedRef.current &&
        onScreenRef.current &&
        tabVisibleRef.current &&
        !lightboxOpenRef.current &&
        performance.now() - lastInteractRef.current > IDLE_MS
      ) {
        targetRef.current = Math.round(targetRef.current) + 1;
      }
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [list.length]);

  // ── Drag to spin (window listeners while dragging) ────────────────────────
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - lastXRef.current;
      const dt = Math.max(1, e.timeStamp - lastTRef.current);
      lastXRef.current = e.clientX;
      lastTRef.current = e.timeStamp;
      dragDistRef.current += Math.abs(dx);
      velRef.current = dx / dt;
      curRef.current += -dx / spacingRef.current;
      targetRef.current = curRef.current; // follow the finger 1:1
      lastInteractRef.current = performance.now();
    };
    const onUp = () => {
      dragRef.current = false;
      setDragging(false);
      // Fling with the release velocity, then snap to the nearest frame.
      const fling = clamp((-velRef.current * 190) / spacingRef.current, -3.4, 3.4);
      targetRef.current = Math.round(targetRef.current + fling);
      velRef.current = 0;
      lastInteractRef.current = performance.now();
      if (dragDistRef.current > 8) lastDragEndRef.current = performance.now();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  const onStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = true;
    setDragging(true);
    dragDistRef.current = 0;
    lastXRef.current = e.clientX;
    lastTRef.current = e.timeStamp;
    velRef.current = 0;
    lastInteractRef.current = performance.now();
  };

  // ── Horizontal trackpad wheel ─────────────────────────────────────────────
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const horizontal =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (horizontal === 0) return;
      e.preventDefault();
      wheelAccRef.current += horizontal;
      if (Math.abs(wheelAccRef.current) > 60) {
        step(wheelAccRef.current > 0 ? 1 : -1);
        wheelAccRef.current = 0;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [step]);

  // ── Keyboard on the stage ─────────────────────────────────────────────────
  const onStageKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      step(e.key === 'ArrowLeft' ? -1 : 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(list.length - 1);
    }
  };

  // ── Opening the lightbox from the track ───────────────────────────────────
  const openFromTrack = (index: number) => {
    if (dragDistRef.current > 8 && performance.now() - lastDragEndRef.current < 260) {
      return; // that was a drag, not a click
    }
    const n = list.length;
    let d = index - curRef.current;
    d = ((d % n) + n) % n;
    if (d > n / 2) d -= n;
    if (Math.abs(d) > 0.5) {
      goTo(index); // side frame: spin it to centre
      return;
    }
    setLightbox({ list: 'carousel', index });
    lastInteractRef.current = performance.now();
  };

  const navLightbox = (dir: 1 | -1) => {
    setLightbox((lb) =>
      lb ? { ...lb, index: (lb.index + dir + lbList.length) % lbList.length } : lb,
    );
  };

  const activeItem = list[activeIdx];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section aria-label="The salon — interactive 3D gallery carousel" className="relative py-12 sm:py-16">
      {/* Scoped styles for the 3-D machinery */}
      <style>{`
        .lscar-stage { perspective: 1500px; }
        .lscar-track {
          position: absolute; inset: 0;
          transform-style: preserve-3d;
          touch-action: pan-y;
          cursor: grab;
        }
        .lscar-track.lscar-dragging { cursor: grabbing; }
        .lscar-panel {
          position: absolute; left: 50%; top: 45%;
          display: block;
          opacity: 0;               /* painted by the rAF loop */
          transform-style: preserve-3d;
          will-change: transform, opacity, filter;
          border-radius: 8px;
        }
        .lscar-card {
          position: relative; display: block; width: 100%; height: 100%;
          border-radius: 8px; overflow: hidden;
          background-size: cover; background-position: center;
          box-shadow:
            0 34px 70px -26px rgba(0,0,0,.9),
            0 0 0 1px rgba(222,184,110,.42),
            inset 0 1px 0 rgba(255,255,255,.18);
          transition: box-shadow 280ms ease;
        }
        /* Museum-glass sheen */
        .lscar-card::after {
          content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(115deg, rgba(255,255,255,.2) 0%, rgba(255,255,255,.05) 28%, transparent 54%);
        }
        .lscar-panel[data-active="true"] .lscar-card {
          box-shadow:
            0 44px 90px -26px rgba(0,0,0,.95),
            0 0 0 1.5px rgba(246,232,200,.85),
            0 0 44px -6px rgba(222,184,110,.38),
            inset 0 1px 0 rgba(255,255,255,.28);
        }
        .lscar-panel:hover .lscar-card { box-shadow: 0 40px 80px -26px rgba(0,0,0,.92), 0 0 0 1.5px rgba(246,232,200,.7), inset 0 1px 0 rgba(255,255,255,.22); }
        .lscar-cap { opacity: 0; transition: opacity 280ms ease; z-index: 2; }
        .lscar-panel[data-active="true"] .lscar-cap,
        .lscar-panel:hover .lscar-cap,
        .lscar-panel:focus-visible .lscar-cap { opacity: 1; }
        .lscar-refl {
          position: absolute; top: 100%; left: 0; width: 100%; aspect-ratio: 1.5;
          pointer-events: none; opacity: .2;
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,.55), transparent 62%);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.55), transparent 62%);
        }
      `}</style>

      {/* Toolbar: chips + view toggle */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <div
          role="group"
          aria-label="Filter photos by space"
          className="no-scrollbar flex max-w-full gap-2 overflow-x-auto pb-1"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={chip === c.id}
              onClick={() => setChip(c.id)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                chip === c.id
                  ? 'gold-surface border-transparent'
                  : 'border-gold-300/25 bg-white/5 text-marble-50/70 hover:border-ruby-400/60 hover:text-gold-200',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Gallery layout"
          className="flex items-center gap-1 rounded-full border border-gold-300/30 bg-white/5 p-1 backdrop-blur"
        >
          <button
            type="button"
            aria-pressed={view === 'carousel'}
            onClick={() => switchView('carousel')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              view === 'carousel' ? 'gold-surface' : 'text-marble-50/70 hover:text-gold-200',
            )}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            3D salon
          </button>
          <button
            type="button"
            aria-pressed={view === 'grid'}
            onClick={() => switchView('grid')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              view === 'grid' ? 'gold-surface' : 'text-marble-50/70 hover:text-gold-200',
            )}
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            Classic grid
          </button>
        </div>
      </div>

      {view === 'carousel' ? (
        <div className="mt-6">
          {/* ── Control bar: counter · diamond dots · progress (above the
              stage so the floating dock can never cover the controls) ── */}
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <div aria-hidden="true" className="flex items-center justify-center gap-4">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold-300/50" />
              <span className="tabular text-xs font-semibold tracking-[0.3em] text-gold-200">
                {pad2(activeIdx + 1)} <span className="text-gold-300/50">—</span> {pad2(list.length)}
              </span>
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold-300/50" />
            </div>
            {/* Diamond dots */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5" role="group" aria-label="Go to photo">
              {list.map((item, i) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to photo ${i + 1}: ${item.alt}`}
                  aria-current={i === activeIdx ? 'true' : undefined}
                  className={cn(
                    'size-2 rotate-45 transition-all duration-300',
                    i === activeIdx
                      ? 'scale-125 bg-gradient-to-br from-gold-200 to-brass-500 shadow-[0_0_10px_rgba(222,184,110,0.7)]'
                      : 'border border-gold-300/35 bg-transparent hover:border-gold-300/70',
                  )}
                />
              ))}
            </div>
            {/* Gold → ruby progress */}
            <div aria-hidden="true" className="mx-auto mt-4 h-[3px] w-full max-w-md overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-300 via-brass-400 to-ruby-400 transition-[width] duration-500 ease-out"
                style={{ width: `${list.length ? ((activeIdx + 1) / list.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* ── The salon stage ── */}
          <div
            ref={stageRef}
            className="lscar-stage relative mx-auto mt-6 h-[420px] max-w-[1600px] overflow-hidden sm:h-[540px]"
          >
            {/* Gold spotlight from above */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(90%_80%_at_50%_-10%,rgba(222,184,110,0.16),transparent_62%)]"
            />
            {/* Lake floor */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-[#0b1a15]/70 via-[#0b1a15]/88 to-[#0b1a15]"
            />
            {/* Gold pool line where the frames meet the water */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-[42%] h-px bg-gradient-to-r from-transparent via-gold-300/55 to-transparent"
            />
            <div
              aria-hidden="true"
              className="gold-bloom pointer-events-none absolute bottom-[35%] left-1/2 h-24 w-[46%] -translate-x-1/2 opacity-60"
            />

            {/* The track — drag horizontally to spin */}
            <div
              role="application"
              aria-label="Interactive 3D photo carousel of The Lakeside estate. Drag left or right to spin, or use the left and right arrow keys. Press Tab to move between photos and Enter to open one."
              tabIndex={0}
              className={cn('lscar-track select-none', dragging && 'lscar-dragging')}
              onPointerDown={onStagePointerDown}
              onKeyDown={onStageKeyDown}
              onMouseEnter={() => {
                hoverRef.current = true;
              }}
              onMouseLeave={() => {
                hoverRef.current = false;
              }}
            >
              {list.map((item, i) => (
                <SalonFrame
                  key={item.key}
                  item={item}
                  index={i}
                  total={list.length}
                  eager={inView}
                  onOpen={() => openFromTrack(i)}
                  onAnnounce={() =>
                    setAnnounce(`Image ${i + 1} of ${list.length}: ${item.alt}`)
                  }
                />
              ))}
            </div>

            {/* Edge fades into the theatre wall */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-[120] w-16 bg-gradient-to-r from-pine-900 to-transparent sm:w-28" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-[120] w-16 bg-gradient-to-l from-pine-900 to-transparent sm:w-28" />

            {/* Prev / next */}
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-[140] grid size-11 -translate-y-1/2 place-items-center rounded-full border border-gold-300/35 bg-black/45 text-gold-200 backdrop-blur transition-all hover:border-gold-300/80 hover:bg-black/60 hover:text-gold-100 sm:left-6"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-[140] grid size-11 -translate-y-1/2 place-items-center rounded-full border border-gold-300/35 bg-black/45 text-gold-200 backdrop-blur transition-all hover:border-gold-300/80 hover:bg-black/60 hover:text-gold-100 sm:right-6"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>

            {/* Hint */}
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-[130] -translate-x-1/2 rounded-full border border-gold-300/25 bg-black/55 px-3.5 py-1 text-[11px] text-gold-200 backdrop-blur">
              Drag or flick to spin &middot; click a frame to step inside
            </p>
          </div>

          {/* Live caption for the centre frame */}
          <div className="mx-auto mt-5 max-w-3xl px-4 text-center sm:px-6">
            <p
              key={activeIdx}
              className="slate-in mx-auto max-w-xl text-pretty font-display text-sm italic leading-snug text-marble-50/85 sm:text-base"
            >
              {activeItem?.alt ?? ''}
            </p>
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {announce}
          </p>
        </div>
      ) : (
        /* ── Classic masonry grid ── */
        <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-2xl text-marble-50">
              Every corner, in full
            </h3>
            <p className="text-xs text-marble-50/60">
              Photography: venue photographers — TODO(CLIENT) credits
            </p>
          </div>
          <div className="mt-5 columns-2 gap-4 sm:columns-3 lg:columns-4">
            {GRID_IMAGES.map((g, i) => (
              <figure key={g.key} className="mb-4 break-inside-avoid">
                <button
                  type="button"
                  className="group block w-full overflow-hidden rounded-lg border border-gold-300/25 bg-pine-900 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-300/70 hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)]"
                  style={{
                    backgroundImage: `url(${imgSrc(g.key)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  onClick={() => setLightbox({ list: 'grid', index: i })}
                  aria-label={`Open photo: ${g.alt}`}
                >
                  <img
                    src={imgSrc(g.key)}
                    alt={g.alt}
                    width={g.w}
                    height={g.h}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </button>
                <figcaption className="mt-1.5 text-[11px] leading-snug text-marble-50/60">
                  {g.alt}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      <Dialog
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent
          className="max-w-4xl border-gold-300/30 bg-pine-900 p-4 text-marble-50 shadow-[0_0_80px_-20px_rgba(222,184,110,0.35)] sm:p-6"
          onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              navLightbox(1);
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              navLightbox(-1);
            }
          }}
        >
          {lbItem && (
            <div className="flex flex-col gap-4">
              <img
                src={imgSrc(lbItem.key, false)}
                alt={lbItem.alt}
                width={lbItem.w}
                height={lbItem.h}
                decoding="async"
                className="mx-auto max-h-[66vh] w-auto max-w-full rounded-lg object-contain"
              />
              {/* Position track — the site's progress language */}
              <div
                aria-hidden="true"
                className="mx-auto h-[3px] w-full max-w-md overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-300 via-ruby-400 to-gold-300 transition-[width] duration-500 ease-out"
                  style={{ width: `${((lightbox?.index ?? 0) + 1) / lbList.length * 100}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="font-display text-base leading-snug text-marble-50">
                    {lbItem.alt}
                  </DialogTitle>
                  <DialogDescription className="eyebrow mt-1.5 text-gold-300">
                    {lbItem.category}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    aria-live="polite"
                    className="rounded-full border border-marble-50/20 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-marble-50/85"
                  >
                    {(lightbox?.index ?? 0) + 1} / {lbList.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => navLightbox(-1)}
                    aria-label="Previous photo"
                    className="grid size-9 place-items-center rounded-full border border-marble-50/25 text-marble-50 transition-colors hover:bg-white/10"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navLightbox(1)}
                    aria-label="Next photo"
                    className="grid size-9 place-items-center rounded-full border border-marble-50/25 text-marble-50 transition-colors hover:bg-white/10"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                  <a
                    href="#estimate"
                    onClick={() => setLightbox(null)}
                    className={buttonVariants({
                      size: 'sm',
                      className:
                        'gold-surface ml-1 rounded-full font-semibold',
                    })}
                  >
                    See your estimate
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
