"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRoleName } from "@prisma/client";
import { canBulkBlockSlots, canCalendarDrag } from "@/lib/platform/admin-capabilities";

type Admin = { id: string; name: string; email: string; role: AdminRoleName; storeIds: string[] };
type StoreRow = { id: string; code: string; name: string };
type SlotRow = {
  id: string;
  status: string;
  timeLabel: string;
  date: string;
  game: { id: string; name: string; durationMin: number };
};
type ResRow = {
  id: string;
  reference: string;
  gameSlotId: string | null;
  startAt: string;
  status: string;
  lifecycle: string;
  participantCount: number;
  reservationUsers: Array<{ name: string }>;
};

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function AdminCalendarPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeId, setStoreId] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [reservations, setReservations] = useState<ResRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  const [dragReservationId, setDragReservationId] = useState<string | null>(null);

  const canDrag = admin ? canCalendarDrag(admin.role) : false;
  const canBlock = admin ? canBulkBlockSlots(admin.role) : false;

  const weekEnd = useMemo(() => {
    const t = new Date(weekStart);
    t.setDate(t.getDate() + 6);
    t.setHours(23, 59, 59, 999);
    return t;
  }, [weekStart]);

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, [weekStart]);

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const from = weekStart.toISOString().slice(0, 10);
      const to = weekEnd.toISOString().slice(0, 10);
      const q = new URLSearchParams({ storeId, from, to });
      const r = await fetch(`/api/v2/admin/calendar?${q}`, { credentials: "include" });
      const j = (await r.json().catch(() => ({}))) as {
        slots?: SlotRow[];
        reservations?: ResRow[];
        error?: string;
      };
      if (!r.ok) throw new Error(j.error ?? "Failed to load calendar");
      setSlots(j.slots ?? []);
      setReservations(j.reservations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [storeId, weekStart, weekEnd]);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/v2/admin/auth/me", { credentials: "include" });
      if (r.ok) {
        const j = (await r.json()) as { admin: Admin };
        setAdmin(j.admin);
      }
      const s = await fetch("/api/v2/admin/stores", { credentials: "include" });
      if (s.ok) {
        const sj = (await s.json()) as { stores: StoreRow[] };
        setStores(sj.stores ?? []);
      }
    })();
  }, []);

  useEffect(() => {
    if (admin && stores.length && !storeId) {
      const first = admin.storeIds[0] ?? stores[0]?.id;
      if (first) setStoreId(first);
    }
  }, [admin, stores, storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resBySlot = useMemo(() => {
    const m = new Map<string, ResRow>();
    for (const r of reservations) {
      if (r.gameSlotId) m.set(r.gameSlotId, r);
    }
    return m;
  }, [reservations]);

  async function onDropOnSlot(targetSlotId: string) {
    if (!canDrag || !dragReservationId) return;
    setError(null);
    const r = await fetch(`/api/v2/admin/reservations/${dragReservationId}/move-slot`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetGameSlotId: targetSlotId }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setError(j.error ?? "Move failed");
    setDragReservationId(null);
    void load();
  }

  async function bulkBlock() {
    if (!canBlock || selectedSlotIds.size === 0) return;
    setError(null);
    const r = await fetch("/api/v2/admin/gameslots/block", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlotIds: Array.from(selectedSlotIds) }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setError(j.error ?? "Block failed");
    setSelectedSlotIds(new Set());
    void load();
  }

  function toggleSelect(id: string) {
    setSelectedSlotIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Interactive calendar</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Drag a booking onto another open slot to reschedule. Select multiple slots to block in bulk.
            {!canDrag ? " Your role is view-only for moves." : null}
          </p>
        </div>
        <Link
          href="/platform/admin"
          className="text-sm text-cyan-300 underline underline-offset-2"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-black/25 p-4">
        <label className="text-xs text-zinc-500">
          Store
          <select
            className="mt-1 block rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
          >
            <option value="">Select</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-2 text-sm"
          onClick={() => {
            const n = new Date(weekStart);
            n.setDate(n.getDate() - 7);
            setWeekStart(startOfWeek(n));
          }}
        >
          Prev week
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-2 text-sm"
          onClick={() => setWeekStart(startOfWeek(new Date()))}
        >
          This week
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/15 px-3 py-2 text-sm"
          onClick={() => {
            const n = new Date(weekStart);
            n.setDate(n.getDate() + 7);
            setWeekStart(startOfWeek(n));
          }}
        >
          Next week
        </button>
        <button
          type="button"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm disabled:opacity-40"
          onClick={() => void load()}
        >
          Refresh
        </button>
        {canBlock ? (
          <button
            type="button"
            disabled={selectedSlotIds.size === 0}
            className="rounded-lg bg-rose-700 px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void bulkBlock()}
          >
            Block selected ({selectedSlotIds.size})
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-8">
        {days.map((day) => {
          const iso = day.toISOString().slice(0, 10);
          const daySlots = slots.filter((s) => s.date.slice(0, 10) === iso);
          if (daySlots.length === 0) return null;
          const byGame = new Map<string, SlotRow[]>();
          for (const s of daySlots) {
            const k = s.game.name;
            if (!byGame.has(k)) byGame.set(k, []);
            byGame.get(k)!.push(s);
          }
          return (
            <section key={iso} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-lg font-semibold">
                {day.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </h2>
              <div className="mt-3 space-y-4">
                {Array.from(byGame.entries()).map(([gameName, rows]) => (
                  <div key={gameName}>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{gameName}</p>
                    <ul className="mt-2 space-y-2">
                      {rows
                        .sort((a, b) => a.timeLabel.localeCompare(b.timeLabel))
                        .map((slot) => {
                          const res = resBySlot.get(slot.id);
                          const blocked = slot.status === "BLOCKED" || slot.status === "CLOSED";
                          return (
                            <li
                              key={slot.id}
                              className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                blocked
                                  ? "border-rose-500/40 bg-rose-950/20"
                                  : "border-white/10 bg-black/30"
                              }`}
                              onDragOver={
                                canDrag && !blocked
                                  ? (e) => {
                                      e.preventDefault();
                                    }
                                  : undefined
                              }
                              onDrop={
                                canDrag && !blocked
                                  ? (e) => {
                                      e.preventDefault();
                                      void onDropOnSlot(slot.id);
                                    }
                                  : undefined
                              }
                            >
                              {canBlock ? (
                                <input
                                  type="checkbox"
                                  className="rounded border-white/30"
                                  checked={selectedSlotIds.has(slot.id)}
                                  onChange={() => toggleSelect(slot.id)}
                                />
                              ) : null}
                              <span className="tabular-nums text-zinc-300">{slot.timeLabel}</span>
                              <span className="text-zinc-500">{slot.status}</span>
                              {res ? (
                                <span
                                  draggable={canDrag && !blocked}
                                  onDragStart={
                                    canDrag && !blocked
                                      ? () => {
                                          setDragReservationId(res.id);
                                        }
                                      : undefined
                                  }
                                  onDragEnd={() => setDragReservationId(null)}
                                  className={`rounded-full px-2 py-0.5 text-xs ${
                                    canDrag && !blocked
                                      ? "cursor-grab bg-cyan-900/50 text-cyan-200 active:cursor-grabbing"
                                      : "bg-zinc-800 text-zinc-300"
                                  }`}
                                >
                                  {res.reference} · {res.participantCount} pax · {res.lifecycle}
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-500">Open capacity</span>
                              )}
                              <span className="ml-auto font-mono text-[10px] text-zinc-600">{slot.id}</span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {loading ? <p className="mt-6 text-sm text-zinc-500">Loading…</p> : null}
    </div>
  );
}
