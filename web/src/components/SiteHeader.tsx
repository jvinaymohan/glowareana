"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookNowLink } from "@/components/BookNowLink";
import { nav, site } from "@/lib/site";
import { AuthNav, AuthNavMobile } from "@/components/AuthNav";
import { SiteLogo, SiteLogoLockup } from "@/components/SiteLogo";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ga-cyan)]/25 bg-black/88 pt-[env(safe-area-inset-top,0px)] shadow-[0_0_32px_rgba(0,240,255,0.08)] backdrop-blur-md">
      <div className="mx-auto flex min-h-[4.25rem] max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:min-h-[4.75rem] sm:gap-4 sm:px-6 sm:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SiteLogoLockup>
            <SiteLogo
              priority={pathname !== "/"}
              variant="header"
              onNavigate={() => setOpen(false)}
            />
          </SiteLogoLockup>
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <BookNowLink
            source="header_mobile"
            className="ga-btn-neon inline-flex min-h-10 items-center rounded-full px-3 py-2 text-xs font-semibold shadow-[0_0_24px_rgba(255,45,140,0.25)] transition touch-manipulation active:brightness-95 sm:hidden"
          />
          <BookNowLink
            source="header_desktop"
            className="ga-btn-neon hidden min-h-10 items-center rounded-full px-5 py-2 text-sm font-semibold shadow-[0_0_24px_rgba(255,45,140,0.25)] transition touch-manipulation active:brightness-95 sm:inline-flex"
          />
          <AuthNav />
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
          <div className="mb-4 flex justify-center border-b border-white/10 pb-4">
            <SiteLogoLockup>
              <SiteLogo
                variant="header"
                onNavigate={() => setOpen(false)}
              />
            </SiteLogoLockup>
          </div>
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-[48px] items-center rounded-lg px-3 py-3 text-base font-medium text-zinc-200 touch-manipulation hover:bg-[var(--ga-cyan)]/10 hover:text-[var(--ga-cyan)] active:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <AuthNavMobile onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <p className="sr-only">
        {site.name} — {site.brandTagline}
      </p>
    </header>
  );
}
