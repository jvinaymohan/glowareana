"use client";

import { useCallback, useEffect, useState } from "react";
import { loadRazorpayCheckoutScript } from "@/lib/razorpay-client";

type Customer = { id: string; email: string; name: string | null };
type Reservation = {
  id: string;
  reference: string;
  startAt: string;
  endAt: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  balanceAmount: number;
  invoiceRef: string | null;
};

/** Online checkout (Razorpay). Set NEXT_PUBLIC_RAZORPAY_ENABLED=1 after server keys are configured. */
const RAZORPAY_UI_ENABLED = process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === "1";
const RAZORPAY_CHECKOUT_NAME = process.env.NEXT_PUBLIC_RAZORPAY_DISPLAY_NAME?.trim() || "Glow Arena";

type LoyaltyPayload = {
  loyalty: {
    punchesOnCard: number;
    punchesToNextReward: number;
    lifetimeCheckouts: number;
    tier: string;
    tierLabel: string;
    totalRewardsEarned: number;
    benefits: string[];
    rewards: Array<{
      couponCode: string;
      discountType: string;
      discountValue: number;
      redeemed: boolean;
    }>;
  };
  gamification: { punchCardSlots: number; message: string };
};

export default function PlatformCustomerPage() {
  const [user, setUser] = useState<Customer | null>(null);
  const [email, setEmail] = useState("customer@glowarena.local");
  const [password, setPassword] = useState("Password123!");
  const [rows, setRows] = useState<Reservation[]>([]);
  const [reservationId, setReservationId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [storeId, setStoreId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [availability, setAvailability] = useState({} as Record<string, unknown[]>);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [participants, setParticipants] = useState(2);
  const [ageRange, setAgeRange] = useState("8-12");
  const [safetyConsent, setSafetyConsent] = useState(false);
  const [waiverConsent, setWaiverConsent] = useState(false);
  const [createdRef, setCreatedRef] = useState<string | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyPayload | null>(null);
  const [payOrderHint, setPayOrderHint] = useState<string | null>(null);

  async function me() {
    const r = await fetch("/api/v2/customer/auth/me", { credentials: "include" });
    if (!r.ok) return;
    const j = (await r.json()) as { user: Customer };
    setUser(j.user);
  }

  async function login() {
    setError(null);
    const r = await fetch("/api/v2/customer/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setError(j.error ?? "Login failed");
    await me();
    await loadReservations();
    await loadLoyalty();
  }

  const [reservationTotal, setReservationTotal] = useState<number | null>(null);

  async function loadReservations() {
    const r = await fetch("/api/v2/customer/reservations?limit=50", { credentials: "include" });
    const j = (await r.json().catch(() => ({}))) as {
      reservations?: Reservation[];
      total?: number;
      hasMore?: boolean;
      error?: string;
    };
    if (!r.ok) return setError(j.error ?? "Failed");
    setRows(j.reservations ?? []);
    setReservationTotal(typeof j.total === "number" ? j.total : null);
  }

  async function loadDemoStore() {
    const r = await fetch("/api/v2/public/stores");
    const j = (await r.json().catch(() => ({}))) as {
      stores?: Array<{ id: string; code: string }>;
    };
    const kora = j.stores?.find((s) => s.code === "KORA") ?? j.stores?.[0];
    if (kora) setStoreId(kora.id);
  }

  async function createRazorpayOrderForRow(reservationId: string) {
    setError(null);
    setPayOrderHint(null);
    const r = await fetch("/api/v2/customer/payments/razorpay/order", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });
    const j = (await r.json().catch(() => ({}))) as {
      error?: string;
      orderId?: string;
      keyId?: string;
      amountPaise?: number;
      currency?: string;
    };
    if (!r.ok) return setError(j.error ?? "Could not create payment order");
    if (!j.orderId || !j.keyId || typeof j.amountPaise !== "number") {
      return setError("Invalid order response from server");
    }

    try {
      await loadRazorpayCheckoutScript();
    } catch {
      return setError("Could not load Razorpay Checkout. Check your network or ad blockers.");
    }

    const RazorpayCtor = window.Razorpay;
    if (!RazorpayCtor) {
      return setError("Razorpay Checkout is unavailable.");
    }

    const rzp = new RazorpayCtor({
      key: j.keyId,
      amount: j.amountPaise,
      currency: j.currency ?? "INR",
      order_id: j.orderId,
      name: RAZORPAY_CHECKOUT_NAME,
      description: "Arena booking payment",
      notes: {
        reservationId,
      },
      prefill: {
        name: user?.name ?? undefined,
        email: user?.email ?? undefined,
      },
      theme: { color: "#6366f1" },
      handler() {
        setPayOrderHint(
          "Payment completed in Razorpay. Your booking updates when our server receives the confirmation (usually within seconds). Click “Load my reservations” to refresh.",
        );
        void loadReservations();
      },
      modal: {
        ondismiss() {
          setPayOrderHint("Checkout closed. You can try again when ready.");
        },
      },
    });

    rzp.on("payment.failed", (failResponse) => {
      const msg = failResponse.error?.description ?? "Payment failed";
      setError(msg);
    });

    rzp.open();
  }

  const loadLoyalty = useCallback(async () => {
    if (!storeId) return;
    const r = await fetch(`/api/v2/customer/loyalty?storeId=${encodeURIComponent(storeId)}`, {
      credentials: "include",
    });
    if (!r.ok) {
      setLoyalty(null);
      return;
    }
    const j = (await r.json()) as LoyaltyPayload;
    setLoyalty(j);
  }, [storeId]);

  async function loadAvailability() {
    const q = new URLSearchParams({ storeId, date });
    const r = await fetch(`/api/v2/public/availability?${q.toString()}`);
    const j = (await r.json().catch(() => ({}))) as { games?: Record<string, unknown[]>; error?: string };
    if (!r.ok) return setError(j.error ?? "Failed to load availability");
    setAvailability(j.games ?? {});
    const firstGame = Object.keys(j.games ?? {})[0] ?? "";
    setSelectedGame(firstGame);
    const firstSlot = (j.games?.[firstGame]?.[0] as { gameSlotId?: string } | undefined)?.gameSlotId ?? "";
    setSelectedSlot(firstSlot);
    setError(null);
  }

  async function createBooking() {
    if (!selectedSlot) return setError("Select an available slot");
    if (!safetyConsent || !waiverConsent) {
      return setError("Accept safety and waiver consent before payment.");
    }
    const gameSlots = (availability[selectedGame] ?? []) as Array<{
      gameSlotId: string;
      basePrice: number;
      startsAt: string;
      durationMin?: number;
    }>;
    const slot = gameSlots.find((s) => s.gameSlotId === selectedSlot);
    const subtotalAmount = (slot?.basePrice ?? 500) * participants;
    const slotStart = slot?.startsAt ? new Date(slot.startsAt) : new Date();
    const durMin = slot?.durationMin ?? 30;
    const startsAt = slotStart.toISOString();
    const endsAt = new Date(slotStart.getTime() + durMin * 60 * 1000).toISOString();
    const r = await fetch("/api/v2/customer/reservations", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        gameSlotId: selectedSlot,
        customerName: user?.name ?? "Customer",
        startsAt,
        endsAt,
        participantCount: participants,
        adults: Math.max(1, participants - 1),
        children: 1,
        ageRange,
        safetyConsent,
        waiverConsent,
        subtotalAmount,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { reservation?: { reference?: string }; error?: string };
    if (!r.ok) return setError(j.error ?? "Booking failed");
    setCreatedRef(j.reservation?.reference ?? null);
    setError(null);
    await loadReservations();
    await loadLoyalty();
  }

  async function reschedule() {
    if (!reservationId) return;
    const r = await fetch(`/api/v2/customer/reservations/${reservationId}/reschedule`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt, endsAt }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setError(j.error ?? "Reschedule failed");
    setError(null);
    await loadReservations();
    await loadLoyalty();
  }

  useEffect(() => {
    void loadDemoStore();
  }, []);

  useEffect(() => {
    void me();
  }, []);

  useEffect(() => {
    if (user && storeId) void loadLoyalty();
  }, [user, storeId, loadLoyalty]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-white">
      <h1 className="text-2xl font-bold">Customer Portal POC</h1>
      <p className="mt-2 text-sm text-zinc-400">Demo workflows: own reservations, payment status view, and self-reschedule.</p>

      {!user ? (
        <div className="mt-6 grid gap-3 rounded-xl border border-white/10 p-4">
          <input className="rounded bg-black/40 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
          <input className="rounded bg-black/40 px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
          <button className="rounded bg-blue-500 px-3 py-2" onClick={() => void login()}>Login</button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-white/10 p-4 text-sm">
            Signed in as <strong>{user.email}</strong>
          </div>
          {loyalty ? (
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-violet-950/30 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-amber-100">Glow Rewards</h2>
                  <p className="mt-1 text-xs text-amber-200/80">{loyalty.gamification.message}</p>
                  <p className="mt-2 text-sm text-white">
                    Tier: <span className="font-semibold text-amber-300">{loyalty.loyalty.tierLabel}</span>
                    <span className="text-zinc-400"> · {loyalty.loyalty.lifetimeCheckouts} completed visits</span>
                  </p>
                </div>
                <span className="rounded-full bg-black/30 px-3 py-1 text-xs text-amber-200">
                  {loyalty.loyalty.punchesToNextReward} punches to next coupon
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Punch card">
                {Array.from({ length: loyalty.gamification.punchCardSlots }, (_, i) => (
                  <span
                    key={i}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                      i < loyalty.loyalty.punchesOnCard
                        ? "border-amber-400 bg-amber-500/30 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                        : "border-white/20 bg-black/20 text-zinc-600"
                    }`}
                  >
                    {i < loyalty.loyalty.punchesOnCard ? "✓" : i + 1}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-1 text-xs text-zinc-400">
                {loyalty.loyalty.benefits.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              {loyalty.loyalty.rewards.length > 0 ? (
                <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
                  <p className="text-xs font-semibold uppercase text-zinc-500">Your coupons</p>
                  <ul className="mt-2 space-y-1 font-mono text-sm">
                    {loyalty.loyalty.rewards.map((rw) => (
                      <li key={rw.couponCode} className="flex flex-wrap justify-between gap-2 text-cyan-200">
                        <span>{rw.couponCode}</span>
                        <span className="text-zinc-500">
                          {rw.discountType === "PERCENT" ? `${rw.discountValue}%` : `₹${rw.discountValue}`}
                          {rw.redeemed ? " · used" : " · apply at checkout"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : storeId ? (
            <p className="text-xs text-zinc-500">Set store above to load loyalty punch card.</p>
          ) : null}
          <div className="grid gap-3 rounded-xl border border-white/10 p-4">
            <h2 className="text-lg font-semibold">Date-first booking</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <input className="rounded bg-black/40 px-3 py-2" value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="storeId" />
              <input className="rounded bg-black/40 px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <button className="rounded bg-indigo-500 px-3 py-2" onClick={() => void loadAvailability()}>Load games by date</button>
            </div>
            {Object.keys(availability).length > 0 ? (
              <div className="grid gap-2">
                <select className="rounded bg-black/40 px-3 py-2" value={selectedGame} onChange={(e) => {
                  const g = e.target.value;
                  setSelectedGame(g);
                  const first = ((availability[g] ?? [])[0] as { gameSlotId?: string } | undefined)?.gameSlotId ?? "";
                  setSelectedSlot(first);
                }}>
                  {Object.keys(availability).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className="rounded bg-black/40 px-3 py-2" value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
                  {((availability[selectedGame] ?? []) as Array<{ gameSlotId: string; time: string; availableSlots: number; basePrice: number }>).map((s) => (
                    <option key={s.gameSlotId} value={s.gameSlotId}>
                      {s.time} · {s.availableSlots} slots · ₹{s.basePrice}
                    </option>
                  ))}
                </select>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className="rounded bg-black/40 px-3 py-2" type="number" min={1} value={participants} onChange={(e) => setParticipants(Math.max(1, Number(e.target.value || 1)))} placeholder="participants" />
                  <input className="rounded bg-black/40 px-3 py-2" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} placeholder="age range (e.g. 8-12)" />
                  <div className="rounded bg-black/20 px-3 py-2 text-sm text-zinc-300">Safety & waiver step below</div>
                </div>
                <label className="text-sm text-zinc-300"><input type="checkbox" checked={safetyConsent} onChange={(e) => setSafetyConsent(e.target.checked)} className="mr-2" />I confirm participant safety brief read.</label>
                <label className="text-sm text-zinc-300"><input type="checkbox" checked={waiverConsent} onChange={(e) => setWaiverConsent(e.target.checked)} className="mr-2" />I accept waiver and medical disclaimer for minors.</label>
                <button className="rounded bg-emerald-600 px-3 py-2" onClick={() => void createBooking()}>Create booking</button>
                <p className="text-xs text-zinc-500">Price is set on the server from the slot (client total is checked). Pay balance from the reservations table after booking.</p>
              </div>
            ) : null}
          </div>
          <button className="rounded bg-emerald-500 px-3 py-2" onClick={() => void loadReservations()}>Load my reservations</button>
          {reservationTotal != null && reservationTotal > rows.length ? (
            <p className="text-xs text-zinc-500">
              Showing {rows.length} of {reservationTotal} reservations (next page: add <code className="text-zinc-400">?offset=50</code> to API).
            </p>
          ) : null}
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-3 py-2">Ref</th>
                  <th className="px-3 py-2">Start</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Balance</th>
                  {RAZORPAY_UI_ENABLED ? <th className="px-3 py-2">Pay online</th> : null}
                  <th className="px-3 py-2">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="px-3 py-2">{r.reference}</td>
                    <td className="px-3 py-2">{new Date(r.startAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.paymentStatus}</td>
                    <td className="px-3 py-2">₹{r.totalAmount}</td>
                    <td className="px-3 py-2">₹{r.balanceAmount}</td>
                    {RAZORPAY_UI_ENABLED ? (
                      <td className="px-3 py-2">
                        {r.balanceAmount > 0 && r.status !== "CANCELLED" ? (
                          <button
                            type="button"
                            className="rounded bg-violet-600 px-2 py-1 text-xs"
                            onClick={() => void createRazorpayOrderForRow(r.id)}
                          >
                            Pay with Razorpay
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                    <td className="px-3 py-2">{r.invoiceRef ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payOrderHint ? (
            <div className="rounded-xl border border-violet-500/40 bg-violet-950/30 p-4 text-sm text-violet-100">
              <p className="font-semibold text-white">Payment order</p>
              <p className="mt-2 text-xs leading-relaxed">{payOrderHint}</p>
            </div>
          ) : null}
          {createdRef ? (
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4 text-sm">
              <p className="font-semibold">Post-booking pass</p>
              <p className="mt-1">Ticket ref: <strong>{createdRef}</strong></p>
              <p className="mt-1">QR check-in link:</p>
              <a className="text-cyan-300 underline" href={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(createdRef)}`} target="_blank" rel="noreferrer">Open QR</a>
              <p className="mt-2 text-zinc-300">Arrival: reach 15 minutes early, wear sports shoes, carry guardian ID for minors.</p>
            </div>
          ) : null}
          <div className="grid gap-3 rounded-xl border border-white/10 p-4">
            <input className="rounded bg-black/40 px-3 py-2" value={reservationId} onChange={(e) => setReservationId(e.target.value)} placeholder="reservationId" />
            <input className="rounded bg-black/40 px-3 py-2" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} placeholder="new startsAt ISO (e.g. 2026-04-08T10:00:00.000Z)" />
            <input className="rounded bg-black/40 px-3 py-2" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} placeholder="new endsAt ISO" />
            <button className="rounded bg-orange-500 px-3 py-2" onClick={() => void reschedule()}>Reschedule</button>
            <button className="rounded bg-rose-600 px-3 py-2" onClick={async () => {
              if (!reservationId) return;
              const r = await fetch(`/api/v2/customer/reservations/${reservationId}`, { method: "DELETE", credentials: "include" });
              const j = await r.json().catch(() => ({} as { error?: string }));
              if (!r.ok) setError((j as { error?: string }).error ?? "Cancel failed");
              else await loadReservations();
            }}>Cancel reservation</button>
          </div>
        </div>
      )}
      {error ? <p className="mt-4 text-red-400">{error}</p> : null}
    </div>
  );
}
