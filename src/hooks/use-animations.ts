"use client";

// Shared animation hooks for The Shield.
// All hooks are SSR-safe (no-op on the server, activate on mount) and
// gracefully degrade when IntersectionObserver / requestAnimationFrame
// are unavailable.

import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────── */
/* 1. useScrollReveal                                                     */
/*                                                                        */
/* Returns a ref + boolean. The boolean flips to true the first time the   */
/* element scrolls into view (threshold configurable). Stays true after.   */
/* Use to gate CSS animation classes so they trigger on scroll, not mount. */
/* ─────────────────────────────────────────────────────────────────────── */

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {}
) {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, visible } as const;
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 2. useCountUp                                                          */
/*                                                                        */
/* Animates a number from 0 → target over `duration` ms using rAF + ease.  */
/* Starts when `active` flips true (pair with useScrollReveal for scroll-  */
/* triggered count-up).                                                   */
/* ─────────────────────────────────────────────────────────────────────── */

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp(target: number, active: boolean, duration = 1500) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;

    if (typeof requestAnimationFrame === "undefined") {
      setValue(target);
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOutCubic(t) * target));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 3. useTilt                                                             */
/*                                                                        */
/* Returns a ref + style object. Element tilts up to ±maxDeg following    */
/* the cursor (perspective transform). Resets on mouse leave.             */
/* Use on cards / panels for a 3D parallax feel.                          */
/* ─────────────────────────────────────────────────────────────────────── */

export function useTilt<T extends HTMLElement = HTMLDivElement>(maxDeg = 6) {
  const ref = useRef<T | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined") return;
    // Skip on touch / small screens — tilt feels wrong without a precise pointer
    if (window.matchMedia("(hover: none)").matches) return;
    // Skip if user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Cap the tilt magnitude at 3° to keep the wobble subtle — previously
    // up to 6° which made the panel feel like it was shaking when the
    // cursor moved. 3° still gives a 3D feel without distraction.
    const effectiveMaxDeg = Math.min(maxDeg, 3);

    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;  // 0..1
      const y = (e.clientY - rect.top) / rect.height;  // 0..1
      const rx = (0.5 - y) * 2 * effectiveMaxDeg; // rotateX
      const ry = (x - 0.5) * 2 * effectiveMaxDeg; // rotateY
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setStyle({
          transform: `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`,
          transition: "transform 0.15s ease-out",
        });
      });
    };
    const handleLeave = () => {
      cancelAnimationFrame(raf);
      setStyle({
        transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)",
        transition: "transform 0.5s ease-out",
      });
    };

    node.addEventListener("mousemove", handleMove);
    node.addEventListener("mouseleave", handleLeave);
    return () => {
      node.removeEventListener("mousemove", handleMove);
      node.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(raf);
    };
  }, [maxDeg]);

  return { ref, style } as const;
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 4. useMagnetic                                                         */
/*                                                                        */
/* Returns a ref + style. Element drifts toward the cursor (up to maxPx), */
/* creating a magnetic pull effect. Resets on mouse leave.                */
/* Use on primary CTAs for a premium feel.                                */
/* ─────────────────────────────────────────────────────────────────────── */

export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(maxPx = 8) {
  const ref = useRef<T | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Cap the magnetic drift at 3px — previously up to 8px which made
    // buttons feel like they were sliding around. 3px keeps the effect
    // premium-subtle.
    const effectiveMaxPx = Math.min(maxPx, 3);

    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const tx = Math.max(-1, Math.min(1, dx)) * effectiveMaxPx;
      const ty = Math.max(-1, Math.min(1, dy)) * effectiveMaxPx;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setStyle({
          transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)`,
          transition: "transform 0.2s ease-out",
        });
      });
    };
    const handleLeave = () => {
      cancelAnimationFrame(raf);
      setStyle({
        transform: "translate(0px, 0px)",
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      });
    };

    node.addEventListener("mousemove", handleMove);
    node.addEventListener("mouseleave", handleLeave);
    return () => {
      node.removeEventListener("mousemove", handleMove);
      node.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(raf);
    };
  }, [maxPx]);

  return { ref, style } as const;
}

/* ─────────────────────────────────────────────────────────────────────── */
/* 5. useScrollProgress                                                   */
/*                                                                        */
/* Returns 0-100 representing how far the page has been scrolled.         */
/* Drives the top-of-page scroll progress bar.                            */
/* ─────────────────────────────────────────────────────────────────────── */

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.max(0, Math.min(100, pct)));
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}
