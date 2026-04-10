import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BirthdayPartyPlanner } from "@/components/BirthdayPartyPlanner";
import { BookingFaq } from "@/components/BookingFaq";
import { BookNowLink } from "@/components/BookNowLink";
import { FlowContactBar } from "@/components/FlowContactBar";
import { VisitMini } from "@/components/VisitMini";
import { BOOKING_FAQ_ITEMS } from "@/lib/faq-content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Birthday parties",
  description: `Birthday party planner at ${site.name} — kids, game combos, return gifts, Koramangala.`,
};

const PARTY_IMG =
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80&auto=format&fit=crop";

const packages = [
  {
    name: "Basic Glow",
    price: "From ₹1,299 / child",
    perks: [
      "90 min arena access",
      "Dedicated party host",
      "Digital invites template",
      "Birthday shout-out on LED wall",
    ],
  },
  {
    name: "Premium Lava",
    price: "From ₹1,899 / child",
    perks: [
      "Everything in Basic",
      "Neon / lava decor kit",
      "Team Arena Battle add-on",
      "Priority weekend slot hold",
    ],
    highlight: true,
  },
  {
    name: "Arena buyout",
    price: "Quote on request",
    perks: [
      "Private venue window",
      "Catering partner coordination",
      "Games master & contests",
      "Photo / video add-ons",
    ],
  },
];

export default function BirthdayPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-orange)]">
        Birthdays
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-white sm:text-4xl">
        Parties that feel like a season finale
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
        Plan crew size, pick a{" "}
        <Link href="/combos" className="text-[var(--ga-blue)] hover:underline">
          multi-game combo
        </Link>{" "}
        with tiered discounts, add return gifts, and request a venue hold on your
        date. We confirm host, decor, and final quote after you submit.
      </p>

      <FlowContactBar source="birthday_top" className="mt-8" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-white/10 sm:aspect-[2/1]">
          <Image
            src={PARTY_IMG}
            alt="Colourful birthday celebration"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
          <p className="absolute bottom-4 left-4 max-w-sm text-sm text-zinc-200">
            Placeholder image — replace with your party room and arena photos.
          </p>
        </div>
        <VisitMini source="birthday_sidebar" className="h-fit lg:sticky lg:top-24" />
      </div>

      <section id="planner" className="mt-14 scroll-mt-24">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Birthday planner
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Different from single-slot arena booking — full party planning (we
          follow up on WhatsApp or phone).
        </p>
        <div className="mt-8">
          <BirthdayPartyPlanner />
        </div>
        <FlowContactBar source="birthday_after_planner" className="mt-8" />
      </section>

      <div className="mt-20">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Host & decor packages
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Indicative per-child pricing — final numbers after date and headcount.
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
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/contact"
                  className="rounded-full border border-white/20 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/5"
                >
                  Enquire
                </Link>
                <BookNowLink
                  source={`birthday_pkg_${p.name}`}
                  href="#planner"
                  className="rounded-full bg-white py-2.5 text-center text-sm font-semibold text-[#0b0b12]"
                >
                  Book this package
                </BookNowLink>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <BookingFaq items={BOOKING_FAQ_ITEMS} />
      </div>
    </div>
  );
}
