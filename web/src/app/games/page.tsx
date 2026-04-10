import type { Metadata } from "next";
import Link from "next/link";
import { BookingFaq } from "@/components/BookingFaq";
import { BookNowLink } from "@/components/BookNowLink";
import { SafetyPanel } from "@/components/SafetyPanel";
import { VisitMini } from "@/components/VisitMini";
import { BOOKING_FAQ_ITEMS } from "@/lib/faq-content";
import { EXPERIENCE_WINDOW_COPY, games, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Games & attractions",
  description: `Floor is Lava, Push Battle, Climb, Laser Maze, and team formats at ${site.name} in Koramangala — ages, durations, and pricing.`,
};

function gameEmoji(slug: string) {
  if (slug === "floor-is-lava") return "🌋";
  if (slug === "push-battle") return "🥊";
  if (slug === "climb-challenge") return "🧗";
  if (slug === "laser-maze") return "🔦";
  return "🏁";
}

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
        Sessions are about {EXPERIENCE_WINDOW_COPY.toLowerCase()}. Age limits differ
        by attraction — pick what fits your crew, then book one slot per game.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
            All games
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Tap a row for full rules and safety — links jump to detail below.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Link
                key={g.slug}
                href={`#${g.slug}`}
                className="flex gap-3 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-4 transition hover:border-[var(--ga-cyan)]/40"
              >
                <span className="text-3xl" aria-hidden>
                  {gameEmoji(g.slug)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-[family-name:var(--font-syne)] font-bold text-white">
                    {g.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Ages {g.agesShort} · {g.effortLevel}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {g.minKidsPerSession}–{g.maxKidsPerSession} kids · {g.priceFrom}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <VisitMini source="games_sidebar" className="h-fit lg:sticky lg:top-24" />
      </div>

      <div className="mt-16 space-y-12">
        {games.map((g, i) => (
          <article
            key={g.slug}
            id={g.slug}
            className="scroll-mt-28 grid gap-6 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-4 sm:gap-8 sm:p-6 lg:grid-cols-[1fr_1fr] lg:p-8"
          >
            <div
              className={`flex min-h-[200px] items-center justify-center rounded-xl bg-gradient-to-br text-6xl ${
                i % 2 === 0
                  ? "from-[var(--ga-lava)]/30 to-[var(--ga-orange)]/10"
                  : "from-[var(--ga-blue)]/25 to-purple-500/10"
              }`}
              aria-hidden
            >
              {gameEmoji(g.slug)}
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
                {g.title}
              </h2>
              <p className="mt-3 text-zinc-300">{g.description}</p>
              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">Group size</dt>
                  <dd className="mt-1 font-medium text-white">
                    {g.minKidsPerSession === g.maxKidsPerSession
                      ? `${g.maxKidsPerSession} kids`
                      : `${g.minKidsPerSession}–${g.maxKidsPerSession} kids`}{" "}
                    per slot
                  </dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">At the venue</dt>
                  <dd className="mt-1 font-medium text-white">{g.duration}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">Ages</dt>
                  <dd className="mt-1 font-medium text-white">{g.ages}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">Effort</dt>
                  <dd className="mt-1 font-medium text-white">{g.effortLevel}</dd>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <dt className="text-zinc-500">From</dt>
                  <dd className="mt-1 font-medium text-[var(--ga-blue)]">
                    {g.priceFrom}
                  </dd>
                </div>
              </dl>
              <div className="mt-6">
                <SafetyPanel game={g} compact className="sm:max-w-xl" />
              </div>
              <BookNowLink
                source={`games_${g.slug}`}
                href={`/book?game=${g.slug}`}
                className="ga-btn-neon mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full px-6 py-3 text-sm font-semibold touch-manipulation active:brightness-95"
              />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-20">
        <BookingFaq items={BOOKING_FAQ_ITEMS} id="faq" />
      </div>
    </div>
  );
}
