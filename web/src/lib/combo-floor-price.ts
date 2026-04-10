import type { ComboSize } from "@/lib/combos";
import { COMBO_DISCOUNT_PERCENT } from "@/lib/combos";
import { games } from "@/lib/site";

/** Lowest per-person combo total for a given size (cheapest distinct games). */
export function comboFloorPricePerPerson(size: ComboSize): number {
  const sorted = [...games].sort((a, b) => a.priceInr - b.priceInr);
  const pick = sorted.slice(0, size);
  const sum = pick.reduce((s, g) => s + g.priceInr, 0);
  return Math.round(sum * (1 - COMBO_DISCOUNT_PERCENT[size] / 100));
}
