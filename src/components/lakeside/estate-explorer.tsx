'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — ESTATE EXPLORER (round 25: "the estate atlas")
 * ─────────────────────────────────────────────────────────────────────────────
 * A complete rebuild of the interactive estate map as a piece of dark,
 * gilded cartography — the kind of plan you would have letterpressed for a
 * private estate: deep pine canvas, gold contour lines, a hairline graticule,
 * architectural footprints with warm window light, a drawn compass rose,
 * scale bar and an arrival gate.
 *
 * - The signature interaction: choosing a space draws a gold walking route
 *   from the arrival gate to that building — a dashed line that marches
 *   onward, so the plan reads as a place you move through, not a diagram.
 * - Ambience pills (Morning / Golden hour / Night × Summer / Winter) retint
 *   the whole atlas; at night the windows light up.
 * - Detail panel: watermark numeral, curated facts, three thumbnails, CTAs.
 * - Planner: guest slider, dance-floor switch (auto-off > 160) and a
 *   floor-plan-grade table map (round tables of 10 + dance floor block)
 *   that hands its numbers to the estimator via 'lakeside:estimate-guests'.
 *
 * Accessibility: every hotspot is a focusable <g role="button"> with an
 * enlarged invisible hit area; routes and pulses are aria-hidden; the whole
 * atlas honors prefers-reduced-motion. Synced to #space=<id> via
 * history.replaceState (read back on mount). No Math.random / Date.now in
 * render paths — SSR-deterministic by construction.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import curated from '@/content/curated-images.json';
import { PRICING } from '@/config/pricing';
import { classifyDate, formatZAR, minAdultsFor } from '@/lib/pricing-engine';
import { WA_LINK } from '@/config/site';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarCheck, MessageCircle } from 'lucide-react';

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
const IMG_BY_KEY = new Map(IMAGES.map((i) => [i.key, i] as const));

type SpaceId =
  | 'glass-chapel'
  | 'marble-reception'
  | 'lake-waterfront'
  | 'canape-lawns'
  | 'beauty-bridal'
  | 'grooms-cabin'
  | 'heritage-manor'
  | 'wildlife';

type Space = {
  id: SpaceId;
  num: string;
  name: string;
  blurb: string;
  facts: string[];
  thumbs: string[];
};

const ROOMS_2026 = PRICING.years[2026].rooms;

const SPACES: Space[] = [
  {
    id: 'glass-chapel',
    num: '01',
    name: 'The Glass Chapel',
    blurb:
      'Where glass meets lake: vows behind walls of glass, the water and wildlife just beyond.',
    facts: [
      'Floor-to-ceiling glass with stacking doors — fully open or closed and cozy',
      'All-season: the chapel works in summer heat and winter chill alike',
      // TODO(CLIENT): confirm chapel seating capacity — never display a number until verified.
      'Ceremony seating arranged around your guest list — ask us for your date',
    ],
    thumbs: ['LS-067', 'LS-017', 'LS-018'],
  },
  {
    id: 'marble-reception',
    num: '02',
    name: 'White Marble Reception',
    blurb:
      'The white gabled pavilion on the water’s edge — marble floors, scissor trusses, chandeliers.',
    facts: [
      `Holds ${PRICING.capacity.withDanceFloor} guests with a dance floor or ${PRICING.capacity.max} without`,
      'On the water, with a deck over the lake for sundowners',
      'Brass chandeliers on scissor trusses above a polished marble floor',
      'Adjacent lounge + fireplace for the quiet moments',
    ],
    thumbs: ['LS-071', 'LS-024', 'LS-069'],
  },
  {
    id: 'lake-waterfront',
    num: '03',
    name: 'The Lake & Waterfront',
    blurb:
      'The estate’s centrepiece — a still mirror for the chapel, the pavilion and the golden hour.',
    facts: [
      'Ceremonies, canapés and photographs on the deck over the water',
      'Golden-hour portraits along the shoreline',
      // TODO(CLIENT): confirm deck rules and supervised-access wording.
      'No railings at the water — little guests are kept close',
    ],
    thumbs: ['LS-016', 'LS-059', 'LS-075'],
  },
  {
    id: 'canape-lawns',
    num: '04',
    name: 'Canapé Lawns & Bar',
    blurb:
      'Cocktail hour on the open lawns, the herds grazing in the middle distance.',
    facts: [
      'Canapés and the bar on the lawns, wildlife in view',
      'Shaded by established trees, steps from the reception',
      'String lights and lanterns as the light drops',
    ],
    thumbs: ['LS-050', 'LS-081', 'LS-041'],
  },
  {
    id: 'beauty-bridal',
    num: '05',
    name: 'Beauty Room & Bridal Suite',
    blurb:
      'Your morning HQ — hair, make-up and the quiet hour before the aisle.',
    facts: [
      'Hair and make-up from 08h00 in natural light',
      '1 bottle of champagne for photos — no corkage',
      'Private lounge and dressing space for the bridal party',
    ],
    thumbs: ['LS-026', 'LS-028', 'LS-029'],
  },
  {
    id: 'grooms-cabin',
    num: '06',
    name: 'Groom’s Cabin',
    blurb:
      'The guys’ hideout — cold drinks, shade and water views while the prep happens.',
    facts: [
      '1 bottle of liquor — no corkage',
      'Base for the groom’s party for the day',
      'Steps from the lawns, the lake and the chapel',
    ],
    thumbs: ['LS-035', 'LS-059', 'LS-075'],
  },
  {
    id: 'heritage-manor',
    num: '07',
    name: 'Heritage House & Manor',
    blurb:
      'Sleep on the estate: Heritage House and the thatched Manor keep the whole party close.',
    facts: [
      `${PRICING.accommodation.maxRooms} rooms sleeping up to ${PRICING.accommodation.maxGuests} guests`,
      `Heritage rooms ${formatZAR(ROOMS_2026.heritage)} / night · Manor rooms ${formatZAR(ROOMS_2026.manor)} / night (2026 rate)`,
      'One accommodation payment to the venue — the bridal party collects room by room',
      '2027 weddings bill at 2027 rates — see the estimator',
    ],
    thumbs: ['LS-072', 'LS-032', 'LS-033'],
  },
  {
    id: 'wildlife',
    num: '08',
    name: 'Wildlife & Grounds',
    blurb:
      'A working game farm — the herds have right of way, and they often graze in on the vows.',
    facts: [
      'Zebra, sable, gemsbok, waterbuck, golden wildebeest and emus',
      'No glass outside the reception — cans and plastic only on the lawns',
      'No railings at the water — children supervised, always',
    ],
    thumbs: ['LS-061', 'LS-063', 'LS-055'],
  },
];

const SPACE_BY_ID = new Map(SPACES.map((s) => [s.id, s] as const));

// Day-type options for the minimum-adults note (real, configured 2026 dates).
const DAY_OPTIONS = [
  { id: 'sat', label: 'Saturday', ruleLabel: 'Saturday rule', date: '2026-06-06' },
  { id: 'fri', label: 'Friday', ruleLabel: 'Friday rule', date: '2026-06-05' },
  { id: 'sun', label: 'Sunday', ruleLabel: 'Sunday rule', date: '2026-06-07' },
  { id: 'thu', label: 'Thursday', ruleLabel: 'Thursday rule', date: '2026-06-04' },
  { id: 'monwed', label: 'Mon–Wed', ruleLabel: 'Mon–Wed rule', date: '2026-06-01' },
] as const;

type DayId = (typeof DAY_OPTIONS)[number]['id'];
type TimeOfDay = 'morning' | 'golden' | 'night';
type Season = 'summer' | 'winter';

// Route keys — two hotspots share the 'heritage-manor' space, so routes are
// keyed per marker, not per space.
type RouteKey =
  | 'chapel'
  | 'reception'
  | 'lake'
  | 'lawns'
  | 'beauty'
  | 'groom'
  | 'heritage'
  | 'manor'
  | 'wildlife';

/** Walking routes from the arrival gate (52, 560) to each marker. */
const ROUTES: Record<RouteKey, string> = {
  chapel: 'M 52 560 C 130 542, 122 470, 138 402 C 152 336, 162 240, 178 162',
  beauty: 'M 52 560 C 106 548, 116 486, 118 428 C 120 386, 106 344, 97 312',
  heritage: 'M 52 560 C 100 552, 122 496, 140 448 C 156 406, 172 380, 190 362',
  manor: 'M 52 560 C 96 552, 128 520, 152 494 C 162 484, 170 476, 176 470',
  lawns: 'M 52 560 C 118 556, 196 548, 258 532 C 292 523, 316 514, 334 506',
  reception: 'M 52 560 C 138 548, 238 524, 318 486 C 376 458, 428 424, 454 394',
  lake: 'M 52 560 C 148 550, 298 534, 416 502 C 476 486, 528 466, 554 440',
  groom: 'M 52 560 C 158 550, 356 538, 514 542 C 596 544, 648 536, 676 524',
  wildlife: 'M 52 560 C 148 542, 318 474, 468 422 C 548 394, 628 348, 688 316',
};

// ── Ambience palette (decorative, illustrative) ─────────────────────────────

function useAmbience(tod: TimeOfDay, season: Season) {
  return useMemo(() => {
    const night = tod === 'night';
    const golden = tod === 'golden';
    const winter = season === 'winter';
    return {
      canvasTop: night ? '#0D241B' : golden ? '#143022' : '#0F251B',
      canvasBottom: '#0A1B15',
      contour: 'rgba(184,155,106,0.10)',
      grid: 'rgba(246,243,238,0.05)',
      lakeTop: night ? '#1A3640' : golden ? '#20424D' : '#1C3B46',
      lakeBottom: night ? '#0D1F28' : golden ? '#122B34' : '#10242C',
      shimmer: night ? 'rgba(246,243,238,0.22)' : 'rgba(233,201,126,0.30)',
      wall: night ? 'rgba(246,243,238,0.16)' : 'rgba(246,243,238,0.11)',
      roof: night ? 'rgba(246,243,238,0.22)' : 'rgba(246,243,238,0.17)',
      stroke: '#D9C08A',
      glass: night ? 'rgba(168,195,204,0.22)' : 'rgba(168,195,204,0.30)',
      glow: night ? 0.95 : golden ? 0.6 : 0.22,
      glowFill: '#E8C97E',
      tree: winter ? '#2C4839' : '#2F5843',
      treeDim: winter ? '#223A2E' : '#24462F',
      lawn: winter ? 0.14 : 0.22,
      mist: Math.min(0.5, (night ? 0.18 : golden ? 0.26 : 0.12) * (winter ? 1.8 : 1)),
      wash: night ? 0.34 : golden ? 0.14 : 0,
      washColor: night ? '#07120E' : '#3A2A12',
      sunOpacity: golden ? 0.85 : night ? 0 : 0.5,
      moonOpacity: night ? 0.95 : 0,
      label: '#F6F3EE',
      halo: 'rgba(7,18,14,0.85)',
      route: '#E8C97E',
    };
  }, [tod, season]);
}

type Palette = ReturnType<typeof useAmbience>;

// ── SVG scenery helpers ─────────────────────────────────────────────────────

/** A gabled cottage footprint: ground shadow, walls, roof, glowing windows. */
function Cottage({
  x,
  y,
  w,
  h,
  lift,
  p,
  glowCoef = 0.65,
  active = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lift: number;
  p: Palette;
  glowCoef?: number;
  active?: boolean;
}) {
  const cx = x + w / 2;
  return (
    <g className={cn('lsex-b', active && 'lsex-active')} aria-hidden="true">
      <ellipse cx={cx} cy={y + h + 3} rx={w / 2 + 9} ry={5} fill="#000000" opacity={0.22} />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={1}
        style={{ fill: p.wall, transition: 'fill .8s ease' }}
        stroke={p.stroke}
        strokeWidth={1.2}
        strokeOpacity={0.85}
      />
      <rect
        x={x + 10}
        y={y + h * 0.34}
        width={w - 20}
        height={h * 0.46}
        style={{ fill: p.glowFill, opacity: p.glow * glowCoef, transition: 'opacity .8s ease, fill .8s ease' }}
      />
      <path
        d={`M ${x - 6} ${y} L ${cx} ${y - lift} L ${x + w + 6} ${y} Z`}
        style={{ fill: p.roof, transition: 'fill .8s ease' }}
        stroke={p.stroke}
        strokeWidth={1.2}
        strokeOpacity={0.9}
        strokeLinejoin="round"
      />
    </g>
  );
}

/** Canopy cluster — three soft discs, the atlas way to draw a tree. */
function Copse({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: Palette }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} aria-hidden="true">
      <circle cx={-6} cy={0} r={7} style={{ fill: p.tree, transition: 'fill .8s ease' }} opacity={0.8} />
      <circle cx={4} cy={-4} r={9} style={{ fill: p.treeDim, transition: 'fill .8s ease' }} opacity={0.9} />
      <circle cx={8} cy={4} r={5.5} style={{ fill: p.tree, transition: 'fill .8s ease' }} opacity={0.65} />
    </g>
  );
}

/** Minimal antelope glyph with a haloed label. */
function Antelope({
  x,
  y,
  label,
  p,
  s = 0.9,
}: {
  x: number;
  y: number;
  label: string;
  p: Palette;
  s?: number;
}) {
  const fill = '#C9BFA8';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} aria-hidden="true">
      <ellipse cx={0} cy={-8} rx={10} ry={5} fill={fill} opacity={0.85} />
      <circle cx={9} cy={-14} r={3} fill={fill} opacity={0.85} />
      <path d="M 10 -16 L 13 -21 M 11.5 -15 L 15 -19" stroke={fill} strokeWidth={1.2} strokeLinecap="round" opacity={0.85} />
      <path d="M -6 -3 L -6 4 M -2 -3 L -2 4 M 3 -3 L 3 4 M 7 -3 L 7 4" stroke={fill} strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
      <text
        x={0}
        y={16}
        textAnchor="middle"
        fontSize={9}
        fontWeight={600}
        letterSpacing={1}
        fill={p.label}
        opacity={0.85}
        stroke={p.halo}
        strokeWidth={3}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {label}
      </text>
    </g>
  );
}

// ── Map hotspot ─────────────────────────────────────────────────────────────

function Hotspot({
  routeKey,
  x,
  y,
  label,
  active,
  p,
  onSelect,
}: {
  routeKey: RouteKey;
  x: number;
  y: number;
  label: string;
  active: boolean;
  p: Palette;
  onSelect: (routeKey: RouteKey) => void;
}) {
  const handleKey = (e: ReactKeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(routeKey);
    }
  };
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${label} — show details`}
      aria-pressed={active}
      className="lsex-hotspot"
      data-active={active ? 'true' : undefined}
      onClick={() => onSelect(routeKey)}
      onKeyDown={handleKey}
    >
      {/* enlarged invisible hit area for touch */}
      <circle cx={x} cy={y} r={22} fill="transparent" />
      <circle className="lsex-pulse" cx={x} cy={y} r={14} fill="#E8C97E" opacity={0.28} />
      {active && (
        <circle cx={x} cy={y} r={11.5} fill="none" stroke="#E8C97E" strokeWidth={1.2} strokeDasharray="3 4" opacity={0.9} />
      )}
      <circle
        cx={x}
        cy={y}
        r={active ? 6.5 : 5}
        fill="#E8C97E"
        stroke={active ? '#0A1B15' : '#F6F3EE'}
        strokeWidth={active ? 2.5 : 1.5}
      />
      <text
        x={x}
        y={y + 25}
        textAnchor="middle"
        fontSize={10.5}
        fontWeight={active ? 700 : 600}
        letterSpacing={0.4}
        fill={active ? '#E8C97E' : p.label}
        opacity={active ? 1 : 0.92}
        stroke={p.halo}
        strokeWidth={3.5}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {label}
      </text>
    </g>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function EstateExplorer() {
  const [selected, setSelected] = useState<SpaceId>('marble-reception');
  const [routeKey, setRouteKey] = useState<RouteKey>('reception');
  const [tod, setTod] = useState<TimeOfDay>('golden');
  const [season, setSeason] = useState<Season>('summer');

  // Planner state
  const [guests, setGuests] = useState(120);
  const [danceFloor, setDanceFloor] = useState(true);
  const [dayId, setDayId] = useState<DayId>('sat');

  const reduce = useReducedMotion() ?? false;
  const space = SPACE_BY_ID.get(selected) ?? SPACES[1];
  const p = useAmbience(tod, season);

  const pick = (key: RouteKey, id: SpaceId) => {
    setRouteKey(key);
    setSelected(id);
  };

  // ── URL hash sync (#space=<id>) ───────────────────────────────────────────
  useEffect(() => {
    const m = window.location.hash.match(/#space=([a-z-]+)/);
    if (m && SPACE_BY_ID.has(m[1] as SpaceId)) {
      // One-time mount read of an external system (the URL) — cannot be
      // derived during SSR render, so an effect is the right place.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(m[1] as SpaceId);
    }
  }, []);

  const hashSynced = useRef(false);
  useEffect(() => {
    // Skip the very first run so a foreign anchor hash is never clobbered.
    if (!hashSynced.current) {
      hashSynced.current = true;
      return;
    }
    window.history.replaceState(null, '', `#space=${selected}`);
  }, [selected]);

  // ── Dance floor auto-off over capacity ────────────────────────────────────
  const overDance = guests > PRICING.capacity.withDanceFloor;
  const danceActive = danceFloor && !overDance;

  const day = DAY_OPTIONS.find((d) => d.id === dayId) ?? DAY_OPTIONS[0];
  const minAdults = useMemo(() => minAdultsFor(classifyDate(day.date)), [day.date]);
  const tables = Math.ceil(guests / 10);

  const seePrice = () => {
    window.dispatchEvent(
      new CustomEvent('lakeside:estimate-guests', {
        detail: { guests, danceFloor: danceActive, dayType: day.id },
      }),
    );
  };

  // ── Table-map geometry (floor-plan grade) ────────────────────────────────
  const COLS = 5;
  const CELL = 58;
  const DANCE_SPANS = 3; // the dance floor occupies three cells of row one
  const danceCells = danceActive ? DANCE_SPANS : 0;
  const totalCells = danceCells + tables;
  const planRows = Math.ceil(totalCells / COLS);
  const planW = COLS * CELL;
  const planH = planRows * CELL + 14;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section
      aria-label="Interactive estate atlas and seating planner"
      className="relative overflow-hidden bg-pine-900 py-14 text-marble-50 sm:py-20"
    >
      <style>{`
        .lsex-hotspot { cursor: pointer; transition: transform .25s ease; transform-box: fill-box; transform-origin: center; }
        .lsex-hotspot:hover, .lsex-hotspot:focus-visible { transform: scale(1.12); }
        .lsex-hotspot:focus-visible { outline: 2px dashed #E8C97E; outline-offset: 4px; }
        .lsex-hotspot circle { transform-box: fill-box; transform-origin: center; }
        @keyframes lsex-pulse {
          0% { transform: scale(.55); opacity: .55; }
          70% { transform: scale(1.7); opacity: 0; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .lsex-pulse { animation: lsex-pulse 2.6s ease-out infinite; }
        .lsex-route-draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: lsex-draw 1.2s cubic-bezier(.4,0,.2,1) forwards;
        }
        @keyframes lsex-draw { to { stroke-dashoffset: 0; } }
        .lsex-route-dash { animation: lsex-march 16s linear infinite; }
        @keyframes lsex-march { to { stroke-dashoffset: -136; } }
        .lsex-b { transition: opacity .5s ease; }
        svg.lsex-focused .lsex-b { opacity: .6; }
        svg.lsex-focused .lsex-active { opacity: 1; }
        .lsex-active { filter: drop-shadow(0 0 7px rgba(232,201,126,0.45)); }
        .lsex-active rect, .lsex-active path { stroke: #EFD9A0; }
        @media (prefers-reduced-motion: reduce) {
          .lsex-pulse, .lsex-route-dash { animation: none; }
          .lsex-route-draw { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -left-24 top-10 h-80 w-80 opacity-25" />
      <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -right-20 bottom-10 h-72 w-72 opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Reading line — replaces the old duplicate heading */}
        <div className="mb-7 flex flex-wrap items-center gap-x-7 gap-y-2.5 text-[13px] text-marble-100/75">
          <span className="inline-flex items-center gap-2.5">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300/70 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-gold-300" />
            </span>
            Tap a brass dot — a gold route draws your two-minute walk
          </span>
          <span className="inline-flex items-center gap-2.5">
            <span aria-hidden="true" className="wax-dot size-[5px]" />
            The ambience pills retint the whole atlas
          </span>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* ── Atlas panel ── */}
          <div className="glass-card rounded-[6px] p-3 sm:p-4">
            {/* Ambience pills */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Time of day (illustrative)"
                className="flex flex-wrap gap-1.5 rounded-full border border-white/10 bg-white/5 p-1"
              >
                {(
                  [
                    { id: 'morning', label: 'Morning' },
                    { id: 'golden', label: 'Golden hour' },
                    { id: 'night', label: 'Night' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={tod === t.id}
                    onClick={() => setTod(t.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
                      tod === t.id
                        ? 'bg-brass-500 text-pine-950'
                        : 'text-marble-100/75 hover:text-marble-50',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div
                role="group"
                aria-label="Season (illustrative)"
                className="flex gap-1.5 rounded-full border border-white/10 bg-white/5 p-1"
              >
                {(
                  [
                    { id: 'summer', label: 'Summer' },
                    { id: 'winter', label: 'Winter' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={season === s.id}
                    onClick={() => setSeason(s.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
                      season === s.id
                        ? 'bg-brass-500 text-pine-950'
                        : 'text-marble-100/75 hover:text-marble-50',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <span className="eyebrow ml-auto rounded-full border border-brass-500/40 px-2 py-0.5 text-brass-400">
                Illustrative
              </span>
            </div>

            {/* The atlas */}
            <svg
              viewBox="0 0 800 600"
              role="group"
              aria-label="Illustrated plan of The Lakeside estate with selectable location markers"
              className="lsex-focused block h-auto w-full rounded-[6px]"
            >
              <title>The Lakeside — illustrated estate atlas</title>
              <desc>
                A dark, gold-lined plan: the lake at centre, the glass chapel
                north-west, the white marble reception on the water&apos;s edge,
                canapé lawns, beauty room and bridal suite, heritage and manor
                houses, the groom&apos;s cabin, tree clusters and wildlife on
                the grassland. A gold walking route links the arrival gate to
                the selected space. Brass dots are selectable.
              </desc>
              <defs>
                <linearGradient id="lsatlas-canvas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: p.canvasTop, transition: 'stop-color .8s ease' }} />
                  <stop offset="100%" style={{ stopColor: p.canvasBottom, transition: 'stop-color .8s ease' }} />
                </linearGradient>
                <linearGradient id="lsatlas-lake" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: p.lakeTop, transition: 'stop-color .8s ease' }} />
                  <stop offset="100%" style={{ stopColor: p.lakeBottom, transition: 'stop-color .8s ease' }} />
                </linearGradient>
                <radialGradient id="lsatlas-vignette" cx="50%" cy="42%" r="78%">
                  <stop offset="58%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
                </radialGradient>
                <pattern id="lsatlas-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke={p.grid} strokeWidth="0.6" />
                </pattern>
                <filter id="lsatlas-mist" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
              </defs>

              {/* Canvas + graticule */}
              <rect x={6} y={6} width={788} height={588} rx={6} fill="url(#lsatlas-canvas)" />
              <rect x={6} y={6} width={788} height={588} rx={6} fill="url(#lsatlas-grid)" aria-hidden="true" />

              {/* Topographic contours */}
              <g fill="none" stroke={p.contour} strokeWidth={1} aria-hidden="true">
                <path d="M -20 218 C 120 198, 260 244, 420 226 C 560 210, 700 244, 820 228" />
                <path d="M -20 296 C 140 276, 300 330, 470 310 C 620 294, 740 332, 820 316" />
                <path d="M -20 372 C 160 356, 320 404, 480 388 C 630 372, 730 404, 820 390" />
                <path d="M -20 452 C 150 436, 330 482, 500 464 C 640 450, 740 482, 820 468" />
                <path d="M -20 530 C 170 516, 340 556, 520 540 C 660 528, 750 552, 820 542" />
                <path d="M -20 150 C 180 132, 380 172, 560 152 C 680 138, 760 158, 820 148" />
              </g>

              {/* Sun / moon */}
              {tod === 'morning' && (
                <g aria-hidden="true" style={{ opacity: p.sunOpacity, transition: 'opacity .8s ease' }}>
                  <circle cx={170} cy={88} r={40} fill="#F6F3EE" opacity={0.14} />
                  <circle cx={170} cy={88} r={18} fill="#F6F3EE" opacity={0.75} />
                </g>
              )}
              {tod === 'golden' && (
                <g aria-hidden="true" style={{ opacity: p.sunOpacity, transition: 'opacity .8s ease' }}>
                  <circle cx={572} cy={112} r={46} fill="#E8C97E" opacity={0.13} />
                  <circle cx={572} cy={112} r={15} fill="#E8C97E" opacity={0.8} />
                </g>
              )}
              {tod === 'night' && (
                <g aria-hidden="true" style={{ opacity: p.moonOpacity, transition: 'opacity .8s ease' }}>
                  <circle cx={655} cy={64} r={15} fill="#F6F3EE" opacity={0.9} />
                  <circle cx={662} cy={58} r={13} fill={p.canvasTop} />
                </g>
              )}

              {/* Lake */}
              <path
                d="M 395 292 C 428 252, 492 236, 556 246 C 622 256, 668 292, 660 348 C 652 404, 592 444, 516 446 C 448 448, 398 420, 384 372 C 374 340, 380 312, 395 292 Z"
                fill="url(#lsatlas-lake)"
                stroke={p.stroke}
                strokeOpacity={0.3}
                strokeWidth={1.2}
                style={{ transition: 'fill .8s ease' }}
              />
              <g aria-hidden="true" stroke={p.shimmer} strokeWidth={1.3} strokeDasharray="5 8" strokeLinecap="round" fill="none" style={{ transition: 'stroke .8s ease' }}>
                <path d="M 440 320 C 470 310, 510 308, 540 316" />
                <path d="M 470 372 C 500 364, 545 362, 580 370" />
                <path d="M 442 412 C 480 406, 520 406, 552 412" />
              </g>

              {/* Canapé lawns + bar */}
              <g className={cn('lsex-b', selected === 'canape-lawns' && 'lsex-active')} aria-hidden="true">
                <rect
                  x={252}
                  y={462}
                  width={176}
                  height={78}
                  rx={12}
                  style={{ fill: p.tree, opacity: p.lawn, transition: 'fill .8s ease, opacity .8s ease' }}
                  stroke={p.stroke}
                  strokeOpacity={0.35}
                  strokeDasharray="4 6"
                />
                <path
                  d="M 258 470 C 300 488, 380 488, 422 470"
                  fill="none"
                  stroke={p.stroke}
                  strokeWidth={1.4}
                  strokeDasharray="1 7"
                  strokeLinecap="round"
                  opacity={0.8}
                />
                <rect x={316} y={486} width={30} height={18} rx={2} style={{ fill: p.wall, transition: 'fill .8s ease' }} stroke={p.stroke} strokeWidth={1} strokeOpacity={0.8} />
                <circle cx={280} cy={520} r={3} fill={p.glowFill} opacity={0.5 * p.glow + 0.15} />
                <circle cx={300} cy={528} r={3} fill={p.glowFill} opacity={0.4 * p.glow + 0.15} />
                <circle cx={382} cy={524} r={3} fill={p.glowFill} opacity={0.45 * p.glow + 0.15} />
              </g>

              {/* Walking routes — the gold line to the selected space */}
              <g key={routeKey} aria-hidden="true">
                <path
                  d={ROUTES[routeKey]}
                  pathLength={1}
                  className="lsex-route-draw"
                  fill="none"
                  stroke={p.route}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <path
                  d={ROUTES[routeKey]}
                  className="lsex-route-dash"
                  fill="none"
                  stroke={p.route}
                  strokeWidth={1.1}
                  strokeDasharray="0.5 9"
                  strokeLinecap="round"
                  opacity={0.6}
                />
              </g>

              {/* Arrival gate */}
              <g aria-hidden="true">
                <path d="M 44 560 L 44 548 A 8 8 0 0 1 60 548 L 60 560" fill="none" stroke={p.route} strokeWidth={1.4} opacity={0.9} />
                <circle cx={52} cy={560} r={2.2} fill={p.route} />
                <text x={52} y={574} textAnchor="middle" fontSize={8.5} fontWeight={600} letterSpacing={1.5} fill={p.label} opacity={0.8} stroke={p.halo} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
                  ARRIVAL
                </text>
              </g>

              {/* Glass chapel (north-west) */}
              <g className={cn('lsex-b', selected === 'glass-chapel' && 'lsex-active')} aria-hidden="true">
                <ellipse cx={180} cy={216} rx={72} ry={5} fill="#000000" opacity={0.22} />
                <rect
                  x={118}
                  y={148}
                  width={124}
                  height={64}
                  style={{ fill: p.glass, transition: 'fill .8s ease' }}
                  stroke={p.stroke}
                  strokeWidth={1.2}
                  strokeOpacity={0.9}
                />
                <rect
                  x={124}
                  y={172}
                  width={112}
                  height={36}
                  style={{ fill: p.glowFill, opacity: p.glow * 0.85, transition: 'opacity .8s ease, fill .8s ease' }}
                />
                <g stroke="#0A1B15" opacity={0.28}>
                  <line x1={146} y1={150} x2={146} y2={210} />
                  <line x1={180} y1={150} x2={180} y2={210} />
                  <line x1={214} y1={150} x2={214} y2={210} />
                </g>
                <path
                  d="M 110 148 L 180 104 L 250 148 Z"
                  style={{ fill: p.roof, transition: 'fill .8s ease' }}
                  stroke={p.stroke}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
              </g>

              {/* Beauty room + bridal suite */}
              <g className={cn('lsex-b', selected === 'beauty-bridal' && 'lsex-active')} aria-hidden="true">
                <Cottage x={64} y={252} w={64} h={44} lift={20} p={p} glowCoef={0.7} active={selected === 'beauty-bridal'} />
                <Cottage x={64} y={312} w={64} h={44} lift={20} p={p} glowCoef={0.7} active={selected === 'beauty-bridal'} />
              </g>

              {/* Heritage house */}
              <g className={cn('lsex-b', selected === 'heritage-manor' && 'lsex-active')} aria-hidden="true">
                <Cottage x={150} y={352} w={96} h={58} lift={34} p={p} glowCoef={0.6} active={selected === 'heritage-manor'} />
              </g>

              {/* Manor house */}
              <g className={cn('lsex-b', selected === 'heritage-manor' && 'lsex-active')} aria-hidden="true">
                <Cottage x={118} y={468} w={124} h={66} lift={48} p={p} glowCoef={0.6} active={selected === 'heritage-manor'} />
              </g>

              {/* White marble reception on the water's edge + deck */}
              <g className={cn('lsex-b', selected === 'marble-reception' && 'lsex-active')} aria-hidden="true">
                <ellipse cx={460} cy={410} rx={78} ry={5} fill="#000000" opacity={0.2} />
                <rect
                  x={522}
                  y={350}
                  width={58}
                  height={44}
                  style={{ fill: 'rgba(217,200,169,0.32)', transition: 'fill .8s ease' }}
                  stroke={p.stroke}
                  strokeWidth={1}
                  strokeOpacity={0.8}
                />
                <line x1={526} y1={364} x2={576} y2={364} stroke={p.stroke} strokeWidth={0.7} opacity={0.4} />
                <line x1={526} y1={378} x2={576} y2={378} stroke={p.stroke} strokeWidth={0.7} opacity={0.4} />
                <rect
                  x={398}
                  y={330}
                  width={124}
                  height={76}
                  style={{ fill: p.wall, transition: 'fill .8s ease' }}
                  stroke={p.stroke}
                  strokeWidth={1.4}
                  strokeOpacity={0.9}
                />
                <rect
                  x={410}
                  y={352}
                  width={100}
                  height={42}
                  style={{ fill: p.glowFill, opacity: p.glow, transition: 'opacity .8s ease, fill .8s ease' }}
                />
                <g stroke="#0A1B15" opacity={0.26}>
                  <line x1={435} y1={354} x2={435} y2={392} />
                  <line x1={460} y1={354} x2={460} y2={392} />
                  <line x1={485} y1={354} x2={485} y2={392} />
                </g>
                <path
                  d="M 390 330 L 460 294 L 530 330 Z"
                  style={{ fill: p.roof, transition: 'fill .8s ease' }}
                  stroke={p.stroke}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
                {/* reflection in the lake */}
                <path d="M 414 408 L 460 434 L 506 408 Z" fill="#F6F3EE" opacity={0.07} />
              </g>

              {/* Groom's cabin */}
              <g className={cn('lsex-b', selected === 'grooms-cabin' && 'lsex-active')} aria-hidden="true">
                <Cottage x={646} y={496} w={74} h={44} lift={24} p={p} glowCoef={0.6} active={selected === 'grooms-cabin'} />
              </g>

              {/* Tree clusters */}
              <Copse x={330} y={122} s={1.1} p={p} />
              <Copse x={358} y={136} s={0.8} p={p} />
              <Copse x={306} y={138} s={0.7} p={p} />
              <Copse x={706} y={116} s={1} p={p} />
              <Copse x={734} y={132} s={0.75} p={p} />
              <Copse x={762} y={252} s={0.9} p={p} />
              <Copse x={740} y={274} s={0.65} p={p} />
              <Copse x={62} y={212} s={0.9} p={p} />
              <Copse x={90} y={226} s={0.65} p={p} />
              <Copse x={700} y={428} s={0.85} p={p} />
              <Copse x={726} y={444} s={0.6} p={p} />
              <Copse x={352} y={566} s={0.85} p={p} />
              <Copse x={380} y={576} s={0.6} p={p} />
              <Copse x={520} y={562} s={0.8} p={p} />
              <Copse x={548} y={574} s={0.55} p={p} />
              <Copse x={302} y={212} s={0.7} p={p} />
              <Copse x={640} y={196} s={0.8} p={p} />

              {/* Wildlife */}
              <Antelope x={680} y={236} label="Zebra" p={p} />
              <Antelope x={756} y={266} label="Sable" p={p} s={0.8} />
              <Antelope x={694} y={336} label="Gemsbok" p={p} s={0.8} />

              {/* Ambience wash */}
              <rect
                x={6}
                y={6}
                width={788}
                height={588}
                rx={6}
                fill={p.washColor}
                opacity={p.wash}
                style={{ transition: 'opacity .8s ease' }}
                aria-hidden="true"
              />

              {/* Mist over the lake */}
              <g filter="url(#lsatlas-mist)" aria-hidden="true">
                <ellipse cx={480} cy={300} rx={90} ry={18} fill="#F6F3EE" opacity={p.mist} style={{ transition: 'opacity .8s ease' }} />
                <ellipse cx={580} cy={370} rx={80} ry={16} fill="#F6F3EE" opacity={p.mist * 0.8} style={{ transition: 'opacity .8s ease' }} />
                <ellipse cx={470} cy={420} rx={70} ry={13} fill="#F6F3EE" opacity={p.mist * 0.6} style={{ transition: 'opacity .8s ease' }} />
              </g>

              {/* Vignette + frame */}
              <rect x={6} y={6} width={788} height={588} rx={6} fill="url(#lsatlas-vignette)" aria-hidden="true" />
              <rect x={6} y={6} width={788} height={588} rx={6} fill="none" stroke="#B89B6A" strokeWidth={1.2} opacity={0.75} />
              <g stroke="#E8C97E" strokeWidth={1.6} opacity={0.9} aria-hidden="true">
                <path d="M 6 22 L 6 6 L 22 6" fill="none" />
                <path d="M 778 6 L 794 6 L 794 22" fill="none" />
                <path d="M 794 578 L 794 594 L 778 594" fill="none" />
                <path d="M 22 594 L 6 594 L 6 578" fill="none" />
              </g>

              {/* Compass rose */}
              <g transform="translate(742 62)" aria-hidden="true">
                <circle r={26} fill="none" stroke={p.stroke} strokeWidth={0.8} opacity={0.55} />
                <circle r={19} fill="none" stroke={p.stroke} strokeWidth={0.6} opacity={0.35} />
                <g stroke={p.stroke} strokeWidth={1} opacity={0.6}>
                  <line x1={0} y1={-26} x2={0} y2={-20} />
                  <line x1={0} y1={20} x2={0} y2={26} />
                  <line x1={-26} y1={0} x2={-20} y2={0} />
                  <line x1={20} y1={0} x2={26} y2={0} />
                </g>
                <path d="M 0 -14 L 3.5 0 L 0 5 L -3.5 0 Z" fill="#E8C97E" opacity={0.95} />
                <text x={0} y={-33} textAnchor="middle" fontSize={9} fontWeight={700} letterSpacing={2} fill={p.label} opacity={0.85}>
                  N
                </text>
              </g>

              {/* Scale bar */}
              <g aria-hidden="true" transform="translate(700 578)">
                <line x1={0} y1={0} x2={70} y2={0} stroke={p.label} strokeWidth={1} opacity={0.55} />
                <line x1={0} y1={-4} x2={0} y2={4} stroke={p.label} strokeWidth={1} opacity={0.55} />
                <line x1={35} y1={-3} x2={35} y2={3} stroke={p.label} strokeWidth={1} opacity={0.55} />
                <line x1={70} y1={-4} x2={70} y2={4} stroke={p.label} strokeWidth={1} opacity={0.55} />
                <text x={35} y={-8} textAnchor="middle" fontSize={8} letterSpacing={1.5} fill={p.label} opacity={0.6}>
                  ≈ 80 M
                </text>
              </g>

              {/* Hotspots */}
              <Hotspot routeKey="chapel" x={180} y={76} label="Glass Chapel" active={selected === 'glass-chapel'} p={p} onSelect={(k) => pick(k, 'glass-chapel')} />
              <Hotspot routeKey="reception" x={460} y={266} label="Marble Reception" active={selected === 'marble-reception'} p={p} onSelect={(k) => pick(k, 'marble-reception')} />
              <Hotspot routeKey="lake" x={560} y={420} label="The Lake" active={selected === 'lake-waterfront'} p={p} onSelect={(k) => pick(k, 'lake-waterfront')} />
              <Hotspot routeKey="lawns" x={292} y={514} label="Canapé Lawns" active={selected === 'canape-lawns'} p={p} onSelect={(k) => pick(k, 'canape-lawns')} />
              <Hotspot routeKey="beauty" x={96} y={302} label="Beauty & Bridal" active={selected === 'beauty-bridal'} p={p} onSelect={(k) => pick(k, 'beauty-bridal')} />
              <Hotspot routeKey="groom" x={738} y={516} label="Groom’s Cabin" active={selected === 'grooms-cabin'} p={p} onSelect={(k) => pick(k, 'grooms-cabin')} />
              <Hotspot routeKey="heritage" x={198} y={340} label="Heritage House" active={selected === 'heritage-manor'} p={p} onSelect={(k) => pick(k, 'heritage-manor')} />
              <Hotspot routeKey="manor" x={180} y={448} label="Manor House" active={selected === 'heritage-manor'} p={p} onSelect={(k) => pick(k, 'heritage-manor')} />
              <Hotspot routeKey="wildlife" x={712} y={300} label="Wildlife" active={selected === 'wildlife'} p={p} onSelect={(k) => pick(k, 'wildlife')} />
            </svg>

            <p className="mt-3 text-[11px] leading-relaxed text-marble-100/60">
              Tap a brass dot for details · routes are the walking lines from
              the arrival gate · illustrative plan, not to scale.
            </p>
          </div>

          {/* ── Detail panel ── */}
          <aside
            aria-live="polite"
            className="glass-card relative overflow-hidden rounded-[6px] p-5 sm:p-6"
          >
            {/* watermark numeral */}
            <span
              aria-hidden="true"
              className="font-display pointer-events-none absolute -top-3 right-3 select-none text-[6.5rem] leading-none text-marble-50/[0.06]"
            >
              {space.num}
            </span>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selected}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="relative"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="eyebrow text-brass-400">Selected space</p>
                  <p className="eyebrow tabular text-marble-100/60">
                    {space.num} / 08
                  </p>
                </div>
                <h3 className="font-display mt-2 text-2xl text-marble-50">
                  {space.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-marble-100/85">
                  {space.blurb}
                </p>

                <div className="brass-hairline my-4" aria-hidden="true" />

                <ul className="space-y-2">
                  {space.facts.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-marble-100/90">
                      <span
                        aria-hidden="true"
                        className="mt-[7px] size-1.5 shrink-0 rotate-45 bg-brass-400"
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {space.thumbs.map((key) => {
                    const img = IMG_BY_KEY.get(key);
                    return (
                      <div
                        key={key}
                        className="group h-20 overflow-hidden rounded-[5px] border border-white/10 transition-colors hover:border-brass-400/60 sm:h-24"
                        style={{
                          backgroundImage: `url(/img/${key}-blur.webp)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        <img
                          src={`/img/${key}-s.webp`}
                          alt={img?.alt ?? key}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="btn-shine gold-surface flex-1 rounded-full font-semibold text-pine-950"
                  >
                    <a href="#visit">
                      <CalendarCheck className="size-4" aria-hidden="true" />
                      Book a viewing
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 rounded-full border-gold-300/40 bg-transparent text-marble-50 hover:border-gold-300/70 hover:bg-white/10 hover:text-marble-50"
                  >
                    <a
                      href={WA_LINK(
                        `Hi The Lakeside! We'd love to book a viewing — we're interested in the ${space.name} for our wedding.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="size-4 text-gold-300" aria-hidden="true" />
                      WhatsApp us
                    </a>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>

        {/* ── Seating & capacity planner ── */}
        <div className="glass-card mt-6 rounded-[6px] p-5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h3
                  id="estate-planner-heading"
                  className="font-display text-2xl text-marble-50"
                >
                  Seating &amp; capacity planner
                </h3>
                <span className="eyebrow rounded-full border border-brass-500/40 px-2 py-0.5 text-brass-400">
                  Illustrative
                </span>
              </div>

              <div className="mt-5 flex items-end gap-3">
                <span className="font-display tabular text-5xl leading-none text-brass-400">
                  {guests}
                </span>
                <span className="pb-1 text-sm text-marble-100/80">guests</span>
              </div>
              <Slider
                value={[guests]}
                onValueChange={(v) => setGuests(v[0] ?? 120)}
                min={20}
                max={200}
                step={1}
                aria-label="Number of guests"
                className="mt-4 [&_[data-slot=slider-range]]:bg-brass-500 [&_[data-slot=slider-track]]:bg-white/15"
              />
              <div className="mt-1.5 flex justify-between text-[10px] text-marble-100/50">
                <span>20</span>
                <span>200 guests max</span>
              </div>

              {/* Dance floor */}
              <div className="mt-5 flex items-center gap-3">
                <Switch
                  id="lsex-dancefloor"
                  checked={danceActive}
                  onCheckedChange={(v) => setDanceFloor(v)}
                  disabled={overDance}
                  aria-label="Include a dance floor"
                  className="data-[state=checked]:bg-brass-500 data-[state=unchecked]:bg-white/20"
                />
                <label
                  htmlFor="lsex-dancefloor"
                  className="text-sm font-medium text-marble-50"
                >
                  Dance floor
                </label>
              </div>
              {overDance && (
                <p
                  role="status"
                  className="mt-2 rounded-[4px] border border-brass-500/40 bg-brass-500/10 px-3 py-2 text-xs leading-relaxed text-brass-400"
                >
                  The marble reception holds {PRICING.capacity.withDanceFloor}{' '}
                  with a dance floor or {PRICING.capacity.max} without — dance
                  floor disabled for {guests} guests.
                </p>
              )}

              {/* Live computation */}
              <p aria-live="polite" className="tabular mt-5 text-sm text-marble-100/90">
                ≈ {tables} round table{tables === 1 ? '' : 's'} of 10 · {guests}{' '}
                chairs
              </p>

              {/* Day-type minimum note */}
              <div
                role="group"
                aria-label="Day of the week"
                className="mt-4 flex flex-wrap gap-1.5"
              >
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={dayId === d.id}
                    onClick={() => setDayId(d.id)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                      dayId === d.id
                        ? 'border-brass-500 bg-brass-500 text-pine-900'
                        : 'border-marble-50/25 text-marble-100 hover:border-brass-400',
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="tabular mt-2 text-xs text-marble-100/75">
                {day.ruleLabel}: {minAdults} minimum paying adults
                {guests < minAdults
                  ? ` — your date is priced at ${minAdults} guests`
                  : ''}
                .
              </p>

              {/* CTA */}
              <Button
                asChild
                className="btn-shine gold-surface mt-6 rounded-full px-6 font-semibold text-pine-950"
              >
                <a href="#estimate" onClick={seePrice}>
                  See the price for {guests} guests
                </a>
              </Button>

              <p className="mt-3 text-[11px] text-marble-100/55">
                Illustrative plan, not to scale. Final numbers are confirmed at
                your decor meeting.
              </p>
            </div>

            {/* Floor plan */}
            <div className="flex flex-col items-center justify-center rounded-[6px] border border-brass-500/20 bg-pine-900/60 p-4">
              <svg
                viewBox={`0 0 ${planW} ${planH}`}
                role="img"
                aria-label={`Floor plan illustration: ${tables} round tables of 10 guests each${danceActive ? ' with a dance floor' : ''}`}
                className="h-auto w-full max-w-sm"
              >
                <AnimatePresence initial={false}>
                  {danceActive && (
                    <motion.g
                      key="dance"
                      initial={reduce ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduce ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <rect
                        x={8}
                        y={9}
                        width={DANCE_SPANS * CELL - 16}
                        height={CELL - 18}
                        rx={10}
                        fill="none"
                        stroke="#E8C97E"
                        strokeWidth={1.4}
                        strokeDasharray="5 6"
                        opacity={0.9}
                      />
                      <text
                        x={8 + (DANCE_SPANS * CELL - 16) / 2}
                        y={9 + (CELL - 18) / 2 + 3.5}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        letterSpacing={2.5}
                        fill="#E8C97E"
                      >
                        DANCE FLOOR
                      </text>
                    </motion.g>
                  )}
                  {Array.from({ length: tables }, (_, i) => {
                    const cellIndex = danceCells + i;
                    const col = cellIndex % COLS;
                    const row = Math.floor(cellIndex / COLS);
                    const cx = CELL / 2 + col * CELL;
                    const cy = CELL / 2 + 5 + row * CELL;
                    return (
                      <motion.g
                        key={i}
                        initial={reduce ? false : { opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? undefined : { opacity: 0, scale: 0.4 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                      >
                        {Array.from({ length: 10 }, (_, c) => {
                          const a = (c / 10) * Math.PI * 2 - Math.PI / 2;
                          return (
                            <circle
                              key={c}
                              cx={cx + Math.cos(a) * 20}
                              cy={cy + Math.sin(a) * 20}
                              r={2.6}
                              fill="#D9C8A9"
                            />
                          );
                        })}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={13}
                          fill="#F6F3EE"
                          stroke="#B89B6A"
                          strokeWidth={1.4}
                        />
                        <text
                          x={cx}
                          y={cy + 3.5}
                          textAnchor="middle"
                          fontSize={9.5}
                          fontWeight={700}
                          fill="#0A1B15"
                        >
                          {i + 1}
                        </text>
                      </motion.g>
                    );
                  })}
                </AnimatePresence>
              </svg>
              <p className="mt-3 text-[11px] text-marble-100/60">
                {tables} table{tables === 1 ? '' : 's'} of 10
                {danceActive ? ' · dance floor up front' : ''} — your
                coordinator refines the floor plan with you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
