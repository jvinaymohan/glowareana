import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  className?: string;
  priority?: boolean;
  /** header = nav bar; footer = site footer; hero = home hero; compact = inner pages */
  variant?: "header" | "footer" | "hero" | "compact";
  onNavigate?: () => void;
};

const sizeClass: Record<NonNullable<Props["variant"]>, string> = {
  /** Taller mark so the wordmark reads on phones — not “lost” beside CTAs */
  header: "h-[2.875rem] w-auto min-w-[8.5rem] sm:h-[3.5rem] sm:min-w-[10rem]",
  footer: "h-16 w-auto min-w-[9rem] sm:h-[4.5rem] sm:min-w-[11rem]",
  hero: "h-[5.5rem] w-auto min-w-[12rem] sm:h-28 md:h-36 lg:h-[9.5rem] sm:min-w-[16rem]",
  compact: "h-9 w-auto min-w-[6.5rem] sm:h-10 sm:min-w-[7.5rem]",
};

const glowClass =
  "object-contain object-left drop-shadow-[0_0_18px_rgba(0,245,255,0.45)] drop-shadow-[0_0_36px_rgba(255,45,140,0.22)] transition-[filter,transform] duration-300 group-hover:drop-shadow-[0_0_28px_rgba(0,245,255,0.65)] group-hover:drop-shadow-[0_0_48px_rgba(255,45,140,0.32)] group-hover:scale-[1.02] group-active:scale-[0.98]";

export function SiteLogo({
  className = "",
  priority = false,
  variant = "header",
  onNavigate,
}: Props) {
  const size = sizeClass[variant];

  return (
    <Link
      href="/"
      className={`group relative inline-flex shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--ga-cyan)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
      onClick={onNavigate}
      aria-label="Glow Arena — home"
    >
      <Image
        src="/glow-arena-logo.png"
        alt=""
        width={360}
        height={132}
        className={`${size} ${glowClass}`}
        priority={priority}
        aria-hidden
      />
    </Link>
  );
}

/** Framed lockup for header / hero — improves contrast on busy backgrounds */
export function SiteLogoLockup({
  children,
  className = "",
  padding = "default",
}: {
  children: ReactNode;
  className?: string;
  padding?: "default" | "hero";
}) {
  const pad =
    padding === "hero" ? "p-3 sm:p-4 md:p-5" : "px-2 py-1.5 sm:px-2.5 sm:py-2";
  return (
    <div
      className={`rounded-xl border border-[var(--ga-cyan)]/35 bg-gradient-to-br from-[var(--ga-cyan)]/[0.12] via-black/40 to-[var(--ga-magenta)]/[0.08] shadow-[0_0_32px_rgba(0,240,255,0.14),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/[0.08] ${pad} ${className}`}
    >
      {children}
    </div>
  );
}
