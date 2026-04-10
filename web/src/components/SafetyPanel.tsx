import Link from "next/link";
import type { Game } from "@/lib/site";

const VENUE_BASE = [
  "Harness and gear checks on climbing; padded surfaces on lava and battle zones.",
  "Staff-to-group ratios meet or exceed manufacturer and venue SOPs for each attraction.",
  "First-aid–trained team on every shift; kit at front desk and arena side.",
  "Participation waiver required before play — parents/guardians sign for minors.",
  "High-activity games: consult a doctor first if your child has heart, back, joint, or recent injury concerns.",
];

export function SafetyPanel({
  game,
  compact,
  className = "",
}: {
  game?: Game;
  compact?: boolean;
  className?: string;
}) {
  const lines = game
    ? [game.safety, ...VENUE_BASE.slice(0, compact ? 2 : VENUE_BASE.length)]
    : VENUE_BASE;

  return (
    <aside
      className={`rounded-2xl border border-[var(--ga-orange)]/30 bg-gradient-to-br from-[var(--ga-orange)]/10 to-transparent p-5 ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--ga-orange)]">
        Safety & supervision
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      {!compact ? (
        <p className="mt-4 text-xs text-zinc-500">
          Full venue rules:{" "}
          <Link href="/legal/safety" className="text-[var(--ga-cyan)] hover:underline">
            Safety guidelines
          </Link>
          .
        </p>
      ) : null}
    </aside>
  );
}
