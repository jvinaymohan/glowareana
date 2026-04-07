"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CouponTotals } from "@/components/CouponField";
import { CouponField } from "@/components/CouponField";
import { computeComboLineItems } from "@/lib/combo-pricing";
import {
  COMBO_SIZES,
  discountPercentForSize,
  type ComboSize,
} from "@/lib/combos";
import { games } from "@/lib/site";

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function ComboBuilder() {
  const [comboSize, setComboSize] = useState<ComboSize>(3);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [participants, setParticipants] = useState(1);
  const [couponTotals, setCouponTotals] = useState<CouponTotals | null>(null);

  const lines = useMemo(
    () => computeComboLineItems(selectedOrder, comboSize, participants),
    [selectedOrder, comboSize, participants],
  );

  const {
    selectedGames,
    subtotalPerPerson,
    discountPct,
    discountAmountPerPerson,
    totalPerPerson,
    groupTotal,
    complete,
  } = lines;

  const couponDiscountInr = complete ? (couponTotals?.discountInr ?? 0) : 0;
  const payableCombo = complete
    ? (couponTotals?.payableInr ?? groupTotal)
    : groupTotal;

  function setSize(next: ComboSize) {
    setComboSize(next);
    setSelectedOrder((prev) => prev.slice(0, next));
    setCouponTotals(null);
  }

  function toggleGame(slug: string) {
    setCouponTotals(null);
    setSelectedOrder((prev) => {
      const i = prev.indexOf(slug);
      if (i !== -1) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= comboSize) return prev;
      return [...prev, slug];
    });
  }

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
      <div className="min-w-0 space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            1. Combo size & discount
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Pick how many different games are in your pass. Discount applies to
            the sum of per-person game prices.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COMBO_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSize(n)}
                className={`min-h-[52px] rounded-xl border px-4 py-3 text-left transition touch-manipulation active:brightness-95 ${
                  comboSize === n
                    ? "border-[var(--ga-orange)] bg-[var(--ga-orange)]/15"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <p className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
                  {n} games
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--ga-blue)]">
                  {discountPercentForSize(n)}% off
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            2. Choose your games ({selectedOrder.length}/{comboSize})
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Tap to add or remove. Prices are per person before combo discount.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {games.map((g) => {
              const on = selectedOrder.includes(g.slug);
              const disabled = !on && selectedOrder.length >= comboSize;
              return (
                <button
                  key={g.slug}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleGame(g.slug)}
                  className={`min-h-[56px] rounded-xl border px-4 py-3 text-left transition touch-manipulation active:brightness-95 ${
                    on
                      ? "border-[var(--ga-blue)] bg-[var(--ga-blue)]/10"
                      : disabled
                        ? "cursor-not-allowed border-white/5 opacity-45"
                        : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white">{g.title}</p>
                    <span className="shrink-0 text-sm font-medium text-[var(--ga-orange)]">
                      {formatInr(g.priceInr)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{g.blurb}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            3. Participants
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Multiply the discounted combo by headcount (each person does the
            full combo).
          </p>
          <label className="mt-3 inline-flex flex-col text-sm text-zinc-400">
            People
            <input
              type="number"
              min={1}
              max={50}
              value={participants}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10);
                if (Number.isNaN(v)) return;
                setParticipants(Math.min(50, Math.max(1, v)));
              }}
              className="mt-1 min-h-[48px] w-full max-w-[200px] rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-base text-white outline-none focus:border-[var(--ga-blue)] sm:min-h-0 sm:w-32 sm:py-2 sm:text-sm"
            />
          </label>
        </div>
      </div>

      <aside className="h-fit min-w-0 space-y-4 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-4 sm:p-6 lg:sticky lg:top-24">
        <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
          Your combo
        </h3>
        {!complete ? (
          <p className="text-sm text-zinc-500">
            Select exactly {comboSize} games to see your discounted total.
          </p>
        ) : null}

        <ul className="space-y-2 text-sm">
          {selectedGames.map((g) =>
            g ? (
              <li
                key={g.slug}
                className="flex justify-between gap-2 border-b border-white/5 py-2 text-zinc-300"
              >
                <span>{g.title}</span>
                <span className="shrink-0 text-white">{formatInr(g.priceInr)}</span>
              </li>
            ) : null,
          )}
        </ul>

        <dl className="space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-zinc-400">
            <dt>Subtotal / person</dt>
            <dd className="text-white">{formatInr(subtotalPerPerson)}</dd>
          </div>
          <div className="flex justify-between text-[var(--ga-blue)]">
            <dt>Combo discount ({discountPct}%)</dt>
            <dd>−{formatInr(discountAmountPerPerson)}</dd>
          </div>
          <div className="flex justify-between font-semibold text-white">
            <dt>Combo / person</dt>
            <dd>{formatInr(totalPerPerson)}</dd>
          </div>
          {participants > 1 ? (
            <div className="flex justify-between text-zinc-400">
              <dt>× {participants} people</dt>
              <dd className="text-zinc-200">{formatInr(groupTotal)}</dd>
            </div>
          ) : null}
          {complete && couponDiscountInr > 0 ? (
            <div className="flex justify-between text-[var(--ga-blue)]">
              <dt>
                Coupon
                {couponTotals?.appliedCode
                  ? ` (${couponTotals.appliedCode})`
                  : ""}
              </dt>
              <dd>−{formatInr(couponDiscountInr)}</dd>
            </div>
          ) : null}
        </dl>

        {complete ? (
          <CouponField
            baseAmountInr={groupTotal}
            onTotalsChange={setCouponTotals}
          />
        ) : null}

        <p className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[var(--ga-orange)]">
          {complete ? formatInr(payableCombo) : "—"}
          <span className="ml-2 text-sm font-normal text-zinc-500">
            {complete ? "to pay" : ""}
          </span>
        </p>

        <p className="text-xs text-zinc-500">
          Prototype pricing — confirm at checkout. Sessions still follow 15 min
          + 5 min reset rules per game.
        </p>

        <Link
          href={complete ? `/book` : "#"}
          onClick={(e) => {
            if (!complete) e.preventDefault();
          }}
          className={`block w-full min-h-[52px] rounded-full py-3.5 text-center text-base font-semibold touch-manipulation sm:py-3 sm:text-sm ${
            complete
              ? "bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] text-[#0b0b12] active:brightness-95"
              : "cursor-not-allowed bg-white/10 text-zinc-500"
          }`}
        >
          Book now
        </Link>
      </aside>
    </div>
  );
}
