import { BENEFIT_PILLARS } from "@/lib/benefits";

const accentBorder: Record<(typeof BENEFIT_PILLARS)[number]["accent"], string> = {
  cyan: "border-[var(--ga-cyan)]/25 shadow-[0_0_24px_rgba(0,240,255,0.08)]",
  magenta:
    "border-[var(--ga-magenta)]/25 shadow-[0_0_24px_rgba(255,45,140,0.08)]",
  lime: "border-[var(--ga-lime)]/25 shadow-[0_0_24px_rgba(183,255,0,0.08)]",
};

const accentTitle: Record<(typeof BENEFIT_PILLARS)[number]["accent"], string> = {
  cyan: "text-[var(--ga-cyan)]",
  magenta: "text-[var(--ga-magenta)]",
  lime: "text-[var(--ga-lime)]",
};

export function BenefitPillars({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-3 ${className}`}>
      {BENEFIT_PILLARS.map((x) => (
        <div
          key={x.title}
          className={`rounded-2xl border bg-[var(--ga-surface)] p-5 backdrop-blur-sm ${accentBorder[x.accent]}`}
        >
          <p
            className="font-[family-name:var(--font-syne)] text-2xl leading-none"
            aria-hidden
          >
            {x.icon}
          </p>
          <p
            className={`mt-3 font-[family-name:var(--font-syne)] text-lg font-bold ${accentTitle[x.accent]}`}
          >
            {x.title}
          </p>
          <p className="mt-2 text-sm text-zinc-400">{x.description}</p>
        </div>
      ))}
    </div>
  );
}
