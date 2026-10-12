# TODO(CLIENT) — Open items requiring client input

Everything below is intentionally **not invented** on the website. Until confirmed, the site either stays silent or uses neutral wording.

## Identity & facts
- [ ] Confirm estate size (website says 130 ha, PDFs say 14 ha) — no hectare figure is published.
- [ ] Confirm exact coordinates + postcode for the address (379 Tiegerpoort Road, Plot 379).
- [ ] Confirm whether "+27 67 962 1014" is WhatsApp-enabled (WhatsApp CTAs assume yes).
- [ ] Pick ONE canonical public email (currently hello@ for viewings, info@ for contracts).
- [ ] Confirm the sister venue "@amara_venue" (architecture is venue-switcher-ready; nothing built).

## Proof & reputation
- [x] ~~Verify the live Google rating~~ — verified by the 12 Oct 2026 review: 4.8★ / ~390 reviews. Badge is live and auto-hides when `checkedAt` (2026-10-12) is > 60 days old. **Re-check the live rating before launch and update `checkedAt`.**
- [ ] Add the Google Business Profile URL in `SITE.rating.profileUrl` to make the rating badge clickable.
- [ ] Which awards / years? (LS-003 awards image exists but is not published — contents unconfirmed.)
- [x] ~~"Family-run since 1995"~~ — founding year NOT verified: removed everywhere (round 25). If the client later confirms a year, it can return deliberately.

## Pricing confirmations ("likely" items)
- [ ] Service-provider fee (unseated suppliers) — likely R560 (2026) → R600 (2027).
- [ ] Second main-meal choice per person — likely R170.
- [ ] Kosher surcharge amount.
- [ ] Nespresso bar 2027 price (R3 800 assumed from 2026 PDF).
- [ ] Winter specials (Jun–Aug): "contact us" shown; supply the special rates.
- [ ] Mon–Wed minimum guest count below 20 (T&Cs hint at 10; site shows 20).
- [ ] Weekday packages for 110+ guests — site says "price on request" (current site says 100+).

## Content & media
- [ ] **Hero photography: request original high-resolution files.** The current hero (LS-016) is the old site's ~1250px banner; a hero-grade replacement should be ≥ 2400px wide. The hero now sits in a framed, non-full-bleed mat as mitigation. (`scripts/inspect-images.ts` audits `/public/img`.)
- [ ] Confirm the giraffe photo (LS-055) origin — giraffes are not on the venue wildlife list; alt text was reworded to name no animal. Retire the image if it was not shot on the estate.
- [ ] Confirm whether Food Experiences are open to public RSVP before booking (list form assumes they are announce-only).
- [ ] Launch: switch `SITE.url` back to https://thelakeside.co.za, flip robots to index/follow, remove the Carter Digitals demo strip + footer line (`demo-strip.tsx`, footer legal bar).
- [ ] Team page: consent + photos + bios for Penelope, Callie, Chef Jenna, Adam, Abi, Kaye (welcome section credits Penelope & Callie by name).
- [ ] Chef Jenna portrait for the chef section (placeholder photo = plated course).
- [ ] Chapel ceremony capacity (NOT displayed anywhere — planner only enforces the 160/200 reception rule).
- [ ] Real weddings: consent + case-study content + supplier credits (gallery captions credit "venue photographers — TODO(CLIENT)").
- [ ] Photographer credits for each gallery image (manifest filenames only).
- [ ] Menu content + Food Experience dates/price (list form shown as concept only).
- [ ] 30–45s golden-hour hero film (a 10s AI-generated placeholder loop plays; a real cinematic film replaces it).
- [ ] Licensed lake-ambience audio loop (feature not enabled).
- [ ] GLB/photogrammetry estate model + 360 tour (Matterport/Kuula) if desired.
- [ ] Confirm drive times from Pretoria CBD / Menlyn / Johannesburg / OR Tambo.
- [ ] Opening/viewing hours for the contact block.
- [ ] Signed T&Cs PDF to host and link in the footer.

## Legal & operations
- [x] ~~Privacy policy page + data-deletion request path (POPIA) — not yet built.~~ **Built (round 10)**: plain-language POPIA notice at `/#privacy` + self-service access/correction/deletion form → `POST /api/privacy/request` (creates `source=privacy_request` leads, score 0). **Still open for the client:**
  - [ ] Formal signed privacy-policy PDF to host and link from `/#privacy`.
  - [ ] Register an Information Officer (POPIA s55) + give the site the registration details.
  - [ ] Decide who on the team actions `privacy_request` leads (visible in the team digest) and the response-time promise shown to visitors.
- [x] ~~Cookie/consent banner + analytics decisions (GA4 / Meta Pixel / Clarity) — none installed.~~ **Built (round 11)**: honest device-storage notice at the bottom of the page (`ConsentNotice`, "Your data, your device") — explains localStorage use (estimates, saved dates, preferences), states plainly that no ad trackers/analytics cookies exist, links to `/#privacy`. Answer persisted in `localStorage 'lakeside-consent'`; "Maybe later"/X dismiss for the page view only (asks again next visit until accepted — no dark pattern). **Still open for the client:**
  - [ ] If GA4 / Meta Pixel / Clarity is ever added, upgrade the notice to a real opt-in (the current copy explicitly promises no trackers — keep that true or change both).
  - [ ] Analytics decision itself (none installed today).
- [ ] Turnstile site key + secret for public forms.
- [ ] Team notification target for new leads/viewings (email / WhatsApp / Make.com webhook). **Hook is live**: set `NOTIFY_WEBHOOK_URL` (Make.com/Zapier/Slack-compatible POST) and events (`viewing_booked`, `viewing_cancelled`, `enquiry`, `quote_saved`, `estimate_email_request`, `privacy_request`) fire automatically — see `src/lib/notify.ts`.
- [ ] Viewing slot rules (days, hours, duration, capacity per slot) — scheduler currently collects a preferred time. **Partial (round 13)**: when the team confirms a slot in the digest, couples can add it to their calendar (.ics, floating SA-local time, 60-min block assumed) from their reference card. The real rules (which days/hours, duration, capacity) are still client decisions.

## Environment variables (new — round 9)
- [ ] `NOTIFY_WEBHOOK_URL` — team-notification webhook (unset = silent no-op in dev).
- [ ] `ADMIN_TOKEN` — token for the hidden team digest at `/#team-digest` + `GET /api/admin/digest?token=…` + `POST /api/admin/availability?token=…` (round 11). Dev fallback is `lakeside-team`; **must** be replaced with a strong token before launch.
- [ ] "Email me this estimate" captures a lead (`source=estimate_email`) — the team sends the estimate manually. Decide whether to add automated email delivery (requires SMTP/transactional provider + POPIA review) later.

## Availability operations (round 11)
- [x] ~~Real availability admin entry (digest is read-only).~~ **Built (round 11)**: the team digest at `/#team-digest` now has an "Availability board" — set a day's state (available | limited | held | booked) + optional note, or remove a day (back to "Ask us"). Edits go to `POST /api/admin/availability` (same ADMIN_TOKEN) and appear **live** on the public "Check your date" calendar (no reload needed). Rows are the only source of availability — the site never invents any.
- [ ] Decide who on the team owns keeping the board current (after viewings/bookings).
- [ ] Note: the public calendar covers 2026-10 → 2027-12; rows outside that range are stored but not visible on the calendar.

## Team digest operations (round 12–13)
- [x] ~~Digest lists are read-only / capped at the latest 8 leads / 6 viewings / 6 quotes.~~ **Resolved (round 13)**: per-list "Show older" pagination (server clamps to 50 rows per list); CSV still exports the rows shown — a server-side full export can be added if the team needs it.
- [x] ~~Confirmed viewing slots are invisible outside the website.~~ **Resolved (round 13)**: couples with a reference can download their confirmed viewing as an .ics event (60-min block assumed until real slot rules exist).
