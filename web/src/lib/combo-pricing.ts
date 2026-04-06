import { discountPercentForSize, type ComboSize } from "@/lib/combos";
import type { Game } from "@/lib/site";
import { games } from "@/lib/site";

export type ComboLineComputation = {
  selectedGames: Game[];
  subtotalPerPerson: number;
  discountPct: number;
  discountAmountPerPerson: number;
  totalPerPerson: number;
  groupTotal: number;
  complete: boolean;
};

/** Same rules as the public Combos page: discount only when exactly `comboSize` games are chosen. */
export function computeComboLineItems(
  selectedSlugs: string[],
  comboSize: ComboSize,
  kidCount: number,
): ComboLineComputation {
  const selectedGames = selectedSlugs
    .map((slug) => games.find((g) => g.slug === slug))
    .filter((g): g is Game => Boolean(g));

  const subtotalPerPerson = selectedGames.reduce(
    (sum, g) => sum + g.priceInr,
    0,
  );
  const complete = selectedSlugs.length === comboSize;
  const discountPct = complete ? discountPercentForSize(comboSize) : 0;
  const discountAmountPerPerson = complete
    ? Math.round((subtotalPerPerson * discountPct) / 100)
    : 0;
  const totalPerPerson = subtotalPerPerson - discountAmountPerPerson;
  const k = Math.max(1, Math.floor(kidCount) || 1);
  const groupTotal = Math.round(totalPerPerson * k);

  return {
    selectedGames,
    subtotalPerPerson,
    discountPct,
    discountAmountPerPerson,
    totalPerPerson,
    groupTotal,
    complete,
  };
}
