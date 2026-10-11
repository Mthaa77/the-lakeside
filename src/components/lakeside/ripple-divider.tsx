/**
 * THE LAKESIDE — RIPPLE DIVIDER
 * Signature lake-ripple SVG band placed between major sections.
 * Pure SVG, aria-hidden, ~1KB, adapts to light/dark section pairs.
 */

export function RippleDivider({
  from = 'bg-pine-900',
  to = 'bg-marble-50',
  flip = false,
}: {
  /** Tailwind bg class of the section ABOVE */
  from?: string;
  /** Tailwind bg class of the section BELOW */
  to?: string;
  flip?: boolean;
}) {
  return (
    <div aria-hidden="true" className={`relative h-6 w-full ${to} ${flip ? 'rotate-180' : ''}`}>
      <svg
        className={`absolute inset-x-0 bottom-0 h-6 w-full ${from.replace('bg-', 'fill-')}`}
        viewBox="0 0 1440 24"
        preserveAspectRatio="none"
      >
        <path
          d="M0,24 L0,14 C60,6 120,2 240,8 C360,14 420,22 540,18 C660,14 720,4 840,6 C960,8 1020,20 1140,20 C1260,20 1380,10 1440,6 L1440,24 Z"
          fill="currentColor"
        />
        <path
          d="M0,24 L0,19 C80,13 160,9 300,13 C440,17 520,23 660,21 C800,19 880,11 1020,12 C1160,13 1320,18 1440,14 L1440,24 Z"
          fill="currentColor"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}
