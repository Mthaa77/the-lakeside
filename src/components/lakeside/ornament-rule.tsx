/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LAKESIDE — ORNAMENT RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * A small brass ornament (hairlines + rotated diamond) that marks the seam
 * between two sections sharing the same background — where a plain gap would
 * otherwise read as an accident. Purely decorative; aria-hidden by design.
 */

import { cn } from '@/lib/utils';

export function OrnamentRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex items-center justify-center gap-3', className)}
    >
      <span className="brass-hairline w-16 sm:w-24" />
      <span className="size-1.5 rotate-45 bg-brass-500" />
      <span className="brass-hairline w-16 sm:w-24" />
    </div>
  );
}
