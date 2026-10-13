/**
 * THE LAKESIDE — BRAND SEAL (round 33)
 * The client's official embossed logo, photographed on cream paper, presented
 * as a physical object in the interface:
 *
 *   tone="coin"  → a gold-rimmed medallion for dark surfaces. The cream face
 *                  reads as enamel/gilt against pine — the enamel-pin look.
 *   tone="stamp" → a multiply-blended emboss for light marble surfaces. The
 *                  cream paper melts into the marble and only the gold/green
 *                  artwork remains — the letterpress-stamp look.
 *
 * The JPG is circular-cropped in CSS (the embossed ring sits inset ~3% from
 * the crop edge, so nothing is ever clipped). Deterministic, SSR-safe, and
 * decorative by default (alt="" + aria-hidden) — the wordmark or section
 * heading always carries the accessible name; pass `alt` to make it meaningful.
 */
import { cn } from '@/lib/utils';

const SEAL_SRC = '/brand/lakeside-seal.jpg';

export function BrandSeal({
  tone = 'coin',
  className,
  alt = '',
}: {
  tone?: 'coin' | 'stamp';
  className?: string;
  alt?: string;
}) {
  const img = (
    <img
      src={SEAL_SRC}
      alt={alt}
      width={960}
      height={960}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="h-full w-full select-none object-cover"
    />
  );

  if (tone === 'stamp') {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn(
          'relative block overflow-hidden rounded-full mix-blend-multiply',
          '[filter:drop-shadow(0_12px_26px_rgba(16,38,30,0.14))]',
          className,
        )}
      >
        {img}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(184,155,106,0.28)]"
        />
      </span>
    );
  }

  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn('relative block', className)}
    >
      {/* Gilded rim — hairline gold band around the cream face */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-200 via-brass-500 to-brass-700 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.6),0_2px_10px_-2px_rgba(184,155,106,0.5),inset_0_1px_1px_rgba(255,244,214,0.7)]"
      />
      {/* The cream face, inset so the rim reads as a physical bezel */}
      <span className="absolute inset-[4%] overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(16,38,30,0.18)]">
        {img}
      </span>
    </span>
  );
}
