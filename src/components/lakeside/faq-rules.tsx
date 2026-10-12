'use client';

/**
 * THE LAKESIDE — RULES AT A GLANCE + FAQ (client-side search)
 * Rules pre-empt objections; FAQ answers real questions from the T&Cs.
 */

import { useMemo, useState } from 'react';
import { FAQS, FAQ_CATS } from '@/content/faqs';
import { Reveal } from './reveal';
import { OrnamentDivider } from './ornaments';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Flower2, CloudRainWind, Music4, VolumeX, Wine, GlassWater, Waves, ListChecks, Clock3,
} from 'lucide-react';

const RULES = [
  { icon: Flower2, t: 'In-house florals, decor & food', d: 'Our own team handles all three — no external suppliers in these categories.' },
  { icon: CloudRainWind, t: 'Bubbles instead of confetti', d: 'Paper confetti and streamers are not allowed. Bubbles are the alternative.' },
  { icon: Music4, t: 'SAMPRA-registered DJ only', d: 'The venue sound system is compulsory; live bands finish by 22h00.' },
  { icon: VolumeX, t: 'Music curfew 22h00', d: 'At legal decibels from 22h00. The canapé area stays open after closing, without music.' },
  { icon: Wine, t: 'No outside alcohol', d: 'A R 2 000 fine applies. Corkage is possible only for bottles we cannot source.' },
  { icon: GlassWater, t: 'Glass stays inside', d: 'No glass beyond the venue — we share the grounds with the wildlife.' },
  { icon: Waves, t: 'Water safety', d: 'No railings at the water&rsquo;s edge and no swimming, by design of the estate.', raw: true },
  { icon: ListChecks, t: 'Named guest list', d: 'Final numbers 6 weeks before; the named list one month before.' },
  { icon: Clock3, t: 'Hours 13h00–24h00', d: 'Until 22h00 on Sundays and weekdays. Ceremonies over an hour late: R 1 000/hour.' },
];

// FAQS + FAQ_CATS live in src/content/faqs.ts (shared with the FAQPage JSON-LD)
const CATS = FAQ_CATS;

export function FaqRules() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      const matchesCat = cat === 'All' || f.cat === cat;
      const matchesQ = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [query, cat]);

  return (
    <section id="faq" aria-label="Rules and FAQ" className="marble-texture relative overflow-hidden bg-marble-100">
      {/* Champagne warmth + gilded blooms behind the marble */}
      <div aria-hidden="true" className="champagne-wash pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="gold-bloom pointer-events-none absolute -top-24 right-[-6rem] h-64 w-96 opacity-40" />
      <div aria-hidden="true" className="ruby-bloom pointer-events-none absolute -bottom-20 left-[-6rem] h-56 w-80 opacity-15" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        {/* Rules */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <OrnamentDivider tone="brass" center="rings" className="mb-8" />
          <p className="eyebrow eyebrow-dash text-brass-600">The honest bits</p>
          <h2 className="mt-3 font-display text-4xl font-medium text-balance text-pine-900">
            Rules <em className="gold-gradient-text--deep">at a glance</em>
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-600">
            Every estate has its character — here is ours, up front. These protect the
            wildlife, the neighbours and your evening.
          </p>
        </Reveal>
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {RULES.map((r, i) => (
            <Reveal as="li" key={r.t} delay={i * 40}>
              <div className="glass-card-light group h-full rounded-[6px] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_54px_-26px_rgba(16,38,30,0.4)] hover:ring-1 hover:ring-brass-500/50 sm:p-6">
                {/* Gold-ring medallion disc */}
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 via-brass-500 to-brass-600 p-[1.5px] shadow-[0_8px_18px_-8px_rgba(184,155,106,0.8)] transition-transform duration-300 group-hover:scale-105"
                >
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-marble-50 text-brass-600 transition-colors duration-300 group-hover:bg-pine-900 group-hover:text-gold-300">
                    <r.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </span>
                {r.raw ? (
                  <h3 className="mt-4 font-display text-lg leading-snug text-pine-900" dangerouslySetInnerHTML={{ __html: r.t }} />
                ) : (
                  <h3 className="mt-4 font-display text-lg leading-snug text-pine-900">{r.t}</h3>
                )}
                {r.raw ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink-600" dangerouslySetInnerHTML={{ __html: r.d }} />
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{r.d}</p>
                )}
              </div>
            </Reveal>
          ))}
        </ul>

        {/* FAQ */}
        <Reveal className="mx-auto mt-20 max-w-3xl">
          <div className="text-center">
            <p className="eyebrow eyebrow-dash text-brass-600">Good questions</p>
            <h2 className="mt-3 font-display text-4xl font-medium text-pine-900">
              Frequently <em className="gold-gradient-text--deep">asked</em>
            </h2>
          </div>
          <div className="mt-8 space-y-4">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the answers — try “deposit”, “DJ”, “confetti”…"
              aria-label="Search frequently asked questions"
              className="h-12 rounded-full border-marble-200 bg-white px-5 text-base"
            />
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="FAQ categories">
              {CATS.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={cat === c}
                  onClick={() => setCat(c)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    cat === c
                      ? 'bg-pine-900 text-marble-50'
                      : 'bg-white text-ink-600 hover:bg-marble-200/60'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[6px] border border-marble-200 bg-white px-6 py-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-600">
                No answers match “{query}”. Ask us directly on WhatsApp — we reply fast.
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filtered.map((f) => (
                  <AccordionItem key={f.q} value={f.q} className="border-marble-200">
                    <AccordionTrigger className="py-4 text-left text-[15px] font-medium text-pine-900 hover:text-brass-600 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <Badge variant="outline" className="hidden shrink-0 rounded-full border-brass-500/40 text-[10px] uppercase tracking-wider text-brass-600 sm:inline-flex">
                          {f.cat}
                        </Badge>
                        {f.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-relaxed text-ink-600">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
          <p className="mt-4 text-center text-xs text-ink-600">
            These summaries follow our signed T&amp;Cs — the signed document always governs.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
