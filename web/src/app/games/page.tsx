import type { Metadata } from "next";
import Link from "next/link";
import { games, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Games & attractions",
  description: `Floor is Lava, Push Battle, Climb, Laser Maze, and team formats at ${site.name} in Koramangala.`,
};

export default function GamesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-orange)]">
        Attractions
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-white sm:text-4xl">
        Every game is a main character
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
        Durations and pricing are sample numbers for this prototype — swap in
        your live rate card anytime.
      </p>

      <div className="mt-12 space-y-12">
        {games.map((g, i) => (
          <article
            key={g.slug}
            id={g.slug}
            className="grid gap-6 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-4 sm:gap-8 sm:p-6 lg:grid-cols-[1fr_1.1fr] lg:p-8"
          >
            <div
              className={`flex min-h-[200px] items-center justify-center rounded-xl bg-gradient-to-br text-6xl ${
                i % 2 === 0
                  ? "from-[var(--ga-lava)]/30 to-[var(--ga-orange)]/10"
                  : "from-[var(--ga-blue)]/25 to-purple-500/10"
              }`}
            >
              {g.slug === "floor-is-lava"
                ? "🌋"
                : g.slug === "push-battle"
                  ? "🥊"
                  : g.slug === "climb-challenge"
                    ? "🧗"
                    : g.slug === "laser-maze"
                      ? "🔦"
                      : "🏁"}
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
                {g.title}
              </h2>
              <p className="mt-3 text-zinc-300">{g.description}</p>
              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">Session size</dt>
                  <dd className="mt-1 font-medium text-white">
                    Up to {g.maxKidsPerSession} kids per 15-min slot
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">Timing</dt>
                  <dd className="mt-1 font-medium text-white">{g.duration}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">Ages</dt>
                  <dd className="mt-1 font-medium text-white">{g.ages}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">From</dt>
                  <dd className="mt-1 font-medium text-[var(--ga-blue)]">
                    {g.priceFrom}
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 sm:col-span-2">
                  <dt className="text-zinc-500">Safety</dt>
                  <dd className="mt-1 text-zinc-300">{g.safety}</dd>
                </div>
              </dl>
              <Link
                href={`/book?game=${g.slug}`}
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] px-6 py-3 text-sm font-semibold text-[#0b0b12] touch-manipulation active:brightness-95"
              >
                Book now
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
