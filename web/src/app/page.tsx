import Image from "next/image";
import Link from "next/link";
import { BenefitPillars } from "@/components/BenefitPillars";
import { BookNowLink } from "@/components/BookNowLink";
import { GoogleMapBlock } from "@/components/GoogleMapBlock";
import { SiteLogo, SiteLogoLockup } from "@/components/SiteLogo";
import { EXPERIENCE_WINDOW_COPY, games, site } from "@/lib/site";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1540479859555-17af45c78602?w=1200&q=80&auto=format&fit=crop";

const GAME_AGE_SHORT: Record<string, string> = {
  "floor-is-lava": "Lava",
  "push-battle": "Push",
  "climb-challenge": "Climb",
  "laser-maze": "Laser",
  "team-arena": "Team",
};

export default function HomePage() {
  const ageLine = games
    .map((g) => `${GAME_AGE_SHORT[g.slug] ?? g.slug} ${g.agesShort}`)
    .join(" · ");

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,240,255,0.12),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(255,45,140,0.1),transparent_50%),radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(183,255,0,0.06),transparent_50%)]" />
        <div className="ga-grid-bg absolute inset-0 opacity-70" />
        <div className="ga-hero-blob absolute -left-32 top-20 size-[420px] rounded-full bg-[var(--ga-cyan)]/20 blur-[100px]" />
        <div className="ga-hero-blob absolute -right-20 bottom-0 size-[380px] rounded-full bg-[var(--ga-magenta)]/22 blur-[90px] [animation-delay:2s]" />
        <div className="ga-hero-blob absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ga-yellow)]/10 blur-[80px] [animation-delay:4s]" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_min(42%,420px)] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-8 flex justify-center sm:justify-start">
                <SiteLogoLockup padding="hero" className="inline-block">
                  <SiteLogo variant="hero" priority />
                </SiteLogoLockup>
              </div>
              <p className="ga-tagline-colors text-sm font-bold uppercase tracking-[0.28em]">
                {site.brandTagline}
              </p>
              <h1 className="mt-4 font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                <span className="text-white">Don&apos;t touch the </span>
                <span className="ga-text-arena">floor</span>
                <span className="text-white">. </span>
                <span className="ga-text-glow">Own the arena.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-400">
                Big neon energy, real games: lava floors, laser missions, push
                battles, and team showdowns. For families who want a safe win,
                kids who want bragging rights, and anyone who&apos;s done with
                boring weekends.
              </p>
              <p className="mt-3 text-sm text-zinc-500">
                {site.area} · {EXPERIENCE_WINDOW_COPY.split("(")[0].trim()} · Ages
                by game: {ageLine}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BookNowLink
                  source="home_hero"
                  className="ga-btn-neon ga-float inline-flex min-h-[48px] min-w-[160px] items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold shadow-[0_0_28px_rgba(255,45,140,0.35)] touch-manipulation active:brightness-95"
                />
                <Link
                  href="/games"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--ga-cyan)]/40 px-6 py-3 text-sm font-semibold text-[var(--ga-cyan)] shadow-[0_0_20px_rgba(0,240,255,0.15)] transition touch-manipulation hover:border-[var(--ga-cyan)]/70 hover:bg-[var(--ga-cyan)]/10 hover:shadow-[0_0_28px_rgba(0,240,255,0.25)] active:brightness-95"
                >
                  Explore games
                </Link>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
                One booking flow: tap Book now, then continue as a guest or sign in
                to save visits and reschedule from your account.
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[var(--ga-cyan)]/20 shadow-[0_0_40px_rgba(0,240,255,0.15)] lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
                <Image
                  src={HERO_IMAGE}
                  alt="Families enjoying indoor play together"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 420px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <p className="absolute bottom-4 left-4 right-4 text-xs text-zinc-300">
                  Stock photo — swap for your arena shots when ready.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-14">
            <BenefitPillars />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
              Games that hit different
            </h2>
            <p className="mt-2 max-w-xl text-zinc-400">
              Each attraction runs {EXPERIENCE_WINDOW_COPY.toLowerCase()} — see age
              labels and group limits on every card.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/games"
              className="text-sm font-semibold text-[var(--ga-cyan)] drop-shadow-[0_0_8px_rgba(0,240,255,0.35)] hover:underline"
            >
              View all details →
            </Link>
            <Link
              href="/combos"
              className="text-sm font-semibold text-[var(--ga-magenta)] drop-shadow-[0_0_8px_rgba(255,45,140,0.3)] hover:underline"
            >
              Multi-game combos (up to 25% off) →
            </Link>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.slice(0, 5).map((g) => (
            <article
              key={g.slug}
              className="group rounded-2xl border border-[var(--ga-cyan)]/15 bg-[var(--ga-surface)] p-5 transition hover:border-[var(--ga-magenta)]/45 hover:shadow-[0_0_32px_rgba(255,45,140,0.12)]"
            >
              <div className="flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ga-cyan)]/25 to-[var(--ga-magenta)]/15 text-3xl shadow-[inset_0_0_24px_rgba(0,240,255,0.08)]">
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
              <h3 className="mt-4 font-[family-name:var(--font-syne)] text-xl font-bold text-white group-hover:text-[var(--ga-cyan)]">
                {g.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{g.blurb}</p>
              <p className="mt-2 text-xs text-zinc-500">
                Ages {g.agesShort} · {g.effortLevel} · up to {g.maxKidsPerSession}{" "}
                kids
              </p>
              <p className="mt-3 text-xs text-zinc-500">{g.priceFrom}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--ga-cyan)]/15 bg-black py-16 shadow-[inset_0_0_80px_rgba(255,45,140,0.04)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6">
          <div className="rounded-2xl border border-[var(--ga-yellow)]/35 bg-gradient-to-br from-[var(--ga-yellow)]/10 via-transparent to-[var(--ga-magenta)]/10 p-8 shadow-[0_0_40px_rgba(255,240,31,0.08)]">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--ga-yellow)] drop-shadow-[0_0_10px_rgba(255,240,31,0.35)]">
              Birthdays
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
              Packages from ₹1,299 / child — you bring the cake, we bring the chaos.
            </h2>
            <p className="mt-3 text-zinc-400">
              Host, arena time, and combo game passes. Premium add-ons from ₹1,899
              / child with decor and battle formats. Final quote after planner
              submit.
            </p>
            <BookNowLink
              source="home_birthday_card"
              href="/birthday"
              className="ga-btn-neon mt-6 inline-flex rounded-full px-5 py-2 text-sm font-semibold"
            >
              Birthday packages
            </BookNowLink>
          </div>
          <div className="rounded-2xl border border-[var(--ga-cyan)]/35 bg-gradient-to-br from-[var(--ga-cyan)]/10 to-transparent p-8 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--ga-cyan)] drop-shadow-[0_0_10px_rgba(0,240,255,0.35)]">
              Corporate
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
              Team battles from ₹12,000 for up to 15 people.
            </h2>
            <p className="mt-3 text-zinc-400">
              Larger crawls and buyouts on quote. Facilitated run-of-show, private
              windows, and WhatsApp coordination for office admins.
            </p>
            <BookNowLink
              source="home_corporate_card"
              href="/corporate"
              className="mt-6 inline-flex rounded-full border border-[var(--ga-cyan)] px-5 py-2 text-sm font-semibold text-[var(--ga-cyan)] shadow-[0_0_16px_rgba(0,240,255,0.2)] hover:bg-[var(--ga-cyan)]/10"
            >
              Plan an offsite
            </BookNowLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Why families pick {site.name}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Clear age & group-size labels on every game",
            "Party rooms & buyouts — enquire for dates",
            "Trained floor staff + first aid on shift",
            "Koramangala location — link in footer map",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-[var(--ga-cyan)]/20 bg-[var(--ga-surface)] p-4 text-sm text-zinc-300 shadow-[0_0_20px_rgba(0,240,255,0.04)]"
            >
              <span className="text-[var(--ga-lime)] drop-shadow-[0_0_8px_rgba(183,255,0,0.5)]">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-[var(--ga-cyan)]/10 bg-[var(--ga-surface)] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Reviews on Google
          </h2>
          <p className="mt-2 max-w-2xl text-zinc-400">
            We&apos;re building our Google Business profile — be one of the first
            families to leave a review after your visit. Honest feedback helps
            other parents choose with confidence.
          </p>
          <a
            href={site.googleReviewHintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--ga-cyan)]/50 px-6 py-3 text-sm font-semibold text-[var(--ga-cyan)] touch-manipulation hover:bg-[var(--ga-cyan)]/10"
          >
            Find us on Google Maps →
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Find us
        </h2>
        <p className="mt-2 text-zinc-400">{site.address}</p>
        <div className="mt-6">
          <GoogleMapBlock />
        </div>
      </section>
    </div>
  );
}
