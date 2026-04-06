"use client";

import { useMemo, useState } from "react";
import {
  BIRTHDAY_KID_MAX,
  BIRTHDAY_KID_MIN,
  BIRTHDAY_RETURN_GIFT_PER_CHILD_INR,
} from "@/lib/birthday-config";
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

export function BirthdayPartyPlanner() {
  const [kidCount, setKidCount] = useState(12);
  const [comboSize, setComboSize] = useState<ComboSize>(3);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [returnGifts, setReturnGifts] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  /** When true (default), preferred date blocks all public arena slots that day. */
  const [reserveVenue, setReserveVenue] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  const lines = useMemo(
    () => computeComboLineItems(selectedOrder, comboSize, kidCount),
    [selectedOrder, comboSize, kidCount],
  );

  const giftsFee = returnGifts ? kidCount * BIRTHDAY_RETURN_GIFT_PER_CHILD_INR : 0;
  const estimatedTotal = lines.groupTotal + giftsFee;

  function setSize(next: ComboSize) {
    setComboSize(next);
    setSelectedOrder((prev) => prev.slice(0, next));
  }

  function toggleGame(slug: string) {
    setSelectedOrder((prev) => {
      const i = prev.indexOf(slug);
      if (i !== -1) return prev.filter((s) => s !== slug);
      if (prev.length >= comboSize) return prev;
      return [...prev, slug];
    });
  }

  const kidsOk =
    kidCount >= BIRTHDAY_KID_MIN &&
    kidCount <= BIRTHDAY_KID_MAX &&
    Number.isInteger(kidCount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!kidsOk) {
      setError(
        `Enter ${BIRTHDAY_KID_MIN}–${BIRTHDAY_KID_MAX} kids for the party.`,
      );
      return;
    }
    if (!lines.complete) {
      setError(`Choose exactly ${comboSize} games for the birthday combo.`);
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/birthday-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidCount,
          comboSize,
          gameSlugs: selectedOrder,
          returnGifts,
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          preferredDate: preferredDate.trim(),
          notes: notes.trim(),
          reserveVenueForPublicBooking: reserveVenue,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((j as { error?: string }).error ?? "Request failed");
      }
      const ref = (j as { request?: { reference?: string } }).request?.reference;
      setDoneRef(ref ?? "Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (doneRef) {
    return (
      <div className="rounded-2xl border border-[var(--ga-orange)]/30 bg-gradient-to-b from-[var(--ga-orange)]/10 to-[var(--ga-surface)] p-8 text-center">
        <p className="text-4xl">🎂</p>
        <h2 className="mt-4 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Birthday request received
        </h2>
        <p className="mt-2 font-mono text-lg text-[var(--ga-blue)]">{doneRef}</p>
        <p className="mt-3 text-sm text-zinc-400">
          Our team will confirm decor, host, and final pricing. You can track
          requests in{" "}
          <a href="/admin" className="text-[var(--ga-blue)] hover:underline">
            Admin
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setDoneRef(null);
            setError(null);
          }}
          className="mt-6 rounded-full border border-white/20 px-6 py-2 text-sm text-white hover:bg-white/5"
        >
          Plan another party
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-10 lg:grid-cols-[1fr_340px]"
    >
      <div className="space-y-8">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
          Birthday parties use a <strong className="text-zinc-200">simple planner</strong>
          : kids, <strong className="text-zinc-200">game combo</strong> (same
          discounts as Combos), and optional{" "}
          <strong className="text-zinc-200">return gifts</strong>. With a
          preferred date, you can{" "}
          <strong className="text-zinc-200">hold the venue</strong> so walk-in
          slot booking is closed that day —{" "}
          <strong className="text-zinc-200">birthday takes precedence</strong>.
        </div>

        <section>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            1. How many kids?
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Approximate headcount for the birthday crew ({BIRTHDAY_KID_MIN}–
            {BIRTHDAY_KID_MAX}).
          </p>
          <input
            type="number"
            min={BIRTHDAY_KID_MIN}
            max={BIRTHDAY_KID_MAX}
            value={kidCount}
            onChange={(e) => {
              const v = Number.parseInt(e.target.value, 10);
              if (Number.isNaN(v)) return;
              setKidCount(Math.min(BIRTHDAY_KID_MAX, Math.max(BIRTHDAY_KID_MIN, v)));
            }}
            className="mt-3 w-32 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-lg font-semibold text-white outline-none focus:border-[var(--ga-blue)]"
          />
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            2. Birthday game combo
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Pick how many attractions are included, then select the games.
            Discounts:{" "}
            {COMBO_SIZES.map(
              (n) => `${discountPercentForSize(n)}% on ${n}`,
            ).join(" · ")}
            .
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COMBO_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSize(n)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  comboSize === n
                    ? "border-[var(--ga-orange)] bg-[var(--ga-orange)]/15"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <p className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
                  {n} games
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--ga-blue)]">
                  {discountPercentForSize(n)}% off combo
                </p>
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Selected: {selectedOrder.length}/{comboSize} games
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {games.map((g) => {
              const on = selectedOrder.includes(g.slug);
              const disabled = !on && selectedOrder.length >= comboSize;
              return (
                <button
                  key={g.slug}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleGame(g.slug)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    on
                      ? "border-[var(--ga-blue)] bg-[var(--ga-blue)]/10"
                      : disabled
                        ? "cursor-not-allowed border-white/5 opacity-45"
                        : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-white">{g.title}</span>
                    <span className="text-sm text-[var(--ga-orange)]">
                      {formatInr(g.priceInr)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{g.blurb}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            3. Return gifts
          </h2>
          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
            <input
              type="checkbox"
              checked={returnGifts}
              onChange={(e) => setReturnGifts(e.target.checked)}
              className="mt-1 size-4 rounded border-white/30 accent-[var(--ga-orange)]"
            />
            <span className="text-sm text-zinc-300">
              Yes, include return gifts for each child (
              {formatInr(BIRTHDAY_RETURN_GIFT_PER_CHILD_INR)} × {kidCount} kids
              {returnGifts ? ` = ${formatInr(giftsFee)}` : ""}).
            </span>
          </label>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            4. Preferred date & contact
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-zinc-400">
              Preferred party date
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
              />
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4 sm:col-span-2">
              <input
                type="checkbox"
                checked={reserveVenue}
                onChange={(e) => setReserveVenue(e.target.checked)}
                disabled={!preferredDate}
                className="mt-1 size-4 rounded border-white/30 accent-[var(--ga-orange)] disabled:opacity-40"
              />
              <span className="text-sm text-zinc-300">
                <strong className="text-white">Venue hold (recommended)</strong>{" "}
                — close public online booking for this entire date so regular
                session slots don&apos;t conflict with the party. Uncheck only if
                you&apos;re still tentative on the date.
              </span>
            </label>
            <label className="block text-sm text-zinc-400 sm:col-span-2">
              Parent / organiser name *
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              Phone *
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
              />
            </label>
            <label className="block text-sm text-zinc-400 sm:col-span-2">
              Notes (age, theme, food…)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
              />
            </label>
          </div>
        </section>

        {error ? (
          <p className="text-sm text-[var(--ga-lava)]">{error}</p>
        ) : null}
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6 lg:sticky lg:top-24">
        <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
          Estimate summary
        </h3>
        <ul className="space-y-2 text-sm text-zinc-300">
          {lines.selectedGames.map((g) => (
            <li key={g.slug} className="flex justify-between gap-2">
              <span>{g.title}</span>
              <span className="text-white">{formatInr(g.priceInr)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-zinc-400">
            <dt>Subtotal / child (games)</dt>
            <dd className="text-white">{formatInr(lines.subtotalPerPerson)}</dd>
          </div>
          {lines.complete ? (
            <div className="flex justify-between text-[var(--ga-blue)]">
              <dt>Combo discount ({lines.discountPct}%)</dt>
              <dd>−{formatInr(lines.discountAmountPerPerson * kidCount)}</dd>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              Select all {comboSize} games to unlock combo discount.
            </p>
          )}
          <div className="flex justify-between font-medium text-white">
            <dt>Combo total ({kidCount} kids)</dt>
            <dd>{formatInr(lines.groupTotal)}</dd>
          </div>
          {returnGifts ? (
            <div className="flex justify-between text-zinc-400">
              <dt>Return gifts</dt>
              <dd>{formatInr(giftsFee)}</dd>
            </div>
          ) : null}
        </dl>
        <p className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[var(--ga-orange)]">
          {formatInr(estimatedTotal)}
          <span className="ml-2 text-sm font-normal text-zinc-500">indicative</span>
        </p>
        <p className="text-xs text-zinc-500">
          Host, room, cake, and decor may be quoted separately. This saves your
          combo + gifts preference to our admin queue.
        </p>
        <button
          type="submit"
          disabled={submitting || !lines.complete || !kidsOk}
          className="w-full rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] py-3 text-sm font-semibold text-[#0b0b12] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Sending…" : "Submit birthday request"}
        </button>
      </aside>
    </form>
  );
}
