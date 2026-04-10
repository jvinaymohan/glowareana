"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRoleName } from "@prisma/client";
import { personaForRole } from "@/lib/platform/admin-persona";
import { ArenaStatusGrid, type ArenaDayRow } from "@/components/admin/ArenaStatusGrid";
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from "@/components/admin/SimpleCharts";

type Admin = { id: string; name: string; email: string; role: AdminRoleName; storeIds: string[] };

type StoreRow = { id: string; code: string; name: string };

type SummaryResponse = {
  kpis?: Record<string, number>;
  occupancyByDayTime?: Array<{ bucket: string; sessions: number; participants: number }>;
  revenueByBookingType?: Record<string, number>;
  occupancyTruncated?: boolean;
  error?: string;
};

type ReservationRow = {
  id: string;
  reference: string;
  startAt: string;
  endAt: string;
  status: string;
  lifecycle: string;
  participantCount: number;
  totalAmount: number;
  balanceAmount: number;
};

function StubCard({
  title,
  body,
  foot,
}: {
  title: string;
  body: string;
  foot?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">{body}</p>
      {foot ? <p className="mt-2 text-[11px] text-zinc-600">{foot}</p> : null}
    </div>
  );
}

export function PlatformAdminDashboard() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeId, setStoreId] = useState("");
  const [arenas, setArenas] = useState<ArenaDayRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [todaySessions, setTodaySessions] = useState<Array<Record<string, unknown>>>([]);
  const [reportData, setReportData] = useState<SummaryResponse | null>(null);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [resTotal, setResTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reservationId, setReservationId] = useState("");
  const [amount, setAmount] = useState(500);
  const [slotToBlock, setSlotToBlock] = useState("");

  const persona = useMemo(
    () => (admin ? personaForRole(admin.role) : null),
    [admin],
  );

  const todayRange = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, []);

  const reportRangeQs = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 14);
    const to = new Date();
    to.setDate(to.getDate() + 1);
    const q = new URLSearchParams({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
    if (storeId) q.set("storeId", storeId);
    return q.toString();
  }, [storeId]);

  const refreshMe = useCallback(async () => {
    setProfileError(null);
    const r = await fetch("/api/v2/admin/auth/me", { credentials: "include" });
    if (!r.ok) {
      setAdmin(null);
      setProfileError("Your session is no longer valid. Sign in again.");
      return;
    }
    const j = (await r.json()) as { admin: Admin };
    setAdmin(j.admin);
 }, []);

  const loadStores = useCallback(async () => {
    const r = await fetch("/api/v2/admin/stores", { credentials: "include" });
    if (!r.ok) return;
    const j = (await r.json()) as { stores: StoreRow[] };
    setStores(j.stores ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    if (!storeId || !persona) return;
    setLoading(true);
    setError(null);
    try {
      const { from, to } = todayRange;
      const qDash = new URLSearchParams({
        storeId,
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const [dashR, arenaR, sessR, resR] = await Promise.all([
        fetch(`/api/v2/admin/dashboard?${qDash}`, { credentials: "include" }),
        fetch(`/api/v2/admin/arena-day?storeId=${encodeURIComponent(storeId)}`, { credentials: "include" }),
        fetch(`/api/v2/admin/sessions/today?storeId=${encodeURIComponent(storeId)}`, { credentials: "include" }),
        fetch(
          `/api/v2/admin/reservations?${new URLSearchParams({
            storeId,
            limit: "25",
            offset: "0",
          })}`,
          { credentials: "include" },
        ),
      ]);
      const dashJ = (await dashR.json().catch(() => ({}))) as Record<string, unknown>;
      if (!dashR.ok) throw new Error(String(dashJ.error ?? "Dashboard failed"));
      setSummary(dashJ);

      const arenaJ = (await arenaR.json().catch(() => ({}))) as { arenas?: ArenaDayRow[]; error?: string };
      if (!arenaR.ok) throw new Error(arenaJ.error ?? "Arena overview failed");
      setArenas(arenaJ.arenas ?? []);

      const sessJ = (await sessR.json().catch(() => ({}))) as {
        slots?: Array<Record<string, unknown>>;
        reservations?: Array<Record<string, unknown>>;
        error?: string;
      };
      if (!sessR.ok) throw new Error(sessJ.error ?? "Sessions failed");
      const merged = (sessJ.slots ?? []).map((slot) => {
        const reservation = (sessJ.reservations ?? []).find((r) => r.gameSlotId === slot.id);
        return { ...slot, reservation };
      });
      setTodaySessions(merged);

      const resJ = (await resR.json().catch(() => ({}))) as {
        reservations?: ReservationRow[];
        total?: number;
        error?: string;
      };
      if (!resR.ok) throw new Error(resJ.error ?? "Reservations failed");
      setReservations(resJ.reservations ?? []);
      setResTotal(typeof resJ.total === "number" ? resJ.total : null);

      if (persona.chartTier !== "none") {
        const repR = await fetch(`/api/v2/admin/reports/summary?${reportRangeQs}`, {
          credentials: "include",
        });
        const repJ = (await repR.json().catch(() => ({}))) as SummaryResponse;
        if (repR.ok) setReportData(repJ);
        else setReportData(null);
      } else {
        setReportData(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [storeId, persona, todayRange, reportRangeQs]);

  useEffect(() => {
    void refreshMe();
    void loadStores();
  }, [refreshMe, loadStores]);

  useEffect(() => {
    if (!admin) return;
    setStoreId((prev) => {
      if (prev) return prev;
      if (stores.length === 1) return stores[0].id;
      const first = admin.storeIds[0];
      if (first) return first;
      return stores[0]?.id ?? "";
    });
  }, [admin, stores]);

  useEffect(() => {
    if (admin && storeId && persona) void loadAll();
  }, [admin, storeId, persona, loadAll]);

  async function checkInOut(kind: "checkin" | "checkout") {
    if (!persona?.showOperationsPanel || !reservationId) return;
    const r = await fetch(`/api/v2/admin/reservations/${reservationId}/${kind}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: `Admin ${kind}` }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setError(j.error ?? `Failed ${kind}`);
    else {
      setError(null);
      void loadAll();
    }
  }

  async function addPayment() {
    if (!persona?.showOperationsPanel || !reservationId) return;
    const r = await fetch("/api/v2/admin/payments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        amount,
        type: "CHARGE",
        status: "PAID",
        method: "cash",
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setError(j.error ?? "Payment failed");
    else {
      setError(null);
      void loadAll();
    }
  }

  async function blockSlot() {
    if (!persona?.showOperationsPanel || !slotToBlock) return;
    const r = await fetch("/api/v2/admin/gameslots/block", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlotId: slotToBlock }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setError(j.error ?? "Block failed");
    else {
      setError(null);
      void loadAll();
    }
  }

  async function walkIn() {
    if (!persona?.showWalkInPos || !storeId) return;
    const now = new Date();
    const startsAt = new Date(now.getTime() + 20 * 60 * 1000).toISOString();
    const endsAt = new Date(now.getTime() + 50 * 60 * 1000).toISOString();
    const r = await fetch("/api/v2/admin/reservations", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        customerName: "Walk-in Guest",
        startsAt,
        endsAt,
        participantCount: 2,
        adults: 1,
        children: 1,
        ageRange: "7-12",
        safetyConsent: true,
        waiverConsent: true,
        bookingChannel: "walkin",
        subtotalAmount: 1200,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setError(j.error ?? "Walk-in failed");
    else {
      setError(null);
      void loadAll();
    }
  }

  const kpiEntries = summary
    ? Object.entries(summary).filter(
        ([k]) =>
          typeof summary[k] === "number" &&
          !["recentCouponActivity", "recentPromotionActivity"].includes(k),
      )
    : [];

  const linePoints =
    reportData?.occupancyByDayTime?.slice(-14).map((o) => ({
      label: o.bucket.slice(5, 11),
      value: o.sessions,
    })) ?? [];

  const pieSlices =
    reportData?.revenueByBookingType &&
    Object.entries(reportData.revenueByBookingType)
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label, value }));

  const financeBars =
    reportData?.kpis &&
    [
      { label: "Revenue", value: reportData.kpis.revenue ?? 0, color: "#34d399" },
      { label: "Expenses", value: reportData.kpis.expenses ?? 0, color: "#f87171" },
      { label: "Gross margin", value: reportData.kpis.grossMargin ?? 0, color: "#22d3ee" },
    ].filter((x) => x.value !== 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations console</h1>
          {persona ? (
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">{persona.label} view.</span> {persona.tagline}
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Loading role profile…</p>
          )}
        </div>
        {persona?.showReportsLink ? (
          <Link
            href="/platform/admin/reports"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 outline-none ring-cyan-500/40 transition hover:bg-white/10 focus-visible:ring-2"
          >
            Reports &amp; export
          </Link>
        ) : null}
      </div>

      {profileError ? (
        <p className="mt-6 text-sm text-red-400">
          {profileError}{" "}
          <Link href="/admin/login?next=/platform/admin" className="text-cyan-300 underline">
            Admin sign in
          </Link>
        </p>
      ) : null}

      {admin && persona ? (
        <div className="mt-8 space-y-8">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-4 text-sm">
            <span className="text-zinc-400">
              Signed in as <strong className="text-zinc-200">{admin.name}</strong>
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
              {persona.label}
            </span>
          </div>

          <div className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-zinc-500 sm:col-span-2 lg:col-span-1">
              Store
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              >
                <option value="">Select store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
              <button
                type="button"
                onClick={() => void loadAll()}
                disabled={!storeId || loading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {loading ? "Refreshing…" : "Refresh data"}
              </button>
              {resTotal !== null ? (
                <span className="text-xs text-zinc-500">
                  {resTotal.toLocaleString()} reservations in range (showing {reservations.length})
                </span>
              ) : null}
            </div>
          </div>

          {persona.showExecutiveKpis && kpiEntries.length > 0 ? (
            <section aria-label="Key metrics">
              <h2 className="text-lg font-semibold text-white">Today&apos;s KPIs</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {kpiEntries.map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-xl border border-white/10 bg-black/25 p-3 outline-none focus-within:ring-2 focus-within:ring-cyan-500/30"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">{k}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-white">
                      {typeof v === "number" ? v.toLocaleString() : String(v)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {!persona.showExecutiveKpis && persona.chartTier === "limited" && kpiEntries.length > 0 ? (
            <section aria-label="Shift metrics">
              <h2 className="text-lg font-semibold text-white">Shift snapshot</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {["todayReservations", "checkedIn", "outstandingPayments"].map((key) => {
                  const v = summary?.[key];
                  if (typeof v !== "number") return null;
                  return (
                    <div key={key} className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{key}</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">{v.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {persona.showArenaGrid && arenas.length > 0 ? (
            <ArenaStatusGrid arenas={arenas} />
          ) : null}

          {persona.chartTier === "full" && reportData?.kpis ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {pieSlices && pieSlices.length > 0 ? (
                <SimplePieChart title="Revenue mix (booking type)" slices={pieSlices} />
              ) : null}
              {financeBars && financeBars.length > 0 ? (
                <SimpleBarChart title="Income vs expenses (range)" items={financeBars} />
              ) : null}
              {linePoints.length > 0 ? (
                <div className="lg:col-span-2">
                  <SimpleLineChart title="Session load by time bucket (last points)" points={linePoints} />
                  {reportData.occupancyTruncated ? (
                    <p className="mt-1 text-xs text-amber-200/90">Occupancy series truncated server-side.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {persona.chartTier === "limited" && reportData?.kpis ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pieSlices && pieSlices.length > 0 ? (
                <SimplePieChart title="Revenue mix (booking type)" slices={pieSlices} />
              ) : null}
              {linePoints.length > 0 ? (
                <SimpleLineChart title="Traffic / sessions (sample)" points={linePoints} />
              ) : null}
            </div>
          ) : null}

          {persona.showCalendarStrip && todaySessions.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-black/20 p-4" aria-label="Today schedule">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Today&apos;s schedule</h2>
                <span className="text-xs text-zinc-500">
                  Drag-and-drop calendar &amp; bulk slot edits are planned; this is a live read-only strip.
                </span>
              </div>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
                {todaySessions.map((row) => {
                  const reservation = row.reservation as
                    | { reference?: string; lifecycle?: string; status?: string }
                    | undefined;
                  const g = row.game as { name?: string } | undefined;
                  return (
                    <li
                      key={String(row.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                    >
                      <span className="text-zinc-300">
                        {g?.name ?? "Arena"} · <span className="tabular-nums">{String(row.timeLabel ?? "")}</span>
                      </span>
                      <span
                        className={
                          reservation?.lifecycle === "CHECKED_IN" || reservation?.status === "CHECKED_IN"
                            ? "text-amber-300"
                            : reservation
                              ? "text-cyan-300"
                              : String(row.status) === "BLOCKED"
                                ? "text-rose-300"
                                : "text-emerald-300"
                        }
                      >
                        {reservation
                          ? `${reservation.reference ?? ""} · ${reservation.lifecycle ?? reservation.status ?? ""}`
                          : String(row.status)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {persona.showBookingTable && reservations.length > 0 ? (
            <section aria-label="Bookings">
              <h2 className="text-lg font-semibold">Recent bookings</h2>
              <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-white/10 bg-black/40 text-[10px] uppercase text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Reference</th>
                      <th className="px-3 py-2">Start</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Lifecycle</th>
                      <th className="px-3 py-2 text-right">Pax</th>
                      <th className="px-3 py-2 text-right">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-3 py-2 font-mono text-zinc-200">{r.reference}</td>
                        <td className="px-3 py-2 tabular-nums text-zinc-400">
                          {new Date(r.startAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2">{r.status}</td>
                        <td className="px-3 py-2">{r.lifecycle}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.participantCount}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.balanceAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {(persona.showApprovalsStub ||
            persona.showStaffSchedulingStub ||
            persona.showSupportTicketsStub ||
            persona.showIncidentLogStub ||
            persona.showEmployeeClockStub) ? (
            <section className="grid gap-3 md:grid-cols-2" aria-label="Roadmap modules">
              {persona.showApprovalsStub ? (
                <StubCard
                  title="Approvals"
                  body="Pricing plans, deep discounts, corporate holds, and refund thresholds can route through Owner / Manager approval. Wire forms to audit log + notifications."
                  foot="RBAC: Owner, Manager"
                />
              ) : null}
              {persona.showStaffSchedulingStub ? (
                <StubCard
                  title="Staff scheduling"
                  body="Weekly grid: assign Floor, Cash/POS, and Support to arenas and shifts. Overtime and coverage alerts hook into attendance data."
                  foot="RBAC: Owner, Manager"
                />
              ) : null}
              {persona.showSupportTicketsStub ? (
                <StubCard
                  title="Support tickets"
                  body="Create tickets, link to reservations or arenas, track SLA and resolution. Export ticket history with bookings."
                  foot="RBAC: Support, Owner, Manager"
                />
              ) : null}
              {persona.showIncidentLogStub ? (
                <StubCard
                  title="Incident log"
                  body="Log safety or equipment issues against a booking or arena block. Feeds risk reporting and maintenance."
                  foot="RBAC: Floor, Owner, Manager"
                />
              ) : null}
              {persona.showEmployeeClockStub ? (
                <StubCard
                  title="Time clock"
                  body="Clock in/out tied to the signed-in admin user and store. Hours roll up to payroll exports."
                  foot="RBAC: Employee"
                />
              ) : null}
            </section>
          ) : null}

          {persona.showOperationsPanel ? (
            <section className="grid gap-4 lg:grid-cols-2" aria-label="Floor actions">
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-semibold text-zinc-200">Check-in / payments</h3>
                <label className="mt-3 block text-xs text-zinc-500">
                  Reservation ID
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                    value={reservationId}
                    onChange={(e) => setReservationId(e.target.value)}
                    placeholder="cuid…"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void checkInOut("checkin")}
                    className="rounded-lg bg-cyan-600 px-3 py-2 text-sm"
                  >
                    Check in
                  </button>
                  <button
                    type="button"
                    onClick={() => void checkInOut("checkout")}
                    className="rounded-lg bg-orange-700 px-3 py-2 text-sm"
                  >
                    Check out
                  </button>
                </div>
                <label className="mt-3 block text-xs text-zinc-500">
                  Payment amount
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value || 0))}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void addPayment()}
                  className="mt-3 rounded-lg bg-pink-700 px-3 py-2 text-sm"
                >
                  Record payment
                </button>
              </div>
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="text-sm font-semibold text-zinc-200">Slot controls</h3>
                <label className="mt-3 block text-xs text-zinc-500">
                  Game slot ID to block
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm"
                    value={slotToBlock}
                    onChange={(e) => setSlotToBlock(e.target.value)}
                    placeholder="gameSlot cuid"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void blockSlot()}
                  className="mt-3 rounded-lg bg-rose-700 px-3 py-2 text-sm"
                >
                  Block slot
                </button>
                {persona.showWalkInPos ? (
                  <button
                    type="button"
                    onClick={() => void walkIn()}
                    className="mt-4 w-full rounded-lg bg-violet-700 px-3 py-2 text-sm"
                  >
                    Create walk-in reservation
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {persona.id === "employee" ? (
            <p className="text-xs text-zinc-500">
              Editing bookings and payments is disabled for the Employee persona in this build. Arena grid and
              schedule are read-only for situational awareness.
            </p>
          ) : null}
        </div>
      ) : !profileError ? (
        <p className="mt-8 text-sm text-zinc-500">Loading profile…</p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
