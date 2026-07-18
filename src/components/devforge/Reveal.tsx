"use client";

// Reveal — drop-in wrapper that fades + slides its children into view the
// first time they scroll into the viewport. Pair with `useScrollReveal` so
// every section gets a consistent scroll-triggered entrance.
//
// Usage:
//   <Reveal as="section"><Hero/></Reveal>
//   <Reveal delay={0.2}><Card/></Reveal>
//
// Respects prefers-reduced-motion automatically via the CSS in globals.css.

import React from "react";
import { useScrollReveal } from "@/hooks/use-animations";

type RevealProps = {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  delay?: number; // seconds
  threshold?: number;
  once?: boolean;
  style?: React.CSSProperties;
};

export default function Reveal({
  children,
  as,
  className = "",
  delay = 0,
  threshold = 0.15,
  once = true,
  style,
}: RevealProps) {
  const Tag = as || "div";
  const { ref, visible } = useScrollReveal<HTMLDivElement>({ threshold, once });

  return (
    <Tag
      ref={ref}
      className={`reveal-hidden ${visible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}s`, ...style }}
    >
      {children}
    </Tag>
  );
}
