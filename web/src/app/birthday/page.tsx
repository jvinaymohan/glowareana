import type { Metadata } from "next";
import Link from "next/link";
import { BirthdayPartyPlanner } from "@/components/BirthdayPartyPlanner";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Birthday parties",
  description: `Birthday party planner at ${site.name} — kids, game combos, return gifts, Koramangala.`,
};

const packages = [
  {
    name: "Basic Glow",
    price: "From ₹X / child",
    perks: [
      "90 min arena access",
      "Dedicated party host",
      "Digital invites template",
      "Complimentary birthday shout-out on LED wall",
    ],
  },
  {
    name: "Premium Lava",
    price: "From ₹X / child",
    perks: [
      "Everything in Basic",
      "Themed decor kit (neon / lava)",
      "Team Arena Battle add-on",
      "Priority weekend slot hold",
    ],
    highlight: true,
  },
  {
    name: "Custom Build",
    price: "Quote on request",
    perks: [
      "Full arena buyout options",
      "Catering partner coordination",
      "Private games master & contests",
      "Photo / video add-ons",
    ],
  },
];

export default function BirthdayPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-orange)]">
        Birthdays
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
        Parties that feel like a season finale
      </h1>
      <p className="mt-4 max-w-2xl text-zinc-400">
        Plan the crew size, pick a{" "}
        <Link href="/combos" className="text-[var(--ga-blue)] hover:underline">
          multi-game combo
        </Link>{" "}
        with the same tiered discounts, and add return gifts if you like. We
        confirm decor, host, and final quote after you submit.
      </p>

      <section id="planner" className="mt-14 scroll-mt-24">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Birthday planner
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Different from single-slot arena booking — this is for full party
          planning (no time-slot picker here).
        </p>
        <div className="mt-8">
          <BirthdayPartyPlanner />
        </div>
      </section>

      <div className="mt-20">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Host & decor packages
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Layer these on top of your game combo — pricing placeholders.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {packages.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                p.highlight
                  ? "border-[var(--ga-orange)] bg-gradient-to-b from-[var(--ga-orange)]/15 to-[var(--ga-surface)] shadow-[0_0_40px_rgba(255,159,28,0.15)]"
                  : "border-white/10 bg-[var(--ga-surface)]"
              }`}
            >
              {p.highlight ? (
                <span className="w-fit rounded-full bg-[var(--ga-orange)] px-2 py-0.5 text-xs font-bold text-[#0b0b12]">
                  Most booked
                </span>
              ) : null}
              <h3 className="mt-3 font-[family-name:var(--font-syne)] text-xl font-bold text-white">
                {p.name}
              </h3>
              <p className="mt-2 font-semibold text-[var(--ga-blue)]">{p.price}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-300">
                {p.perks.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="text-[var(--ga-lava)]">●</span>
                    {x}
                  </li>
                ))}
              </ul>
              <a
                href="#planner"
                className="mt-6 rounded-full bg-white py-2 text-center text-sm font-semibold text-[#0b0b12]"
              >
                Use planner above
              </a>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-20">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Party gallery
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Replace with real photos from your venue.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="aspect-square rounded-xl bg-gradient-to-br from-[var(--ga-lava)]/30 to-[var(--ga-blue)]/20"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
