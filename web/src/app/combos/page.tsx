import type { Metadata } from "next";
import Link from "next/link";
import { BookingFaq } from "@/components/BookingFaq";
import { BookNowLink } from "@/components/BookNowLink";
import { ComboBuilder } from "@/components/ComboBuilder";
import { FlowContactBar } from "@/components/FlowContactBar";
import { VisitMini } from "@/components/VisitMini";
import { comboFloorPricePerPerson } from "@/lib/combo-floor-price";
import { COMBO_SIZES, discountPercentForSize } from "@/lib/combos";
import { BOOKING_FAQ_ITEMS } from "@/lib/faq-content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Game combos & passes",
  description: `Build a 2–5 game combo at ${site.name} with up to 25% off per-person pricing.`,
};

const NAMED = [
  {
    name: "Duo Dash",
    size: 2 as const,
    blurb: "Two attractions — great for a first visit or siblings with different tastes.",
  },
  {
    name: "Triple Threat",
    size: 3 as const,
    blurb: "Hit three zones in one afternoon; our most popular weekend pass shape.",
  },
  {
    name: "Full Spectrum",
    size: 5 as const,
    blurb: "Every game in one day — max discount tier for crews who want the full arena.",
  },
];

export default function CombosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-orange)]">
        Multi-game passes
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-white sm:text-4xl">
        Stack games. Stack savings.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
        Pick any {COMBO_SIZES[0]}–{COMBO_SIZES[COMBO_SIZES.length - 1]} games in
        one pass — discounts on the sum of per-child prices:{" "}
        <span className="text-zinc-200">
          {COMBO_SIZES.map(
            (n) => `${discountPercentForSize(n)}% off (${n} games)`,
          ).join(" · ")}
        </span>
        . Each game still uses its own ~25–30 min slot when you book times.
      </p>

      <FlowContactBar source="combos_top" className="mt-8" />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
            Starter packages (indicative)
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            “From” uses the cheapest games in each size; your mix may differ.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {NAMED.map((p) => {
              const from = comboFloorPricePerPerson(p.size);
              return (
                <div
                  key={p.name}
                  className="flex flex-col rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5"
                >
                  <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
                    {p.name}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">{p.blurb}</p>
                  <p className="mt-4 text-lg font-bold text-[var(--ga-orange)]">
                    From ₹{from.toLocaleString("en-IN")} / child
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {p.size} games · {discountPercentForSize(p.size)}% combo discount
                  </p>
                  <div className="mt-4 flex flex-1 flex-col gap-2">
                    <BookNowLink
                      source={`combos_package_${p.size}`}
                      className="ga-btn-neon inline-flex min-h-[44px] items-center justify-center rounded-full py-2.5 text-center text-sm font-semibold touch-manipulation"
                    />
                    <Link
                      href="/contact"
                      className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 py-2.5 text-center text-sm text-zinc-300 touch-manipulation hover:bg-white/5"
                    >
                      Enquire
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <VisitMini source="combos_sidebar" className="h-fit lg:sticky lg:top-24" />
      </div>

      <div className="mt-12">
        <ComboBuilder />
      </div>

      <div className="mt-16">
        <BookingFaq items={BOOKING_FAQ_ITEMS} />
      </div>
    </div>
  );
}
