"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BOOKING_RULES } from "@/lib/booking";
import { formatLocalYmd } from "@/lib/date-utils";

type Row = {
  id: string;
  reference: string;
  date: string;
  gameTitle: string;
  gameSlug: string;
  slotLabel: string;
  slotKey: string;
  phone: string;
  kidCount: number;
};

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

function ReschedulePanel({
  booking,
  onDone,
}: {
  booking: Row;
  onDone: () => void;
}) {
  const [dayOffset, setDayOffset] = useState(1);
  const [availability, setAvailability] = useState<
    {
      key: string;
      rangeLabel: string;
      available: boolean;
      reason: null | "blocked" | "booked" | "birthday";
    }[]
  >([]);
  const [slotKey, setSlotKey] = useState(booking.slotKey);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dateStr = useMemo(
    () => formatLocalYmd(addDays(new Date(), dayOffset)),
    [dayOffset],
  );

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    fetch(
      `/api/bookings/availability?game=${encodeURIComponent(booking.gameSlug)}&date=${encodeURIComponent(dateStr)}`,
      { credentials: "include", signal: ac.signal },
    )
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? r.statusText);
        }
        return r.json() as Promise<{ slots: typeof availability }>;
      })
      .then((d) => {
        setAvailability(d.slots);
        const first = d.slots.find((s) => s.available);
        setSlotKey((prev) => {
          const ok = d.slots.find((s) => s.key === prev && s.available);
          if (ok) return prev;
          return first?.key ?? d.slots[0]?.key ?? prev;
        });
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setErr(e instanceof Error ? e.message : "Could not load slots");
        setAvailability([]);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [booking.gameSlug, dateStr]);

  const currentOpen = availability.find((s) => s.key === slotKey)?.available;

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: dateStr, slotKey }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((j as { error?: string }).error ?? "Could not reschedule");
      }
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-[var(--ga-cyan)]/20 bg-black/30 p-4">
      <p className="text-sm font-medium text-white">Reschedule (same game)</p>
      <p className="text-xs text-zinc-500">
        {BOOKING_RULES.sessionMinutes} min session + {BOOKING_RULES.resetMinutes}{" "}
        min reset between groups.
      </p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setDayOffset(n)}
            className={`rounded-lg border px-3 py-2 text-xs ${
              dayOffset === n
                ? "border-[var(--ga-orange)] bg-[var(--ga-orange)]/15 text-white"
                : "border-white/10 text-zinc-300"
            }`}
          >
            {formatDate(addDays(new Date(), n))}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading slots…</p>
      ) : err ? (
        <p className="text-sm text-[var(--ga-lava)]">{err}</p>
      ) : (
        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {availability.map((row) => (
            <button
              key={row.key}
              type="button"
              disabled={!row.available}
              onClick={() => row.available && setSlotKey(row.key)}
              className={`rounded-lg border py-2 text-left text-xs ${
                !row.available
                  ? "cursor-not-allowed border-white/5 text-zinc-600 line-through"
                  : slotKey === row.key
                    ? "border-[var(--ga-blue)] bg-[var(--ga-blue)]/10 text-white"
                    : "border-white/10 text-zinc-300"
              }`}
            >
              {row.rangeLabel}
            </button>
          ))}
        </div>
      )}
      {err && !loading ? null : (
        <button
          type="button"
          disabled={saving || !currentOpen || loading}
          onClick={() => void save()}
          className="rounded-full bg-[var(--ga-cyan)] px-5 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save new time"}
        </button>
      )}
    </div>
  );
}

export function AccountBookings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/my/bookings", { credentials: "include" })
      .then(async (r) => {
        if (r.status === 401) {
          setRows([]);
          throw new Error("login");
        }
        if (!r.ok) throw new Error("Failed to load bookings");
        return r.json() as Promise<{ bookings: Row[] }>;
      })
      .then((d) => {
        setRows(d.bookings);
        setError(null);
      })
      .catch((e) => {
        if (e instanceof Error && e.message === "login") {
          setError("login");
        } else {
          setError(e instanceof Error ? e.message : "Failed");
        }
      });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (error === "login") {
    return (
      <p className="rounded-xl border border-white/10 bg-[var(--ga-surface)] p-6 text-zinc-400">
        <Link href="/login" className="font-medium text-[var(--ga-cyan)] hover:underline">
          Log in
        </Link>{" "}
        to view and reschedule your reservations.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && error !== "login" ? (
        <p className="text-sm text-[var(--ga-lava)]">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={() => void refresh()}
        className="text-sm text-[var(--ga-cyan)] hover:underline"
      >
        Refresh
      </button>
      {rows.length === 0 ? (
        <p className="text-zinc-500">
          No reservations yet.{" "}
          <Link href="/book" className="text-[var(--ga-cyan)] hover:underline">
            Book now
          </Link>
          — log in first to link bookings to this account.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[var(--ga-cyan)]">{b.reference}</p>
                  <p className="mt-1 font-semibold text-white">{b.gameTitle}</p>
                  <p className="text-sm text-zinc-400">
                    {b.date} · {b.slotLabel}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {b.kidCount} kid{b.kidCount === 1 ? "" : "s"} · WhatsApp{" "}
                    <span className="font-mono text-zinc-400">{b.phone}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((x) => (x === b.id ? null : b.id))
                  }
                  className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white hover:bg-white/5"
                >
                  {expanded === b.id ? "Close" : "Reschedule"}
                </button>
              </div>
              {expanded === b.id ? (
                <ReschedulePanel
                  booking={b}
                  onDone={() => {
                    setExpanded(null);
                    void refresh();
                  }}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
