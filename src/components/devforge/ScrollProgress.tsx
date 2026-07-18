"use client";

// ScrollProgress — thin mint-to-violet progress bar fixed at the very top
// of the viewport. Reflects how far the user has scrolled down the page.
// Hidden inside the admin dashboard (where the page rarely scrolls past
// the sidebar) by only mounting it on the homepage + login views.

import { useScrollProgress } from "@/hooks/use-animations";

export default function ScrollProgress() {
  const progress = useScrollProgress();
  if (progress <= 0) return null;
  return (
    <div
      className="scroll-progress-bar"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}
