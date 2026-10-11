'use client';

/**
 * THE LAKESIDE — SHARED REVEAL
 * IntersectionObserver-driven reveal-on-scroll.
 * variant="rise" (default): translateY + opacity.
 * variant="cine": cinematic clip-path wipe (for display headings).
 * Respects prefers-reduced-motion (renders visible immediately).
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Reveal({
  children,
  className,
  delay = 0,
  variant = 'rise',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'rise' | 'cine';
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('revealed');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('revealed');
            io.disconnect();
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (

    <Tag ref={ref as any} className={cn(variant === 'cine' ? 'reveal-cine' : 'reveal', className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}
