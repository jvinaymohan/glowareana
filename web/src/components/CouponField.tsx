"use client";

import { useEffect, useMemo, useState } from "react";
import { applyCoupon, DEMO_COUPON_CODES, normalizeCouponCode } from "@/lib/coupons";

export type CouponTotals = {
  discountInr: number;
  payableInr: number;
  appliedCode: string | null;
  appliedDescription: string | null;
};

type CouponFieldProps = {
  /** Amount before coupon (INR) */
  baseAmountInr: number;
  /** Called whenever base, apply, or clear changes totals */
  onTotalsChange: (totals: CouponTotals) => void;
};

export function CouponField({ baseAmountInr, onTotalsChange }: CouponFieldProps) {
  const [input, setInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [appliedDescription, setAppliedDescription] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo((): CouponTotals => {
    const safeBase = Math.max(0, Math.round(baseAmountInr));
    if (!appliedCode) {
      return {
        discountInr: 0,
        payableInr: safeBase,
        appliedCode: null,
        appliedDescription: null,
      };
    }
    const res = applyCoupon(safeBase, appliedCode);
    if (!res.ok) {
      return {
        discountInr: 0,
        payableInr: safeBase,
        appliedCode: null,
        appliedDescription: null,
      };
    }
    return {
      discountInr: res.discountInr,
      payableInr: safeBase - res.discountInr,
      appliedCode: res.code,
      appliedDescription: res.description,
    };
  }, [baseAmountInr, appliedCode]);

  useEffect(() => {
    onTotalsChange(totals);
  }, [totals, onTotalsChange]);

  function handleApply() {
    const res = applyCoupon(baseAmountInr, input);
    if (res.ok) {
      setAppliedCode(res.code);
      setAppliedDescription(res.description);
      setError(null);
      setInput(res.code);
    } else {
      setAppliedCode(null);
      setAppliedDescription(null);
      setError(res.error);
    }
  }

  function handleClear() {
    setInput("");
    setAppliedCode(null);
    setAppliedDescription(null);
    setError(null);
  }

  const showMismatch =
    appliedCode &&
    normalizeCouponCode(input) !== appliedCode &&
    input.trim() !== "";

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-medium text-white">Coupon code</p>
      <p className="mt-1 text-xs text-zinc-500">
        Prototype codes: {DEMO_COUPON_CODES}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder="e.g. GLOW10"
          autoComplete="off"
          className="min-h-[48px] min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-base text-white uppercase outline-none placeholder:text-zinc-600 focus:border-[var(--ga-blue)] sm:min-h-0 sm:py-2 sm:text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="min-h-[48px] flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white touch-manipulation hover:bg-white/15 sm:min-h-0 sm:flex-none"
          >
            Apply
          </button>
          {appliedCode ? (
            <button
              type="button"
              onClick={handleClear}
              className="min-h-[48px] rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-400 touch-manipulation hover:text-white sm:min-h-0"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-[var(--ga-lava)]">{error}</p>
      ) : null}
      {appliedCode && !error ? (
        <p className="mt-2 text-xs text-[var(--ga-blue)]">
          Applied <strong className="text-white">{appliedCode}</strong>
          {appliedDescription ? ` — ${appliedDescription}` : ""}
        </p>
      ) : null}
      {showMismatch ? (
        <p className="mt-1 text-xs text-zinc-500">
          Code in the box differs from the applied coupon — press Apply to
          update.
        </p>
      ) : null}
    </div>
  );
}
