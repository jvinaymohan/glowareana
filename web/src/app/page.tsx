import Link from "next/link";
import { games, site } from "@/lib/site";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0520] via-[#0b0b12] to-[#051a24]" />
        <div className="ga-grid-bg absolute inset-0 opacity-60" />
        <div className="ga-hero-blob absolute -left-32 top-20 size-[420px] rounded-full bg-[var(--ga-lava)]/25 blur-[100px]" />
        <div className="ga-hero-blob absolute -right-20 bottom-0 size-[380px] rounded-full bg-[var(--ga-blue)]/20 blur-[90px] [animation-delay:2s]" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ga-orange)]">
              Koramangala · 3,000 SFT
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-syne)] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Don&apos;t touch the{" "}
              <span className="bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] bg-clip-text text-transparent">
                floor
              </span>
              . Own the arena.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-400">
              {site.name} is a premium indoor game zone — Floor is Lava, laser
              mazes, push battles, and team showdowns. Built for families,
              teens, birthdays, and crews who want their group chat to explode.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="ga-float inline-flex rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] px-6 py-3 text-sm font-semibold text-[#0b0b12] shadow-[0_0_40px_rgba(255,77,46,0.4)]"
              >
                Book now
              </Link>
              <Link
                href="/games"
                className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                Explore games
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Instagrammable", d: "Neon-lit sets made for reels." },
              { t: "Safe & staffed", d: "Briefings, gear, and watchful hosts." },
              { t: "Pure energy", d: "Competitive formats, zero boredom." },
            ].map((x) => (
              <div
                key={x.t}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
              >
                <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
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
              className="text-sm font-semibold text-[var(--ga-blue)] hover:underline"
            >
              View all details →
            </Link>
            <Link
              href="/combos"
              className="text-sm font-semibold text-[var(--ga-orange)] hover:underline"
            >
              Multi-game combos (up to 25% off) →
            </Link>
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.slice(0, 5).map((g) => (
            <article
              key={g.slug}
              className="group rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5 transition hover:border-[var(--ga-lava)]/40"
            >
              <div className="flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ga-lava)]/20 to-[var(--ga-blue)]/10 text-3xl">
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
              <h3 className="mt-4 font-[family-name:var(--font-syne)] text-xl font-bold text-white group-hover:text-[var(--ga-orange)]">
                {g.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{g.blurb}</p>
              <p className="mt-3 text-xs text-zinc-500">{g.priceFrom}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080812] py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6">
          <div className="rounded-2xl border border-[var(--ga-orange)]/30 bg-gradient-to-br from-[var(--ga-orange)]/10 to-transparent p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--ga-orange)]">
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
              className="mt-6 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0b0b12]"
            >
              Birthday packages
            </Link>
          </div>
          <div className="rounded-2xl border border-[var(--ga-blue)]/30 bg-gradient-to-br from-[var(--ga-blue)]/10 to-transparent p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--ga-blue)]">
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
              className="mt-6 inline-flex rounded-full border border-[var(--ga-blue)] px-5 py-2 text-sm font-semibold text-[var(--ga-blue)] hover:bg-[var(--ga-blue)]/10"
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
              className="flex gap-3 rounded-xl border border-white/10 bg-[var(--ga-surface)] p-4 text-sm text-zinc-300"
            >
              <span className="text-[var(--ga-lava)]">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-white/10 bg-[var(--ga-surface)] py-16">
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
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
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
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
          <iframe
            title="Glow Arena location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.84916296526!2d77.44109579999999!3d12.9539594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae145edc12ae15%3A0x5d6fa3f68c672c4e!2sKoramangala%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  );
}
