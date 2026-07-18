"use client";

import React from "react";

/* ────────────────────────────────────────────────────────────────────────────
 *  Data viz primitives matching the reference screenshots:
 *  - CircularGauge: animated SVG donut with gradient stroke + center value
 *  - MiniAreaChart: small line+area chart with gradient fill
 *  - MiniBarChart:  vertical bar chart with gradient bars
 *  - Sparkline:     tiny inline line chart for stat cards
 *
 *  All pure SVG, no deps. Colors come from the The Shield palette:
 *  mint #64ffda · violet #667eea · purple #764ba2
 * ──────────────────────────────────────────────────────────────────────────── */

export interface GaugeProps {
  value: number;          // 0-100
  label?: string;
  size?: number;          // px (default 140)
  stroke?: number;        // ring thickness (default 12)
  display?: string;       // override center text (default = `${value}%`)
  gradientFrom?: string;  // default mint
  gradientTo?: string;    // default violet
  sublabel?: string;
}

export function CircularGauge({
  value,
  label,
  size = 140,
  stroke = 12,
  display,
  gradientFrom = "#64ffda",
  gradientTo = "#667eea",
  sublabel,
}: GaugeProps) {
  const id = React.useId();
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
            <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#g-${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            filter={`url(#glow-${id})`}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {display ?? `${value}%`}
          </span>
          {sublabel && (
            <span className="text-[10px] uppercase tracking-wider text-ink-400">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <div className="mt-2 text-xs font-medium text-ink-300">{label}</div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

export interface AreaChartProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;        // line color (default mint)
  fillFrom?: string;      // area gradient top
  fillTo?: string;        // area gradient bottom
  showDot?: boolean;      // last value dot
  strokeWidth?: number;
}

export function MiniAreaChart({
  data,
  width = 240,
  height = 70,
  stroke = "#64ffda",
  fillFrom = "rgba(100, 255, 218, 0.35)",
  fillTo = "rgba(100, 255, 218, 0)",
  showDot = true,
  strokeWidth = 2,
}: AreaChartProps) {
  const id = React.useId();
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d - min) / range) * (height - 8) - 4;
    return [x, y] as const;
  });

  // Smooth path using simple line (kept simple for performance)
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`area-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#area-${id})`} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && (
        <>
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r="4" fill={stroke} />
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r="8" fill={stroke} opacity="0.25">
            <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

export interface BarChartProps {
  data: { label: string; value: number; color?: "mint" | "violet" | "purple" | "amber" }[];
  width?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
}

export function MiniBarChart({
  data,
  width = 240,
  height = 90,
  barWidth = 14,
  gap = 10,
}: BarChartProps) {
  const id = React.useId();
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const totalWidth = data.length * (barWidth + gap) - gap;

  const colorMap = {
    mint:   ["#64ffda", "#26d0a8"],
    violet: ["#667eea", "#5568d4"],
    purple: ["#9d8df1", "#764ba2"],
    amber:  ["#fcd34d", "#f59e0b"],
  };

  return (
    <svg width={Math.max(width, totalWidth)} height={height} className="overflow-visible">
      <defs>
        {Object.entries(colorMap).map(([k, [from, to]]) => (
          <linearGradient key={k} id={`bar-${k}-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        ))}
      </defs>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 20);
        const x = i * (barWidth + gap);
        const y = height - h - 14;
        const colorKey = d.color ?? "mint";
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={3}
              fill={`url(#bar-${colorKey}-${id})`}
              style={{ transition: "height 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
            <text
              x={x + barWidth / 2}
              y={height - 2}
              textAnchor="middle"
              className="fill-ink-500"
              style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

/** Tiny inline sparkline for stat cards */
export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = "#64ffda",
  strokeWidth = 1.5,
}: SparklineProps) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d - min) / range) * (height - 4) - 2;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return (
    <svg width={width} height={height}>
      <path
        d={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

/** Avatar with gradient ring (for team list / user greeting) */
export function GradientAvatar({
  initial,
  size = 40,
  variant = "mint",
}: {
  initial: string;
  size?: number;
  variant?: "mint" | "violet" | "purple";
}) {
  const gradientMap = {
    mint:   "linear-gradient(135deg, rgba(100, 255, 218, 0.30), rgba(102, 126, 234, 0.15))",
    violet: "linear-gradient(135deg, rgba(102, 126, 234, 0.30), rgba(118, 75, 162, 0.15))",
    purple: "linear-gradient(135deg, rgba(155, 126, 234, 0.30), rgba(118, 75, 162, 0.10))",
  };
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        background: gradientMap[variant],
        fontSize: size * 0.4,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 16px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {initial}
    </div>
  );
}
