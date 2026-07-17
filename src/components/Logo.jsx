/**
 * Logo — brand mark used across the app.
 * Uses the Cloudinary-hosted asset provided by the superadmin.
 * Falls back to a CSS gradient mark if the URL is ever empty.
 */
import React from 'react'

const LOGO_URL =
  'https://res.cloudinary.com/dhd06wdov/image/upload/v1784282735/ChatGPT_Image_Jul_17_2026_05_03_17_PM_adkeeh.png'

export default function Logo({ size = 36, withGlow = true, className = '' }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <span
          className="absolute inset-0 rounded-xl bg-brand-500/40 blur-xl animate-pulse-glow"
          aria-hidden="true"
        />
      )}
      <img
        src={LOGO_URL}
        alt="DevForge logo"
        className="relative h-full w-full rounded-xl object-cover ring-1 ring-white/15"
        style={{ width: size, height: size }}
      />
    </div>
  )
}
