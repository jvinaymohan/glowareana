"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ga_beta_banner_dismissed";

/**
 * Dismissible beta strip for public beta. Set NEXT_PUBLIC_SHOW_BETA_BANNER=0 to hide entirely.
 */
export function BetaBanner() {
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SHOW_BETA_BANNER === "0") {
      setShow(false);
      return;
    }
    try {
      setShow(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, []);

  if (show === null || !show) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div
      role="status"
      className="relative z-[60] border-b border-[var(--ga-orange)]/40 bg-gradient-to-r from-[var(--ga-orange)]/20 via-[var(--ga-magenta)]/15 to-[var(--ga-cyan)]/15 px-4 py-2.5 pr-14 text-center sm:py-2 sm:pr-12"
    >
      <p className="text-xs leading-snug text-zinc-200 sm:text-sm">
        <span className="font-semibold text-[var(--ga-yellow)]">Beta testing</span>
        {" — "}
        Bookings and flows are live for feedback. Found a bug or rough edge?{" "}
        <Link
          href="/contact"
          className="font-medium text-[var(--ga-cyan)] underline-offset-2 hover:underline"
        >
          Tell us
        </Link>
        {" · "}
        <Link
          href="/book"
          className="font-medium text-white underline-offset-2 hover:underline"
        >
          Book now
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-lg text-zinc-400 touch-manipulation hover:bg-white/10 hover:text-white sm:right-3"
        aria-label="Dismiss beta notice"
      >
        ×
      </button>
    </div>
  );
}
