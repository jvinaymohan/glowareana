"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/lib/site";
import { AuthNav, AuthNavMobile } from "@/components/AuthNav";
import { SiteLogo } from "@/components/SiteLogo";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ga-cyan)]/25 bg-black/88 shadow-[0_0_32px_rgba(0,240,255,0.08)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SiteLogo
            priority
            variant="header"
            onNavigate={() => setOpen(false)}
          />
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--ga-cyan)]/15 text-[var(--ga-cyan)] shadow-[0_0_16px_rgba(0,240,255,0.2)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-[var(--ga-cyan)] hover:shadow-[0_0_12px_rgba(0,240,255,0.12)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <AuthNav />
          <Link
            href="/book"
            className="ga-btn-neon hidden rounded-full px-4 py-2 text-sm font-semibold transition sm:inline-flex"
          >
            Book now
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--ga-cyan)]/30 text-[var(--ga-cyan)] shadow-[0_0_12px_rgba(0,240,255,0.15)] md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--ga-cyan)]/20 bg-black px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-zinc-200 hover:bg-[var(--ga-cyan)]/10 hover:text-[var(--ga-cyan)]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <AuthNavMobile onNavigate={() => setOpen(false)} />
            <Link
              href="/book"
              className="ga-btn-neon mt-2 rounded-full py-3 text-center text-base font-semibold"
              onClick={() => setOpen(false)}
            >
              Book now
            </Link>
          </div>
        </div>
      ) : null}

      <p className="sr-only">
        {site.name} — {site.brandTagline}
      </p>
    </header>
  );
}
