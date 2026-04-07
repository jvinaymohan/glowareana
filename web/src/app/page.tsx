import Link from "next/link";
import { SiteLogo, SiteLogoLockup } from "@/components/SiteLogo";
import { games, site } from "@/lib/site";

export default function HomePage() {
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
              {site.area} · Staff on every round · Ages 5+ (see each game)
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="ga-btn-neon ga-float inline-flex min-h-[48px] min-w-[160px] items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold shadow-[0_0_28px_rgba(255,45,140,0.35)] touch-manipulation active:brightness-95"
              >
                Book now
              </Link>
              <Link
                href="/games"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--ga-cyan)]/40 px-6 py-3 text-sm font-semibold text-[var(--ga-cyan)] shadow-[0_0_20px_rgba(0,240,255,0.15)] transition touch-manipulation hover:border-[var(--ga-cyan)]/70 hover:bg-[var(--ga-cyan)]/10 hover:shadow-[0_0_28px_rgba(0,240,255,0.25)] active:brightness-95"
              >
                Explore games
              </Link>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
              Tap Book now — then choose guest checkout (email or SMS
              confirmation) or sign in to save visits on your phone.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              {
                t: "Safe & supervised",
                d: "Staff on every session, gear checked, rules explained in plain language — parents stay relaxed.",
              },
              {
                t: "Fun at every age",
                d: "From first-time jumpers to teen crews: games scale so younger kids and older siblings both get a turn in the spotlight.",
              },
              {
                t: "Parties & squads",
                d: "Birthdays, school groups, or a Saturday with friends — fast rounds, big cheers, memories that stick.",
              },
            ].map((x) => (
              <div key={x.t} className="ga-card-neon rounded-2xl p-5 backdrop-blur-sm">
                <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-[var(--ga-cyan)]">
                  {x.t}
                </p>
                <p className="mt-2 text-sm text-zinc-400">{x.d}</p>
              </div>
            ))}
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
              Mix and match sessions — each attraction is designed for quick
              turnover and maximum hype.
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
              Packages from ₹X — you bring the cake, we bring the chaos.
            </h2>
            <p className="mt-3 text-zinc-400">
              Host, decor options, arena time, and add-on food. Enquire for
              custom themes.
            </p>
            <Link
              href="/birthday"
              className="ga-btn-neon mt-6 inline-flex rounded-full px-5 py-2 text-sm font-semibold"
            >
              Birthday packages
            </Link>
          </div>
          <div className="rounded-2xl border border-[var(--ga-cyan)]/35 bg-gradient-to-br from-[var(--ga-cyan)]/10 to-transparent p-8 shadow-[0_0_40px_rgba(0,240,255,0.1)]">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--ga-cyan)] drop-shadow-[0_0_10px_rgba(0,240,255,0.35)]">
              Corporate
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
              Team battles that actually break the ice.
            </h2>
            <p className="mt-3 text-zinc-400">
              Group discounts, private slots, and facilitated formats for 10–120
              people.
            </p>
            <Link
              href="/corporate"
              className="mt-6 inline-flex rounded-full border border-[var(--ga-cyan)] px-5 py-2 text-sm font-semibold text-[var(--ga-cyan)] shadow-[0_0_16px_rgba(0,240,255,0.2)] hover:bg-[var(--ga-cyan)]/10"
            >
              Plan an offsite
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Why families pick {site.name}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "5–15+ age-friendly formats",
            "Private party rooms (coming soon)",
            "Trained floor staff on every session",
            "Easy Koramangala access & parking notes",
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
            Loved on Google
          </h2>
          <p className="mt-2 text-zinc-400">
            Embed your live Google reviews widget here — placeholder cards below.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Placeholder reviewer",
                text: "Kids didn’t want to leave — the lava arena is unreal.",
              },
              {
                name: "Placeholder reviewer",
                text: "Hosted a 10th birthday. Smooth check-in, super safe.",
              },
              {
                name: "Placeholder reviewer",
                text: "Corporate mini-tournament was the highlight of our quarter.",
              },
            ].map((r) => (
              <blockquote
                key={r.name + r.text.slice(0, 12)}
                className="rounded-2xl border border-[var(--ga-magenta)]/15 bg-black/40 p-5 shadow-[0_0_24px_rgba(255,45,140,0.06)]"
              >
                <p className="text-sm text-zinc-300">&ldquo;{r.text}&rdquo;</p>
                <footer className="mt-3 text-xs text-zinc-500">— {r.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Find us
        </h2>
        <p className="mt-2 text-zinc-400">{site.address}</p>
        <div className="mt-6 min-h-[220px] w-full max-w-full overflow-hidden rounded-2xl border border-[var(--ga-cyan)]/25 bg-zinc-900 aspect-video shadow-[0_0_40px_rgba(0,240,255,0.12)] sm:min-h-0">
          <iframe
            title="Glow Arena location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.84916296526!2d77.44109579999999!3d12.9539594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae145edc12ae15%3A0x5d6fa3f68c672c4e!2sKoramangala%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
            className="h-full min-h-[220px] w-full border-0 sm:min-h-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
}
