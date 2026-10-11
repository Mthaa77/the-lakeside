'use client';

/**
 * THE LAKESIDE — WATER EFFECT
 * A lightweight 2D-canvas "light on water" shimmer + pointer ripples
 * rendered over the hero photograph. No WebGL, ~60fps, pauses when
 * off-screen/tab-hidden, static under prefers-reduced-motion.
 */

import { useEffect, useRef } from 'react';

export function WaterCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // static hero image only

    let raf = 0;
    let running = true;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    type Ripple = { x: number; y: number; r: number; a: number };
    const ripples: Ripple[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      ripples.push({ x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr, r: 4, a: 0.5 });
      if (ripples.length > 6) ripples.shift();
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    }, { threshold: 0.05 });
    io.observe(canvas);

    const onVis = () => { running = !document.hidden; };
    document.addEventListener('visibilitychange', onVis);

    let t = 0;
    const draw = () => {
      if (running && visible) {
        t += 0.008;
        const { width: W, height: H } = canvas;
        ctx.clearRect(0, 0, W, H);

        // drifting light caustics (lower 55% = water band)
        const bandTop = H * 0.45;
        const caustics = 7;
        for (let i = 0; i < caustics; i++) {
          const speed = 0.6 + (i % 3) * 0.35;
          const x = ((Math.sin(t * speed + i * 1.7) * 0.5 + 0.5) * W);
          const y = bandTop + ((Math.sin(t * 0.7 + i * 2.3) * 0.5 + 0.5) * (H - bandTop));
          const r = (W * 0.08) * (1 + 0.4 * Math.sin(t + i));
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(246,243,238,0.05)');
          g.addColorStop(1, 'rgba(246,243,238,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // pointer ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.r += 2.4;
          rp.a *= 0.955;
          if (rp.a < 0.01) { ripples.splice(i, 1); continue; }
          ctx.strokeStyle = `rgba(246,243,238,${rp.a * 0.5})`;
          ctx.lineWidth = 1.2 * dpr;
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
