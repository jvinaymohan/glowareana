"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bookingAuthHref } from "@/lib/booking-auth";
import {
  BOOKING_RULES,
  generateDaySlots,
  maxSlotsPerLanePerDay,
  slotIntervalMinutes,
} from "@/lib/booking";
import { formatLocalYmd } from "@/lib/date-utils";
import type { CouponTotals } from "@/components/CouponField";
import { CouponField } from "@/components/CouponField";
import { games } from "@/lib/site";

type Step = 1 | 2 | 3 | 4;

/** Persists guest choice so refresh mid-flow doesn’t re-show the entry gate. */
const SESSION_GUEST_KEY = "ga_book_guest_v1";

const DAY_SLOTS = generateDaySlots();
const MAX_SLOTS = maxSlotsPerLanePerDay();

type BookingEntry = "loading" | "gate" | "flow";

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type BookingPrototypeProps = {
  initialGameSlug?: string;
};

type SessionUser = { id: string; email: string; phone: string };

type BookingNotifications = {
  emailSent: boolean;
  smsSent: boolean;
  emailMessage?: string;
  smsMessage?: string;
};

export function BookingPrototype({ initialGameSlug }: BookingPrototypeProps) {
  const validInitial =
    initialGameSlug && games.some((g) => g.slug === initialGameSlug)
      ? initialGameSlug
      : games[0].slug;
  const [step, setStep] = useState<Step>(1);
  const [gameId, setGameId] = useState<string>(validInitial);
  const [kidCount, setKidCount] = useState(1);
  const [dayOffset, setDayOffset] = useState(1);
  const [slotKey, setSlotKey] = useState<string>(DAY_SLOTS[0]?.key ?? "10:00");
  const [waiver, setWaiver] = useState(false);
  const [done, setDone] = useState(false);
  const [couponTotals, setCouponTotals] = useState<CouponTotals | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<
    {
      key: string;
      rangeLabel: string;
      available: boolean;
      reason: null | "blocked" | "booked" | "birthday";
    }[]
  >([]);
  const [birthdayPartyHold, setBirthdayPartyHold] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyStatus, setNotifyStatus] = useState<BookingNotifications | null>(
    null,
  );
  const [bookingEntry, setBookingEntry] = useState<BookingEntry>("loading");

  const selectedGame = useMemo(
    () => games.find((g) => g.slug === gameId) ?? games[0],
    [gameId],
  );

  const selectedSlot = useMemo(
    () => DAY_SLOTS.find((s) => s.key === slotKey) ?? DAY_SLOTS[0],
    [slotKey],
  );

  const date = useMemo(() => addDays(new Date(), dayOffset), [dayOffset]);
  const dateStr = useMemo(() => formatLocalYmd(date), [date]);

  useEffect(() => {
    const max = selectedGame.maxKidsPerSession;
    setKidCount((k) => Math.min(Math.max(1, k), max));
  }, [selectedGame]);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { user?: SessionUser | null }) => {
        if (d.user) {
          setSessionUser(d.user);
          setEmail((prev) => prev || d.user!.email);
          setPhone((prev) => prev || d.user!.phone);
          setBookingEntry("flow");
          return;
        }
        try {
          setBookingEntry(
            sessionStorage.getItem(SESSION_GUEST_KEY) === "1"
              ? "flow"
              : "gate",
          );
        } catch {
          setBookingEntry("gate");
        }
      })
      .catch(() => {
        try {
          setBookingEntry(
            sessionStorage.getItem(SESSION_GUEST_KEY) === "1"
              ? "flow"
              : "gate",
          );
        } catch {
          setBookingEntry("gate");
        }
      });
  }, []);

  useEffect(() => {
    if (bookingEntry !== "flow") return;
    const ac = new AbortController();
    setSlotsLoading(true);
    setSlotsError(null);
    fetch(
      `/api/bookings/availability?game=${encodeURIComponent(gameId)}&date=${encodeURIComponent(dateStr)}`,
      { signal: ac.signal },
    )
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? r.statusText);
        }
        return r.json() as Promise<{
          slots: {
            key: string;
            rangeLabel: string;
            available: boolean;
            reason: null | "blocked" | "booked" | "birthday";
          }[];
          availableCount: number;
          birthdayPartyHold?: boolean;
        }>;
      })
      .then((data) => {
        setBirthdayPartyHold(Boolean(data.birthdayPartyHold));
        setAvailability(data.slots);
        const firstOpen = data.slots.find((s) => s.available);
        setSlotKey((prev) => {
          const still = data.slots.find((s) => s.key === prev && s.available);
          if (still) return prev;
          return firstOpen?.key ?? data.slots[0]?.key ?? prev;
        });
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setSlotsError(e instanceof Error ? e.message : "Could not load slots");
        setAvailability([]);
        setBirthdayPartyHold(false);
      })
      .finally(() => setSlotsLoading(false));
    return () => ac.abort();
  }, [gameId, dateStr, bookingEntry]);

  const availableCount = availability.filter((s) => s.available).length;

  const currentSlotOpen = useMemo(() => {
    const row = availability.find((s) => s.key === slotKey);
    return row?.available ?? false;
  }, [availability, slotKey]);

  const kidsValid =
    kidCount >= 1 && kidCount <= selectedGame.maxKidsPerSession;

  const bookingSubtotal = selectedGame.priceInr * kidCount;
  const payableInr = couponTotals?.payableInr ?? bookingSubtotal;
  const couponDiscountInr = couponTotals?.discountInr ?? 0;

  if (done) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-4xl">🔥</p>
          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            Booking confirmed
          </h2>
          {confirmedRef ? (
            <p className="mt-2 font-mono text-lg text-[var(--ga-blue)]">
              {confirmedRef}
            </p>
          ) : null}
          <p className="mt-2 text-zinc-400">
            Saved to the arena booking store. Razorpay can be added for real
            payments; see admin for slots and revenue.
          </p>
          {notifyStatus ? (
            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-left text-sm">
              <p className="font-medium text-zinc-300">Confirmation delivery</p>
              <ul className="mt-2 space-y-1.5 text-zinc-400">
                <li>
                  {notifyStatus.emailSent ? (
                    <span className="text-emerald-400/90">
                      Email confirmation sent
                    </span>
                  ) : notifyStatus.emailMessage ? (
                    <span>
                      Email:{" "}
                      <span className="text-zinc-500">
                        {notifyStatus.emailMessage}
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-500">Email not requested</span>
                  )}
                </li>
                <li>
                  {notifyStatus.smsSent ? (
                    <span className="text-emerald-400/90">
                      Text message confirmation sent
                    </span>
                  ) : notifyStatus.smsMessage ? (
                    <span>
                      SMS:{" "}
                      <span className="text-zinc-500">
                        {notifyStatus.smsMessage}
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-500">SMS not requested</span>
                  )}
                </li>
              </ul>
            </div>
          ) : null}
          <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
            <div className="flex justify-between gap-4 border-b border-white/10 py-2">
              <dt className="text-zinc-500">Experience</dt>
              <dd className="font-medium text-white">{selectedGame.title}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 py-2">
              <dt className="text-zinc-500">When</dt>
              <dd className="font-medium text-white">
                {formatDate(date)} · {selectedSlot?.rangeLabel ?? ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-zinc-500">Kids</dt>
              <dd className="font-medium text-white">{kidCount}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 py-2">
              <dt className="text-zinc-500">Subtotal</dt>
              <dd className="font-medium text-white">
                ₹{bookingSubtotal.toLocaleString("en-IN")}
              </dd>
            </div>
            {couponDiscountInr > 0 ? (
              <div className="flex justify-between gap-4 border-b border-white/10 py-2">
                <dt className="text-zinc-500">
                  Coupon{" "}
                  {couponTotals?.appliedCode
                    ? `(${couponTotals.appliedCode})`
                    : ""}
                </dt>
                <dd className="font-medium text-[var(--ga-blue)]">
                  −₹{couponDiscountInr.toLocaleString("en-IN")}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-zinc-500">Paid (est.)</dt>
              <dd className="font-semibold text-[var(--ga-orange)]">
                ₹{payableInr.toLocaleString("en-IN")}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setStep(1);
              setWaiver(false);
              setCouponTotals(null);
              setConfirmedRef(null);
              setCustomerName("");
              setPhone("");
              setEmail("");
              setSubmitError(null);
              setNotifyEmail(true);
              setNotifySms(true);
              setNotifyStatus(null);
              try {
                sessionStorage.removeItem(SESSION_GUEST_KEY);
              } catch {
                /* ignore */
              }
              setBookingEntry(sessionUser ? "flow" : "gate");
            }}
            className="mt-8 min-h-[48px] rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white touch-manipulation hover:bg-white/5"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  if (bookingEntry === "loading") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6 sm:p-8">
        <div className="h-2 animate-pulse rounded-full bg-white/10" />
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (bookingEntry === "gate") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5 sm:p-8">
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white sm:text-2xl">
          How do you want to book?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Choose one — both options finish on this screen. Use a real email or
          phone so we can send your confirmation.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.setItem(SESSION_GUEST_KEY, "1");
              } catch {
                /* ignore */
              }
              setBookingEntry("flow");
            }}
            className="flex w-full flex-col items-start rounded-2xl border border-[var(--ga-orange)]/40 bg-gradient-to-br from-[var(--ga-lava)]/15 to-[var(--ga-orange)]/10 px-4 py-4 text-left transition touch-manipulation active:brightness-95 sm:min-h-[56px] sm:px-5 sm:py-5"
          >
            <span className="text-base font-semibold text-white">
              Continue as guest
            </span>
            <span className="mt-1 text-sm text-zinc-400">
              No password. We&apos;ll email or text your booking reference at the
              end.
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = bookingAuthHref();
            }}
            className="flex w-full flex-col items-start rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-left transition touch-manipulation hover:border-white/25 active:brightness-95 sm:min-h-[56px] sm:px-5 sm:py-5"
          >
            <span className="text-base font-semibold text-white">
              Sign in or create account
            </span>
            <span className="mt-1 text-sm text-zinc-500">
              Then you&apos;re back here to pick your slot — faster next time &
              easy rescheduling.
            </span>
          </button>
        </div>
        <p className="mt-5 text-center text-xs text-zinc-600">
          Tip on mobile: add your email carefully — that&apos;s where we send the
          receipt.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5 sm:p-8">
      <div className="mb-5 flex gap-2 sm:mb-6">
        {([1, 2, 3, 4] as const).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              step >= s ? "bg-[var(--ga-lava)]" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {sessionUser ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ga-cyan)]/25 bg-[var(--ga-cyan)]/5 px-4 py-3 text-sm text-zinc-300">
          <span>
            Signed in as{" "}
            <strong className="text-white">{sessionUser.email}</strong>
          </span>
          <Link
            href="/account"
            className="min-h-[44px] shrink-0 content-center font-medium text-[var(--ga-blue)] hover:underline"
          >
            My bookings
          </Link>
        </div>
      ) : null}

      <p className="mb-5 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-xs leading-relaxed text-zinc-400 sm:mb-6">
        Each game is <strong className="text-zinc-200">15 minutes</strong> of
        play. We block{" "}
        <strong className="text-zinc-200">
          {BOOKING_RULES.resetMinutes} minutes
        </strong>{" "}
        after every session to reset the arena. Start times are{" "}
        <strong className="text-zinc-200">
          {slotIntervalMinutes()} minutes
        </strong>{" "}
        apart (10:00 AM – 7:40 PM, one lane per game — prototype schedule).
      </p>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
            Choose experience
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {games.map((g) => (
              <button
                key={g.slug}
                type="button"
                onClick={() => setGameId(g.slug)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  gameId === g.slug
                    ? "border-[var(--ga-blue)] bg-[var(--ga-blue)]/10"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <p className="font-semibold text-white">{g.title}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  Max{" "}
                  <span className="font-semibold text-[var(--ga-orange)]">
                    {g.maxKidsPerSession} kids
                  </span>{" "}
                  per 15-min session · {g.priceFrom}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {MAX_SLOTS} start times / day on this lane (includes 5-min
                  reset gap)
                </p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full min-h-[48px] rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] py-3.5 text-base font-semibold text-[#0b0b12] touch-manipulation active:brightness-95 sm:w-auto sm:px-10 sm:text-sm"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
            Number of kids
          </h2>
          <p className="text-sm text-zinc-400">
            <span className="font-medium text-white">{selectedGame.title}</span>{" "}
            allows up to{" "}
            <span className="text-[var(--ga-blue)] font-semibold">
              {selectedGame.maxKidsPerSession} kids
            </span>{" "}
            in one 15-minute block.
          </p>
          <label className="block text-sm text-zinc-400">
            Kids in your group
            <input
              type="number"
              min={1}
              max={selectedGame.maxKidsPerSession}
              value={kidCount}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10);
                if (Number.isNaN(v)) return;
                setKidCount(
                  Math.min(
                    selectedGame.maxKidsPerSession,
                    Math.max(1, v),
                  ),
                );
              }}
              className="mt-2 w-full max-w-[200px] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-lg font-semibold text-white outline-none focus:border-[var(--ga-blue)]"
            />
          </label>
          {!kidsValid ? (
            <p className="text-sm text-[var(--ga-lava)]">
              Enter between 1 and {selectedGame.maxKidsPerSession} kids.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[48px] rounded-full border border-white/20 px-5 py-2.5 text-sm text-white touch-manipulation hover:bg-white/5"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!kidsValid}
              onClick={() => setStep(3)}
              className="min-h-[48px] flex-1 rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] px-6 py-2.5 text-sm font-semibold text-[#0b0b12] touch-manipulation disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              Pick a time
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
            Date & time
          </h2>
          <p className="text-sm text-zinc-400">
            {slotsLoading ? (
              "Loading live availability…"
            ) : slotsError ? (
              <span className="text-[var(--ga-lava)]">{slotsError}</span>
            ) : birthdayPartyHold ? (
              <span className="text-[var(--ga-orange)]">
                This date is held for a <strong>birthday party</strong> — public
                arena slots are closed (birthday takes precedence). Choose
                another day or call the venue.
              </span>
            ) : (
              <>
                <span className="text-zinc-200 font-medium">
                  {availableCount} of {MAX_SLOTS}
                </span>{" "}
                start times open for{" "}
                <span className="text-zinc-200">{selectedGame.title}</span> on{" "}
                <span className="text-zinc-200">{dateStr}</span> (booked &
                admin-blocked slots hidden; birthday parties can reserve a full
                day).
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDayOffset(n)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  dayOffset === n
                    ? "border-[var(--ga-orange)] bg-[var(--ga-orange)]/15 text-white"
                    : "border-white/10 text-zinc-300 hover:border-white/25"
                }`}
              >
                {formatDate(addDays(new Date(), n))}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 max-h-[280px] overflow-y-auto pr-1">
            {(availability.length > 0
              ? availability
              : DAY_SLOTS.map((s) => ({
                  key: s.key,
                  rangeLabel: s.rangeLabel,
                  available: false,
                  reason: null as null | "blocked" | "booked" | "birthday",
                }))
            ).map((row) => {
              const open = row.available;
              const active = slotKey === row.key;
              const reasonLabel =
                row.reason === "blocked"
                  ? "Blocked"
                  : row.reason === "booked"
                    ? "Booked"
                    : row.reason === "birthday"
                      ? "Party"
                      : null;
              return (
                <button
                  key={row.key}
                  type="button"
                  disabled={!open || slotsLoading}
                  onClick={() => open && setSlotKey(row.key)}
                  title={
                    open ? row.rangeLabel : reasonLabel ?? "Unavailable"
                  }
                  className={`rounded-lg border py-2 text-left text-xs leading-snug sm:text-sm ${
                    !open
                      ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-600 line-through"
                      : active
                        ? "border-[var(--ga-blue)] bg-[var(--ga-blue)]/10 text-white"
                        : "border-white/10 text-zinc-300 hover:border-white/25"
                  }`}
                >
                  <span className="block font-medium">{row.rangeLabel}</span>
                  {!open ? (
                    <span className="text-[10px] text-zinc-600">
                      {reasonLabel}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">
                      +{BOOKING_RULES.resetMinutes}m reset
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[48px] rounded-full border border-white/20 px-5 py-2.5 text-sm text-white touch-manipulation hover:bg-white/5"
            >
              Back
            </button>
            <button
              type="button"
              disabled={
                !currentSlotOpen || slotsLoading || birthdayPartyHold
              }
              onClick={() => setStep(4)}
              className="min-h-[48px] flex-1 rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] px-6 py-2.5 text-sm font-semibold text-[#0b0b12] touch-manipulation disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
            Confirm your booking
          </h2>
          {sessionUser ? (
            <p className="rounded-lg border border-[var(--ga-cyan)]/30 bg-[var(--ga-cyan)]/10 px-4 py-3 text-sm text-zinc-300">
              Use the same phone as on your account (
              <span className="font-mono text-zinc-400">{sessionUser.phone}</span>
              ) so we link this booking and can reach you on WhatsApp.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-400">
              Your booking reference is sent to the{" "}
              <strong className="font-medium text-zinc-300">email</strong> and{" "}
              <strong className="font-medium text-zinc-300">phone</strong> you
              enter below — keep them accurate on mobile.
            </p>
          )}
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-sm font-medium text-zinc-200">
              Send confirmation
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Toggle off if you don&apos;t want that channel. Email needs a valid
              address; SMS uses your phone in international format (e.g. +91…).
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="mt-0.5 size-4 rounded border-white/30 accent-[var(--ga-lava)]"
              />
              <span className="text-sm text-zinc-300">
                Email confirmation{" "}
                <span className="text-zinc-500">(requires a valid email)</span>
              </span>
            </label>
            <label className="mt-2 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="mt-0.5 size-4 rounded border-white/30 accent-[var(--ga-lava)]"
              />
              <span className="text-sm text-zinc-300">
                Text message (SMS) to your phone{" "}
                <span className="text-zinc-500">
                  (uses the number below; E.164 format)
                </span>
              </span>
            </label>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
            <input
              type="checkbox"
              checked={waiver}
              onChange={(e) => setWaiver(e.target.checked)}
              className="mt-1 size-4 rounded border-white/30 accent-[var(--ga-lava)]"
            />
            <span className="text-sm text-zinc-300">
              I accept the participation waiver & safety rules (prototype —
              legal copy TBD).
            </span>
          </label>
          <p className="text-sm text-zinc-400">
            Payment is still simulated; your booking is written to the server
            store and appears under{" "}
            <a href="/admin" className="text-[var(--ga-blue)] hover:underline">
              Admin
            </a>
            .
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-zinc-400">
              Parent / guardian name *
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[var(--ga-blue)]"
                placeholder="Full name"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              Phone *
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-base text-white outline-none focus:border-[var(--ga-blue)] sm:min-h-0 sm:py-2 sm:text-sm"
                placeholder="+91 …"
              />
            </label>
            <label className="block text-sm text-zinc-400 sm:col-span-2">
              Email {notifyEmail ? <span className="text-[var(--ga-orange)]">*</span> : null}
              <input
                type="email"
                inputMode="email"
                required={notifyEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-base text-white outline-none focus:border-[var(--ga-blue)] sm:min-h-0 sm:py-2 sm:text-sm"
                placeholder={
                  notifyEmail ? "you@example.com" : "optional if no email copy"
                }
                autoComplete="email"
              />
            </label>
          </div>
          <CouponField
            baseAmountInr={bookingSubtotal}
            onTotalsChange={setCouponTotals}
          />
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
            <p className="text-zinc-500">Summary</p>
            <p className="mt-2 font-medium text-white">{selectedGame.title}</p>
            <p className="text-zinc-400">
              {formatDate(date)} · {selectedSlot?.rangeLabel}
            </p>
            <p className="mt-1 text-zinc-500">
              {kidCount} kid{kidCount === 1 ? "" : "s"} · 15 min session ·{" "}
              {BOOKING_RULES.resetMinutes} min reset before next group
            </p>
            <div className="mt-4 space-y-1 border-t border-white/10 pt-3">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="text-white">
                  ₹{bookingSubtotal.toLocaleString("en-IN")}
                </span>
              </div>
              {couponDiscountInr > 0 ? (
                <div className="flex justify-between text-[var(--ga-blue)]">
                  <span>
                    Coupon
                    {couponTotals?.appliedCode
                      ? ` (${couponTotals.appliedCode})`
                      : ""}
                  </span>
                  <span>−₹{couponDiscountInr.toLocaleString("en-IN")}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-bold text-[var(--ga-blue)]">
                <span>Total</span>
                <span>₹{payableInr.toLocaleString("en-IN")} est.</span>
              </div>
            </div>
          </div>
          {submitError ? (
            <p className="text-sm text-[var(--ga-lava)]">{submitError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={submitting}
              className="min-h-[48px] rounded-full border border-white/20 px-5 py-2.5 text-sm text-white touch-manipulation hover:bg-white/5 disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              disabled={
                !waiver ||
                !customerName.trim() ||
                !phone.trim() ||
                (notifyEmail && !email.trim()) ||
                submitting
              }
              onClick={async () => {
                setSubmitError(null);
                if (
                  slotsLoading ||
                  birthdayPartyHold ||
                  !currentSlotOpen
                ) {
                  setSubmitError(
                    "This slot is not available. Go back to date & time and pick another.",
                  );
                  return;
                }
                setSubmitting(true);
                try {
                  const r = await fetch("/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      gameSlug: gameId,
                      date: dateStr,
                      slotKey,
                      kidCount,
                      couponCode: couponTotals?.appliedCode ?? null,
                      customerName: customerName.trim(),
                      phone: phone.trim(),
                      email: email.trim(),
                      notifyEmail,
                      notifySms,
                    }),
                  });
                  const j = await r.json().catch(() => ({}));
                  if (!r.ok) {
                    throw new Error(
                      (j as { error?: string }).error ?? "Booking failed",
                    );
                  }
                  const ref = (j as { booking?: { reference?: string } }).booking
                    ?.reference;
                  setConfirmedRef(ref ?? null);
                  const n = (j as { notifications?: BookingNotifications })
                    .notifications;
                  setNotifyStatus(
                    n && typeof n.emailSent === "boolean" && typeof n.smsSent === "boolean"
                      ? n
                      : null,
                  );
                  setDone(true);
                } catch (e) {
                  setSubmitError(
                    e instanceof Error ? e.message : "Something went wrong",
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
              className="min-h-[48px] flex-1 rounded-full bg-[var(--ga-blue)] px-6 py-3 text-sm font-semibold text-[#0b0b12] touch-manipulation hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:py-2.5"
            >
              {submitting ? "Saving…" : "Confirm booking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
