"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateDaySlots } from "@/lib/booking";
import { games, site } from "@/lib/site";

const LS_KEY = "glowArenaAdminSecret";

type BookingRow = {
  id: string;
  reference: string;
  date: string;
  gameTitle: string;
  gameSlug: string;
  slotLabel: string;
  kidCount: number;
  payableInr: number;
  customerName: string;
  phone: string;
  email: string;
  createdAt: string;
};

type BlockRow = {
  id: string;
  date: string;
  gameSlug: string;
  slotKey: string;
  note: string;
  createdAt: string;
};

type BirthdayRow = {
  id: string;
  reference: string;
  createdAt: string;
  kidCount: number;
  comboSize: number;
  gameTitles: string[];
  returnGifts: boolean;
  blocksPublicSlots: boolean;
  estimatedTotalInr: number;
  customerName: string;
  phone: string;
  email: string;
  preferredDate: string;
  notes: string;
};

function money(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  const f = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: f(from), to: f(to) };
}

export function AdminDashboard() {
  const [secret, setSecret] = useState("");
  const [range, setRange] = useState(defaultRange);
  const [statsFrom, setStatsFrom] = useState(defaultRange().from);
  const [statsTo, setStatsTo] = useState(defaultRange().to);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayRow[]>([]);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    bookingCount: number;
    totalKids: number;
    byDay: Record<string, { revenue: number; bookings: number; kids: number }>;
    byGame: Record<string, { revenue: number; bookings: number; kids: number }>;
  } | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [blockDate, setBlockDate] = useState(defaultRange().to);
  const [blockGame, setBlockGame] = useState(games[0].slug);
  const [blockSlot, setBlockSlot] = useState(generateDaySlots()[0]?.key ?? "10:00");
  const [blockNote, setBlockNote] = useState("");

  const [upcomingOnly, setUpcomingOnly] = useState(false);

  const headers = useCallback((): HeadersInit => {
    const h: HeadersInit = {};
    if (secret.trim()) h["x-admin-secret"] = secret.trim();
    return h;
  }, [secret]);

  const refresh = useCallback(async () => {
    setLoadError(null);
    setBusy(true);
    try {
      const [bRes, blRes, sRes, bpRes] = await Promise.all([
        fetch(
          `/api/bookings?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
          { headers: headers() },
        ),
        fetch(
          `/api/blocks?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
          { headers: headers() },
        ),
        fetch(
          `/api/admin/stats?from=${encodeURIComponent(statsFrom)}&to=${encodeURIComponent(statsTo)}`,
          { headers: headers() },
        ),
        fetch(
          `/api/birthday-requests?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
          { headers: headers() },
        ),
      ]);
      if (!bRes.ok) {
        const j = await bRes.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? bRes.statusText);
      }
      if (!blRes.ok) {
        const j = await blRes.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? blRes.statusText);
      }
      if (!sRes.ok) {
        const j = await sRes.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? sRes.statusText);
      }
      if (!bpRes.ok) {
        const j = await bpRes.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? bpRes.statusText);
      }
      const bJson = (await bRes.json()) as { bookings: BookingRow[] };
      const blJson = (await blRes.json()) as { blocks: BlockRow[] };
      const sJson = (await sRes.json()) as {
        totalRevenue: number;
        bookingCount: number;
        totalKids: number;
        byDay: Record<string, { revenue: number; bookings: number; kids: number }>;
        byGame: Record<string, { revenue: number; bookings: number; kids: number }>;
      };
      const bpJson = (await bpRes.json()) as { requests: BirthdayRow[] };
      setBookings(bJson.bookings);
      setBlocks(blJson.blocks);
      setBirthdays(bpJson.requests);
      setStats({
        totalRevenue: sJson.totalRevenue,
        bookingCount: sJson.bookingCount,
        totalKids: sJson.totalKids,
        byDay: sJson.byDay,
        byGame: sJson.byGame,
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setBusy(false);
    }
  }, [headers, range.from, range.to, statsFrom, statsTo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const s = localStorage.getItem(LS_KEY);
    if (s) setSecret(s);
  }, []);

  function saveSecret() {
    localStorage.setItem(LS_KEY, secret.trim());
  }

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({
          date: blockDate,
          gameSlug: blockGame,
          slotKey: blockSlot,
          note: blockNote,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Failed");
      setBlockNote("");
      await refresh();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Block failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleBirthdayVenueHold(id: string, next: boolean) {
    setBusy(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/birthday-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ id, blocksPublicSlots: next }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Failed");
      await refresh();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteBlock(id: string) {
    if (!confirm("Remove this block?")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/blocks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Failed");
      }
      await refresh();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const cols = [
      "reference",
      "date",
      "gameTitle",
      "slotLabel",
      "kidCount",
      "payableInr",
      "customerName",
      "phone",
      "email",
      "createdAt",
    ] as const;
    const rows = filteredBookings.map((b) =>
      cols.map((c) => `"${String(b[c]).replace(/"/g, '""')}"`).join(","),
    );
    const csv = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `glow-arena-bookings-${range.from}-${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const filteredBookings = useMemo(() => {
    if (!upcomingOnly) return bookings;
    const t = new Date();
    const ymd = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    return bookings.filter((b) => b.date >= ymd);
  }, [bookings, upcomingOnly]);

  const dayRows = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }, [stats]);

  const gameRows = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byGame).map(([slug, v]) => {
      const title = games.find((g) => g.slug === slug)?.title ?? slug;
      return { slug, title, ...v };
    });
  }, [stats]);

  const daySlots = generateDaySlots();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            {site.name} admin
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Bookings, blocks, revenue & people — local JSON store (
            <code className="text-zinc-400">data/arena-store.json</code>).
          </p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          disabled={busy}
          className="rounded-full border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-50"
        >
          {busy ? "Loading…" : "Refresh data"}
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
        <h2 className="text-sm font-semibold text-white">Admin access</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Set <code className="text-zinc-400">ADMIN_SECRET</code> in{" "}
          <code className="text-zinc-400">.env.local</code> to lock APIs. Leave
          unset for open local dev.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="ADMIN_SECRET value"
            className="w-full max-w-md rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--ga-blue)] sm:flex-1"
          />
          <button
            type="button"
            onClick={saveSecret}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            Save in browser
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="mt-4 rounded-lg border border-[var(--ga-lava)]/40 bg-[var(--ga-lava)]/10 px-4 py-3 text-sm text-[var(--ga-lava)]">
          {loadError}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Revenue (range)
          </p>
          <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-[var(--ga-orange)]">
            {stats ? money(stats.totalRevenue) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Bookings
          </p>
          <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
            {stats?.bookingCount ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            People (kids booked)
          </p>
          <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-[var(--ga-blue)]">
            {stats?.totalKids ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            Revenue by day
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Stats range (can differ from table filter below).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="date"
              value={statsFrom}
              onChange={(e) => setStatsFrom(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
            />
            <span className="text-zinc-500">to</span>
            <input
              type="date"
              value={statsTo}
              onChange={(e) => setStatsTo(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
            />
          </div>
          <div className="mt-4 max-h-56 overflow-auto text-sm">
            <table className="w-full text-left text-zinc-300">
              <thead className="sticky top-0 bg-[#141420] text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Revenue</th>
                  <th className="py-2 pr-2">Bookings</th>
                  <th className="py-2">Kids</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-zinc-600">
                      No data in range
                    </td>
                  </tr>
                ) : (
                  dayRows.map((row) => (
                    <tr key={row.date} className="border-t border-white/5">
                      <td className="py-2 pr-2 text-white">{row.date}</td>
                      <td className="py-2 pr-2">{money(row.revenue)}</td>
                      <td className="py-2 pr-2">{row.bookings}</td>
                      <td className="py-2">{row.kids}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            Revenue & people by game
          </h2>
          <div className="mt-4 max-h-72 overflow-auto text-sm">
            <table className="w-full text-left text-zinc-300">
              <thead className="sticky top-0 bg-[#141420] text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-2">Game</th>
                  <th className="py-2 pr-2">Revenue</th>
                  <th className="py-2 pr-2">Bookings</th>
                  <th className="py-2">Kids</th>
                </tr>
              </thead>
              <tbody>
                {gameRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-zinc-600">
                      No data
                    </td>
                  </tr>
                ) : (
                  gameRows.map((row) => (
                    <tr key={row.slug} className="border-t border-white/5">
                      <td className="py-2 pr-2 text-white">{row.title}</td>
                      <td className="py-2 pr-2">{money(row.revenue)}</td>
                      <td className="py-2 pr-2">{row.bookings}</td>
                      <td className="py-2">{row.kids}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
          Block a slot
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Blocked slots cannot be booked. Removes mock “full” behaviour — uses
          real store.
        </p>
        <form
          onSubmit={addBlock}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <label className="text-xs text-zinc-400">
            Date
            <input
              type="date"
              required
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="mt-1 block rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-zinc-400">
            Game
            <select
              value={blockGame}
              onChange={(e) => setBlockGame(e.target.value)}
              className="mt-1 block min-w-[200px] rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            >
              {games.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-400">
            Start slot
            <select
              value={blockSlot}
              onChange={(e) => setBlockSlot(e.target.value)}
              className="mt-1 block min-w-[220px] rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            >
              {daySlots.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.rangeLabel}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 text-xs text-zinc-400 sm:min-w-[200px]">
            Note
            <input
              value={blockNote}
              onChange={(e) => setBlockNote(e.target.value)}
              placeholder="Maintenance / party hold"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[var(--ga-lava)] px-5 py-2 text-sm font-semibold text-[#0b0b12] disabled:opacity-50"
          >
            Block slot
          </button>
        </form>

        <div className="mt-6 max-h-48 overflow-auto text-sm">
          <h3 className="text-xs font-semibold uppercase text-zinc-500">
            Active blocks (filtered range)
          </h3>
          <ul className="mt-2 space-y-2">
            {blocks.length === 0 ? (
              <li className="text-zinc-600">No blocks in range</li>
            ) : (
              blocks.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 text-zinc-300"
                >
                  <span>
                    <span className="text-white">{b.date}</span> ·{" "}
                    {games.find((g) => g.slug === b.gameSlug)?.title ?? b.gameSlug}{" "}
                    · {b.slotKey} — {b.note}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteBlock(b.id)}
                    className="text-xs text-[var(--ga-lava)] hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
          Birthday party requests
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Submitted from the birthday planner. When{" "}
          <strong className="text-zinc-300">venue hold</strong> is on, that
          preferred date blocks all public arena slot booking (birthday
          precedence). Toggle per row or turn off if the date was tentative.
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          <span className="text-zinc-200 font-medium">{birthdays.length}</span>{" "}
          in range · pipeline{" "}
          <span className="text-[var(--ga-orange)] font-semibold">
            {money(birthdays.reduce((s, r) => s + r.estimatedTotalInr, 0))}
          </span>{" "}
          indicative
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-white/10 text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Ref</th>
                <th className="py-2 pr-2">Submitted</th>
                <th className="py-2 pr-2">Party date</th>
                <th className="py-2 pr-2">Kids</th>
                <th className="py-2 pr-2">Combo</th>
                <th className="py-2 pr-2">Games</th>
                <th className="py-2 pr-2">Gifts</th>
                <th className="py-2 pr-2">Venue hold</th>
                <th className="py-2 pr-2">Estimate</th>
                <th className="py-2 pr-2">Contact</th>
                <th className="py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {birthdays.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-zinc-600">
                    No birthday requests in range
                  </td>
                </tr>
              ) : (
                birthdays.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-2 pr-2 font-mono text-[var(--ga-blue)]">
                      {r.reference}
                    </td>
                    <td className="py-2 pr-2 text-zinc-500">
                      {r.createdAt.slice(0, 10)}
                    </td>
                    <td className="py-2 pr-2 text-white">
                      {r.preferredDate || "—"}
                    </td>
                    <td className="py-2 pr-2">{r.kidCount}</td>
                    <td className="py-2 pr-2">{r.comboSize} games</td>
                    <td className="max-w-[200px] truncate py-2 pr-2" title={r.gameTitles.join(", ")}>
                      {r.gameTitles.join(", ")}
                    </td>
                    <td className="py-2 pr-2">{r.returnGifts ? "Yes" : "No"}</td>
                    <td className="py-2 pr-2">
                      <span
                        className={
                          (r.blocksPublicSlots ?? false)
                            ? "text-[var(--ga-orange)]"
                            : "text-zinc-500"
                        }
                      >
                        {r.blocksPublicSlots ?? false ? "On" : "Off"}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          toggleBirthdayVenueHold(r.id, !(r.blocksPublicSlots ?? false))
                        }
                        className="ml-2 text-[10px] uppercase tracking-wide text-[var(--ga-blue)] hover:underline disabled:opacity-40"
                      >
                        Toggle
                      </button>
                    </td>
                    <td className="py-2 pr-2">{money(r.estimatedTotalInr)}</td>
                    <td className="py-2 pr-2">{r.customerName}</td>
                    <td className="py-2">{r.phone}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
              All bookings & people
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Filter list export; adjust range then Refresh.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={upcomingOnly}
                onChange={(e) => setUpcomingOnly(e.target.checked)}
                className="accent-[var(--ga-lava)]"
              />
              Upcoming only (today onwards)
            </label>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredBookings.length === 0}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/5 disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
          />
          <span className="text-zinc-500">to</span>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-white/10 text-zinc-500">
              <tr>
                <th className="py-2 pr-2">Ref</th>
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Game</th>
                <th className="py-2 pr-2">Slot</th>
                <th className="py-2 pr-2">Kids</th>
                <th className="py-2 pr-2">Paid</th>
                <th className="py-2 pr-2">Contact</th>
                <th className="py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-600">
                    No bookings in range
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="border-b border-white/5">
                    <td className="py-2 pr-2 font-mono text-[var(--ga-blue)]">
                      {b.reference}
                    </td>
                    <td className="py-2 pr-2 text-white">{b.date}</td>
                    <td className="py-2 pr-2">{b.gameTitle}</td>
                    <td className="py-2 pr-2">{b.slotLabel}</td>
                    <td className="py-2 pr-2">{b.kidCount}</td>
                    <td className="py-2 pr-2">{money(b.payableInr)}</td>
                    <td className="py-2 pr-2">{b.customerName}</td>
                    <td className="py-2">{b.phone}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
