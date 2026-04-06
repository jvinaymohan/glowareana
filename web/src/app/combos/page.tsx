import type { Metadata } from "next";
import { ComboBuilder } from "@/components/ComboBuilder";
import { COMBO_SIZES, discountPercentForSize } from "@/lib/combos";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Game combos & passes",
  description: `Build a 2–5 game combo at ${site.name} with up to 25% off per-person pricing.`,
};

export default function CombosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-orange)]">
        Multi-game passes
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
        Stack games. Stack savings.
      </h1>
      <p className="mt-4 max-w-2xl text-zinc-400">
        Pick any {COMBO_SIZES[0]}–{COMBO_SIZES[COMBO_SIZES.length - 1]} games in
        one pass — discounts apply to the total per-person price:{" "}
        <span className="text-zinc-200">
          {COMBO_SIZES.map(
            (n) => `${discountPercentForSize(n)}% off (${n} games)`,
          ).join(" · ")}
        </span>
        .
      </p>

      <div className="mt-12">
        <ComboBuilder />
      </div>
    </div>
  );
}
