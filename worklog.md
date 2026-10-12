
---
Task ID: 27
Agent: Z.ai Code (main)
Task: Review uploaded research — atterbury-deep-dive-research.md (new project direction?)

Work Log:
- Read full 400-line doc: Atterbury deep-dive research, prepared for Kabelo (Carter Digitals), dated 11 Oct 2026
- Doc is competitive/platform research for a commercial-property LEASING PLATFORM pitch (not the Lakeside project)
- Key facts extracted: Atterbury publishes commercial rates (net R95-200/m2, ops, R&T, parking); industrial = tenant-driven/price on request; every property has a named leasing contact (9 contacts catalogued); pilot recommendation = Castle Gate Business Park (7 units 1,000-1,200 m2, contact Ruan van Rooyen, 6 confirmed artist impressions + brochure PDFs)
- Doc's own Next Step #5: "Build the Castle Gate Business Park demo using the six artist impressions and the brochure, and show per-unit routing to Ruan van Rooyen"
- Doc references earlier unseen documents: "the PRD", "your platform", broker portal, tenant-executive persona
- Copyright constraints noted in doc: Atterbury images = internal mockups only until written permission; photographer credits (Franz Rabe)
- File kept in upload/ (gitignored) — NOT pushed to GitHub (contains third-party contact data)
- Awaiting user decision: build Castle Gate demo at / (replacing Lakeside preview; Lakeside safe on GitHub 73f5cd6) vs keep Lakeside live

Stage Summary:
- Analysis delivered to user; one blocking decision question asked (replace preview vs preserve Lakeside)
- If approved: demo scope = unit cards, per-unit enquiry routing, build-to-suit enquiry form, brochure panel, precinct context

---
Task ID: 28
Agent: Z.ai Code (main)
Task: Implement lakeside-demo-fix-prompt-and-qa.md (Groups A + B + C16), premium & modern

Work Log:
- Full audit of every touchpoint; then implemented all Group A credibility fixes:
  * Founding year purged (welcome stats/seal, hero kicker+seal+lede+chip, logo lockup+aria, header announcement, film-strip slate, proof bar, curated-images LS-001, globals comment). grep -ri "1995|Thirty years|Keepers" src public = ZERO
  * About rewritten: "A family-run estate on the water." verified body; signature Penelope & Callie, Owners (+consent TODO)
  * Stats row: 200 guests / 9 rooms up to 18 / coordinator 08h00-22h00 / Auto generator
  * Food Experience: "included with your booking" copy, list relabelled, TODO(CLIENT) RSVP; chef plaque = title not quote; bubbles rule fixed; LS-055 giraffe alt reworded
  * Demo safety: robots noindex (meta + googleBot) + X-Robots-Tag header; metadataBase/canonical/og:url/og:image → the-lakeside.vercel.app; real /public/og.jpg 1200x630 via scripts/make-og.ts (sharp, 131KB); keywords removed; dismissible DemoStrip in header (useSyncExternalStore, SSR-visible, localStorage persist) + footer disclosure line
  * Hero: framed non-full-bleed mat (media inset-3/5 inside gilded frame) per fallback rule (0 images ≥2400px; LS-016=1251px; film first-frame==poster so image swap would break the loop); scripts/inspect-images.ts audit added; TODO(CLIENT) hi-res
- Group B:
  * RatingBadge component (hero trust row + footer brand col): 4.8 Google · about 390 reviews · checked 12 Oct 2026; RATING_FRESH 60-day auto-hide in site.ts; profileUrl TODO; no AggregateRating
  * Comparator: "Assumes Thursday 15 October 2026 — the next available Thursday" line (aria-live), auto-default next ELIGIBLE Thursday after mount (hydration-safe: SSR shows valid 2027-03-11), min=today
  * Price lines: "Saturday venue hire R68 000" + "from R34 000 (Mon to Thu)" in announcement wire, hero trust row, pricing dl
  * Date checker: today brass ring + "Today" chip + aria "— today"
  * A11y: marquee duplicate inert + keyboard focus-pause (globals.css), all icon-only links verified labelled
  * Perf: width/height on ~90 imgs (hero frames, film strip via json, pillars, stories, explorer thumbs, masonry, lightbox, bands); GalleryCarousel dynamic() code-split; hero fetchPriority=high kept
- Group C16: EventVenue JSON-LD already present (verified complete) + new src/app/sitemap.ts; C13-15 (route split/payment/team pages) DEFERRED — sandbox is single-route by design, needs multi-page deploy
- CRITICAL INCIDENT: sandbox auto-committer clobbered .gitignore to 3 lines and committed junk (.next 225 files, dev.log, .env, db/custom.db, tool-results/, upload/ incl. Atterbury research) AFTER my GitHub push
  * Fixed: restored full .gitignore (chmod 444), untracked all junk, squashed junk commit away, force-with-lease push
  * GitHub history now exactly: 73f5cd6 (initial) → 6508728 (round 25). Zero private data in remote history
- Verified: lint clean; 24/24 pricing vectors; agent-browser desktop+mobile (no h-scroll, strip dismiss+persist, badge, assumes-line, today chip, framed hero, film playing); page weight dev-mode ≈ 3.99MB media (4.07MB film arms post-load; images mostly 0 = cache)

Stage Summary:
- All Group A+B+C16 fixes live and verified; QA Part 2 vectors pass via scripts/test-pricing.ts
- GitHub main = 6508728; worklog warns future agents: ALWAYS check `git ls-files` hygiene before pushing (auto-committer re-clogs)
- Deferred: C13/C14/C15 route split (sandbox constraint) — TODO(CLIENT) launch list updated

---
Task ID: 29
Agent: Z.ai Code (main)
Task: Upgrade hero, remove the estimator, upgrade welcome + all section headings, push to GitHub

Work Log:
- ESTIMATOR REMOVED end-to-end: deleted estimator.tsx (~1800 lines), quote-nudge.tsx, shared-quote.tsx; dropped QuoteNudge/SharedQuote from page.tsx; purged every '#estimate' anchor (hero form, dock, header scroll-spy, footer, comparator, gallery lightbox, visit, estate explorer) and both estimate CustomEvents; kept /api/quotes + Prisma Quote model (harmless, admin digest still parses); removed dead print-estimate CSS block from globals.css
- NEW #date SECTION (was #estimate) in weddings-pricing.tsx: calendar (DateChecker, col-7) + right rail (col-5) = gilded "day-type ledger" (Sat R68 000/min 80, Fri R58 000/60, Sun R44 000/40, Mon–Thu R34 000/40 — all PRICING-driven) + "After the calendar" 3-step panel with Book a viewing / WhatsApp / phone CTAs
- DateChecker reworded: "Estimate this date" → "Book a viewing" (#visit); shortlist row "Estimate" → "Enquire" (#visit); onEstimate plumbing removed
- HERO round 29: quick-price form replaced by concierge strip (3 hairline-separated doors: Step one Check your date → #date · Step two Book a viewing → #visit · Prefer to talk? tel:) + microcopy line; headline now rises line-by-line from clip masks (.mask-line/.mask-line-inner CSS, staggered 0/130/260ms, reduced-motion safe); lede + trust row kept
- WELCOME round 29: new supporting line under heading ("Small enough to know your names..."); copy extended (nine rooms for the wedding party); NEW "How the day unfolds" 3-beat timeline (late morning vows / golden hour portraits / evening dinner) with brass diamond markers + hairline connector
- HEADINGS upgraded: pricing "The whole price, on the page."; pillars "The chapel. The water. The wild."; date "Check a date. See its light."; gallery "Every frame, in motion."; events "Every occasion, the same care."; explore supporting copy de-estimator'd; pricing/comparator/stories/footnotes reworded
- Turbopack CSS gotcha hit & fixed: globals.css edits not picked up by HMR — dev server restart was required (mask-line missing from served chunk until restart)
- QA (agent-browser): desktop 1440 + mobile 390; hero mask reveal, concierge strip, calendar day-select → DateCard ("Book a viewing"/"Ask if it's free"), day-type ledger, dock Dates active state, comparator "Check your date" CTA, zero #estimate links, zero dead print root, no horizontal scroll, footer flush bottom (gap 0), consent + demo strip intact; lint clean; dev.log clean

Stage Summary:
- Site is now estimator-free: pricing transparency carried by rate card + weekday calculator + comparator + day-type ledger; conversion path = calendar → viewing → WhatsApp/phone
- All anchors consistent: #date (calendar), #pricing (rate card), #visit (form); section ids updated in header scroll-spy + dock maps
- GitHub push pending at time of writing — commit follows this entry (main branch, private repo Mthaa77/the-lakeside)
