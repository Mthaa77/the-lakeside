# The Lakeside — "Where Glass Meets Lake"

Premium single-page website for **The Lakeside**, a family-run wedding & events estate in Tiegerpoort, Pretoria East, South Africa.

A couple should *feel* the venue in 5 seconds, see their price in under a minute, and book a viewing in under 60 seconds.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **shadcn/ui** components, **framer-motion** reveals
- **Prisma + SQLite** for leads, quotes, viewings, availability
- Pure **pricing engine** (`src/lib/pricing-engine.ts`) — every rand on the site flows through it
- Self-hosted photography (`public/img/*.webp`, 84 images processed with sharp)

> The site is delivered as a single route (`/`) by design (sandbox constraint): all sections scroll-anchor and all tools are inline.

## The pricing engine (source of truth)

- `src/config/pricing.ts` — **the only place prices live**: 2026/2027 rate cards, venue hire by day, minimums, weekday tiers, deposits, add-ons, proposals, photoshoots, fees, SA public holidays.
- `src/lib/pricing-engine.ts` — pure functions: date classification (day type, public holiday + eve, winter, December), weekend-card estimates, weekday all-inclusive estimates, Thursday dual display, December fallback, payment schedule (T−6m / T−3m / T−6w / T−1m), cancellation bands.
- Verify all 24 vectors: `bun run scripts/test-pricing.ts` (Sat 100 = R198 000, top-up = R238 000, Fri 80 = R162 000, Sun 40 = R96 000, Sat 60→billed 80 = R172 000, weekday 45 = R93 000 indicative, 115 = price on request, Sat 2027 = R208 000, deposits R34 000 / R21 250, December fallback…).

## Interactive tools

| Tool | Where | Notes |
|---|---|---|
| Hero quick-check | `#top` | date + guests → estimate |
| Date checker | `#estimate` | day-type pricing overlay; **never invents availability** — no data ⇒ "Ask us" |
| Cost estimator | `#estimate` | 5-step stepper, itemised total, deposit, payment schedule, WhatsApp/share CTAs; saves quotes via `/api/quotes` |
| Weekday calculator | `#pricing` | tier slider 20–100 guests |
| Estate map + seating planner | `#explore` | SVG hotspots, time/season ambience, guest slider 20–200 with the 160-with-dance-floor rule |
| Glass atrium gallery | `#gallery` | CSS-3D arc + drag/keyboard + lightbox + classic masonry fallback |
| Viewing scheduler | `#visit` | in-person/virtual → `POST /api/viewings` → Lead + Viewing rows |
| FAQ + rules at a glance | `#faq` | client-side search, category chips |

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/viewings` | POST | Viewing request (zod-validated, rate-limited, honeypot) → Lead + Viewing |
| `/api/leads` | POST | Generic lead capture |
| `/api/quotes` | POST | Save estimator quote, returns short id |
| `/api/availability` | GET | Real availability rows only; empty ⇒ UI shows "Ask us" |

## Data model (Prisma / SQLite)

`Lead` (status pipeline + score) · `Quote` (short id, inputs/results JSON) · `Viewing` (mode, manage token) · `AvailabilityDay` (venue-edited only) · `FoodExperience` + `Rsvp` (tastings).

## Local development

```bash
bun run dev        # dev server on :3000
bun run lint       # eslint
bun run db:push    # sync prisma schema
bun run scripts/test-pricing.ts   # pricing vectors (24)
```

## Truthfulness rules honoured

- No invented reviews, ratings, awards, availability, scarcity or menus.
- Google rating is **hidden** (`SITE.rating.show = false`) until the client verifies it live.
- Everything unverified is flagged `TODO(CLIENT)` in code and `docs/TODO-CLIENT.md`.
- Image rights: photos belong to The Lakeside and its photographers — keep the deployment private until rights are confirmed.
