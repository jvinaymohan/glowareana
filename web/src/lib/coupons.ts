export type CouponDef = {
  /** Percentage off the pre-coupon total (0–100) */
  percentOff?: number;
  /** Fixed INR off the pre-coupon total */
  amountOffInr?: number;
  description: string;
};

/**
 * Prototype coupon table — replace with DB / admin API in production.
 * Keys must be uppercase alphanumerics only for matching.
 */
export const COUPONS: Record<string, CouponDef> = {
  GLOW10: {
    percentOff: 10,
    description: "10% off your checkout",
  },
  ARENA15: {
    percentOff: 15,
    description: "15% off your checkout",
  },
  FLAT50: {
    amountOffInr: 50,
    description: "₹50 off",
  },
  FLAT100: {
    amountOffInr: 100,
    description: "₹100 off",
  },
  KIDSFUN20: {
    percentOff: 20,
    description: "20% off (promo)",
  },
};

/** Shown in the UI so stakeholders can test checkout */
export const DEMO_COUPON_CODES = Object.keys(COUPONS).join(", ");

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function applyCoupon(
  subtotalInr: number,
  rawCode: string,
):
  | { ok: true; code: string; discountInr: number; description: string }
  | { ok: false; error: string } {
  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { ok: false, error: "Enter a coupon code" };
  }
  const def = COUPONS[code];
  if (!def) {
    return { ok: false, error: "Invalid or expired code" };
  }
  const safeSubtotal = Math.max(0, Math.round(subtotalInr));
  let discount = 0;
  if (def.percentOff != null) {
    discount = Math.round((safeSubtotal * def.percentOff) / 100);
  } else if (def.amountOffInr != null) {
    discount = def.amountOffInr;
  }
  discount = Math.min(discount, safeSubtotal);
  return {
    ok: true,
    code,
    discountInr: discount,
    description: def.description,
  };
}
