/** Combo size → discount on the sum of per-person game prices */
export const COMBO_DISCOUNT_PERCENT: Record<2 | 3 | 4 | 5, number> = {
  2: 10,
  3: 15,
  4: 20,
  5: 25,
} as const;

export type ComboSize = keyof typeof COMBO_DISCOUNT_PERCENT;

export const COMBO_SIZES = [2, 3, 4, 5] as const satisfies readonly ComboSize[];

export function discountPercentForSize(size: ComboSize): number {
  return COMBO_DISCOUNT_PERCENT[size];
}
