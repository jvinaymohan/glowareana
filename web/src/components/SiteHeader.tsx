"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, site } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b12]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-white sm:text-xl"
          onClick={() => setOpen(false)}
        >
          <span className="text-[var(--ga-lava)]">Glow</span> Arena
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/book"
            className="hidden rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] px-4 py-2 text-sm font-semibold text-[#0b0b12] shadow-[0_0_24px_rgba(255,77,46,0.35)] transition hover:brightness-110 sm:inline-flex"
          >
            Book now
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#0b0b12] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-zinc-200 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/book"
              className="mt-2 rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] py-3 text-center text-base font-semibold text-[#0b0b12]"
              onClick={() => setOpen(false)}
            >
              Book now
            </Link>
          </div>
        </div>
      ) : null}

      <p className="sr-only">{site.tagline}</p>
    </header>
  );
}
