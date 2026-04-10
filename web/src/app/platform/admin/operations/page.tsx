"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AdminRoleName } from "@prisma/client";
import { canManageShifts, canResolveApprovals } from "@/lib/platform/admin-capabilities";

type Admin = { id: string; name: string; email: string; role: AdminRoleName; storeIds: string[] };
type StoreRow = { id: string; code: string; name: string };

const TABS = [
  { id: "approvals", label: "Approvals" },
  { id: "shifts", label: "Staff & shifts" },
  { id: "tickets", label: "Tickets" },
  { id: "incidents", label: "Incidents" },
  { id: "clock", label: "Time clock" },
  { id: "pos", label: "POS checkout" },
] as const;

export default function OperationsHubPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeId, setStoreId] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("approvals");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const team = useTeam(storeId);
  const approvals = useFetchList(
    storeId,
    `/api/v2/admin/approvals?storeId=${encodeURIComponent(storeId)}`,
    "approvals",
    tab === "approvals" && !!storeId,
  );
  const shifts = useFetchList(
    storeId,
    `/api/v2/admin/shifts?storeId=${encodeURIComponent(storeId)}`,
    "shifts",
    tab === "shifts" && !!storeId,
  );
  const tickets = useFetchList(
    storeId,
    `/api/v2/admin/tickets?storeId=${encodeURIComponent(storeId)}`,
    "tickets",
    tab === "tickets" && !!storeId,
  );
  const incidents = useFetchList(
    storeId,
    `/api/v2/admin/incidents?storeId=${encodeURIComponent(storeId)}`,
    "incidents",
    tab === "incidents" && !!storeId,
  );
  const clock = useFetchList(
    storeId,
    `/api/v2/admin/time-clock?storeId=${encodeURIComponent(storeId)}`,
    "entries",
    tab === "clock" && !!storeId,
    true,
  );

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
      setStoreId(admin.storeIds[0] ?? stores[0]?.id ?? "");
    }
  }, [admin, stores, storeId]);

  const refreshAll = useCallback(() => {
    approvals.refresh();
    shifts.refresh();
    tickets.refresh();
    incidents.refresh();
    clock.refresh();
    team.refresh();
  }, [approvals, shifts, tickets, incidents, clock, team]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Operations hub</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Approvals, staffing, support tickets, incidents, time clock, and itemized POS.
          </p>
        </div>
        <Link href="/platform/admin" className="text-sm text-cyan-300 underline">
          Dashboard
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
        <label className="text-xs text-zinc-500">
          Store
          <select
            className="ml-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm"
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
          onClick={() => refreshAll()}
          className="self-end rounded-lg bg-white/10 px-3 py-1.5 text-sm"
        >
          Refresh all
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-3 py-2 text-sm ${
              tab === t.id ? "bg-white/15 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg ? <p className="mt-3 text-sm text-emerald-300">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm text-red-300">{err}</p> : null}

      {!storeId ? (
        <p className="mt-6 text-sm text-zinc-500">Select a store to load operational data.</p>
      ) : null}

      <div className="mt-6">
        {tab === "approvals" && admin && storeId ? (
          <ApprovalsPanel
            storeId={storeId}
            admin={admin}
            rows={approvals.data as unknown[]}
            loading={approvals.loading}
            onRefresh={approvals.refresh}
            setMsg={setMsg}
            setErr={setErr}
          />
        ) : null}
        {tab === "shifts" && admin && storeId ? (
          <ShiftsPanel
            storeId={storeId}
            admin={admin}
            rows={shifts.data as unknown[]}
            team={team.data}
            loading={shifts.loading}
            onRefresh={() => {
              shifts.refresh();
              team.refresh();
            }}
            setMsg={setMsg}
            setErr={setErr}
          />
        ) : null}
        {tab === "tickets" && storeId ? (
          <TicketsPanel
            storeId={storeId}
            rows={tickets.data as unknown[]}
            loading={tickets.loading}
            onRefresh={tickets.refresh}
            setMsg={setMsg}
            setErr={setErr}
          />
        ) : null}
        {tab === "incidents" && storeId ? (
          <IncidentsPanel
            storeId={storeId}
            rows={incidents.data as unknown[]}
            loading={incidents.loading}
            onRefresh={incidents.refresh}
            setMsg={setMsg}
            setErr={setErr}
          />
        ) : null}
        {tab === "clock" && storeId ? (
          <ClockPanel
            storeId={storeId}
            entries={clock.data as unknown[]}
            openShift={clock.extra as { id: string } | null}
            loading={clock.loading}
            onRefresh={clock.refresh}
            setMsg={setMsg}
            setErr={setErr}
          />
        ) : null}
        {tab === "pos" && storeId ? (
          <PosPanel storeId={storeId} setMsg={setMsg} setErr={setErr} />
        ) : null}
      </div>
    </div>
  );
}

function useTeam(storeId: string) {
  const [data, setData] = useState<Array<{ id: string; name: string; email: string; role: string }>>(
    [],
  );
  const refresh = useCallback(async () => {
    if (!storeId) return;
    const r = await fetch(`/api/v2/admin/team?storeId=${encodeURIComponent(storeId)}`, {
      credentials: "include",
    });
    if (!r.ok) return;
    const j = (await r.json()) as { admins: typeof data };
    setData(j.admins ?? []);
  }, [storeId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, refresh };
}

function useFetchList(
  storeId: string,
  url: string,
  key: string,
  active: boolean,
  isClock = false,
) {
  const [data, setData] = useState<unknown[]>([]);
  const [extra, setExtra] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    if (!storeId || !active) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(url, { credentials: "include" });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) return;
      if (isClock) {
        setData((j.entries as unknown[]) ?? []);
        setExtra(j.openShift ?? null);
      } else {
        setData((j[key] as unknown[]) ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [storeId, url, key, active, isClock]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, extra, loading, refresh };
}

function ApprovalsPanel({
  storeId,
  admin,
  rows,
  loading,
  onRefresh,
  setMsg,
  setErr,
}: {
  storeId: string;
  admin: Admin;
  rows: unknown[];
  loading: boolean;
  onRefresh: () => void;
  setMsg: (s: string | null) => void;
  setErr: (s: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("REFUND");
  const [amount, setAmount] = useState("");
  const resolver = canResolveApprovals(admin.role);

  async function create() {
    setErr(null);
    const r = await fetch("/api/v2/admin/approvals", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        type,
        title,
        amountCents: amount ? Math.round(Number(amount)) : null,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setErr(j.error ?? "Failed");
    else {
      setMsg("Approval request created");
      setTitle("");
      onRefresh();
    }
  }

  async function resolve(id: string, action: "approve" | "reject", executeRefund?: boolean) {
    setErr(null);
    const r = await fetch(`/api/v2/admin/approvals/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, executeRefund: executeRefund ?? false }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setErr(j.error ?? "Failed");
    else {
      setMsg(`Approval ${action}d`);
      onRefresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-semibold">New approval request</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            className="rounded bg-black/40 px-3 py-2 text-sm"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            className="rounded bg-black/40 px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {["DISCOUNT", "REFUND", "PRICING_CHANGE", "CORPORATE_HOLD", "MEMBERSHIP"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="rounded bg-black/40 px-3 py-2 text-sm"
            placeholder="Amount (INR, for refunds)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="button"
            disabled={!storeId || !title.trim()}
            className="rounded bg-emerald-600 px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void create()}
          >
            Submit request
          </button>
        </div>
      </div>
      <div>
        <h2 className="font-semibold">Queue {loading ? "…" : `(${rows.length})`}</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {rows.map((raw) => {
            const a = raw as Record<string, unknown>;
            return (
              <li key={String(a.id)} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <span>
                    <strong>{String(a.title)}</strong> · {String(a.type)} · {String(a.state)}
                  </span>
                  {a.state === "PENDING" && resolver ? (
                    <span className="flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-emerald-700 px-2 py-1 text-xs"
                        onClick={() =>
                          void resolve(
                            String(a.id),
                            "approve",
                            a.type === "REFUND" && Number(a.amountCents) > 0,
                          )
                        }
                      >
                        Approve
                        {a.type === "REFUND" ? " + refund" : ""}
                      </button>
                      <button
                        type="button"
                        className="rounded bg-zinc-600 px-2 py-1 text-xs"
                        onClick={() => void resolve(String(a.id), "reject")}
                      >
                        Reject
                      </button>
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ShiftsPanel({
  storeId,
  admin,
  rows,
  team,
  loading,
  onRefresh,
  setMsg,
  setErr,
}: {
  storeId: string;
  admin: Admin;
  rows: unknown[];
  team: Array<{ id: string; name: string; role: string }>;
  loading: boolean;
  onRefresh: () => void;
  setMsg: (s: string | null) => void;
  setErr: (s: string | null) => void;
}) {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [name, setName] = useState("");
  const [pickUser, setPickUser] = useState("");
  const [duty, setDuty] = useState("FLOOR");
  const can = canManageShifts(admin.role);

  async function create() {
    setErr(null);
    const r = await fetch("/api/v2/admin/shifts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        startsAt,
        endsAt,
        name: name || undefined,
        assignments: pickUser ? [{ adminUserId: pickUser, dutyRole: duty }] : [],
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setErr(j.error ?? "Failed");
    else {
      setMsg("Shift created");
      onRefresh();
    }
  }

  async function remove(id: string) {
    const r = await fetch(`/api/v2/admin/shifts/${id}`, { method: "DELETE", credentials: "include" });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setErr(j.error ?? "Failed");
    else {
      setMsg("Shift removed");
      onRefresh();
    }
  }

  if (!can) {
    return <p className="text-sm text-zinc-500">Only Owner or Manager can manage shifts.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-semibold">New shift</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            type="datetime-local"
            className="rounded bg-black/40 px-3 py-2 text-sm"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <input
            type="datetime-local"
            className="rounded bg-black/40 px-3 py-2 text-sm"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
          <input
            className="rounded bg-black/40 px-3 py-2 text-sm"
            placeholder="Label (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="rounded bg-black/40 px-3 py-2 text-sm"
            value={pickUser}
            onChange={(e) => setPickUser(e.target.value)}
          >
            <option value="">Assign teammate (optional)</option>
            {team.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
          <select
            className="rounded bg-black/40 px-3 py-2 text-sm"
            value={duty}
            onChange={(e) => setDuty(e.target.value)}
          >
            {["FLOOR", "CASH_POS", "SUPPORT", "MANAGER_ON_DUTY", "GENERAL"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!storeId || !startsAt || !endsAt}
            className="rounded bg-emerald-600 px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void create()}
          >
            Save shift
          </button>
        </div>
      </div>
      <div>
        <h2 className="font-semibold">Scheduled {loading ? "…" : ""}</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {rows.map((raw) => {
            const s = raw as Record<string, unknown> & {
              assignments?: Array<{ adminUser: { name: string } }>;
            };
            return (
              <li key={String(s.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 p-3">
                <span>
                  {String(s.name ?? "Shift")} · {String(s.startsAt)} → {String(s.endsAt)}
                  <span className="ml-2 text-zinc-500">
                    {(s.assignments ?? []).map((a) => a.adminUser.name).join(", ")}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs text-rose-400"
                  onClick={() => void remove(String(s.id))}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function TicketsPanel({
  storeId,
  rows,
  loading,
  onRefresh,
  setMsg,
  setErr,
}: {
  storeId: string;
  rows: unknown[];
  loading: boolean;
  onRefresh: () => void;
  setMsg: (s: string | null) => void;
  setErr: (s: string | null) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function create() {
    setErr(null);
    const r = await fetch("/api/v2/admin/tickets", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, subject, body }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setErr(j.error ?? "Failed");
    else {
      setMsg("Ticket created");
      setSubject("");
      setBody("");
      onRefresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-semibold">New ticket</h2>
        <input
          className="mt-2 w-full rounded bg-black/40 px-3 py-2 text-sm"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="mt-2 w-full rounded bg-black/40 px-3 py-2 text-sm"
          rows={3}
          placeholder="Details"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="button"
          disabled={!storeId || !subject.trim()}
          className="mt-2 rounded bg-emerald-600 px-3 py-2 text-sm disabled:opacity-40"
          onClick={() => void create()}
        >
          Open ticket
        </button>
      </div>
      <div>
        <h2 className="font-semibold">Tickets {loading ? "…" : `(${rows.length})`}</h2>
        <ul className="mt-2 space-y-1 text-sm text-zinc-300">
          {rows.map((raw) => {
            const t = raw as Record<string, unknown>;
            return (
              <li key={String(t.id)}>
                {String(t.subject)} · {String(t.status)} · {String(t.priority)}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function IncidentsPanel({
  storeId,
  rows,
  loading,
  onRefresh,
  setMsg,
  setErr,
}: {
  storeId: string;
  rows: unknown[];
  loading: boolean;
  onRefresh: () => void;
  setMsg: (s: string | null) => void;
  setErr: (s: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function create() {
    setErr(null);
    const r = await fetch("/api/v2/admin/incidents", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, title, description }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setErr(j.error ?? "Failed");
    else {
      setMsg("Incident logged");
      setTitle("");
      setDescription("");
      onRefresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 p-4">
        <h2 className="font-semibold">Log incident</h2>
        <input
          className="mt-2 w-full rounded bg-black/40 px-3 py-2 text-sm"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="mt-2 w-full rounded bg-black/40 px-3 py-2 text-sm"
          rows={3}
          placeholder="What happened?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="button"
          disabled={!storeId || !title.trim()}
          className="mt-2 rounded bg-amber-700 px-3 py-2 text-sm disabled:opacity-40"
          onClick={() => void create()}
        >
          Submit
        </button>
      </div>
      <div>
        <h2 className="font-semibold">Recent {loading ? "…" : `(${rows.length})`}</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {rows.map((raw) => {
            const i = raw as Record<string, unknown>;
            return (
              <li key={String(i.id)}>
                {String(i.title)} · {String(i.severity)}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ClockPanel({
  storeId,
  entries,
  openShift,
  loading,
  onRefresh,
  setMsg,
  setErr,
}: {
  storeId: string;
  entries: unknown[];
  openShift: { id: string } | null;
  loading: boolean;
  onRefresh: () => void;
  setMsg: (s: string | null) => void;
  setErr: (s: string | null) => void;
}) {
  async function punch(action: "in" | "out") {
    setErr(null);
    const r = await fetch("/api/v2/admin/time-clock", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, action }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setErr(j.error ?? "Failed");
    else {
      setMsg(action === "in" ? "Clocked in" : "Clocked out");
      onRefresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!storeId || !!openShift}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm disabled:opacity-40"
          onClick={() => void punch("in")}
        >
          Clock in
        </button>
        <button
          type="button"
          disabled={!storeId || !openShift}
          className="rounded-lg bg-zinc-600 px-4 py-2 text-sm disabled:opacity-40"
          onClick={() => void punch("out")}
        >
          Clock out
        </button>
        {openShift ? (
          <span className="self-center text-xs text-amber-200">Open shift active</span>
        ) : null}
      </div>
      <div>
        <h2 className="font-semibold">History {loading ? "…" : ""}</h2>
        <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-xs text-zinc-400">
          {entries.map((raw) => {
            const e = raw as Record<string, unknown> & {
              adminUser?: { name: string };
            };
            return (
              <li key={String(e.id)}>
                {e.adminUser?.name ?? "—"} · in {String(e.clockInAt)} · out{" "}
                {e.clockOutAt ? String(e.clockOutAt) : "—"}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function PosPanel({
  storeId,
  setMsg,
  setErr,
}: {
  storeId: string;
  setMsg: (s: string | null) => void;
  setErr: (s: string | null) => void;
}) {
  void storeId;
  const [reservationId, setReservationId] = useState("");
  const [method, setMethod] = useState("cash");
  const [lines, setLines] = useState("Admission x2 @500\nSocks x2 @100");

  async function pay() {
    setErr(null);
    const parsed = lines
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const m = line.match(/^(.+?)\s*x\s*(\d+)\s*@?\s*(\d+)/i);
        if (!m) return null;
        return { description: m[1].trim(), quantity: Number(m[2]), unitAmount: Number(m[3]) };
      })
      .filter(Boolean) as Array<{ description: string; quantity: number; unitAmount: number }>;
    const r = await fetch("/api/v2/admin/payments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        method,
        lineItems: parsed.length ? parsed : undefined,
        amount: 0,
        status: "PAID",
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) setErr(j.error ?? "Failed");
    else {
      setMsg("Payment recorded with line items");
    }
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <h2 className="font-semibold">Itemized payment</h2>
      <p className="mt-1 text-xs text-zinc-500">
        One line per item: <code className="text-zinc-400">Label x2 @500</code> (quantity × unit paise or
        rupees as configured below — amounts are in rupees here).
      </p>
      <input
        className="mt-3 w-full rounded bg-black/40 px-3 py-2 font-mono text-sm"
        placeholder="reservationId"
        value={reservationId}
        onChange={(e) => setReservationId(e.target.value)}
      />
      <select
        className="mt-2 rounded bg-black/40 px-3 py-2 text-sm"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
      >
        {["cash", "card", "upi", "razorpay"].map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <textarea
        className="mt-2 w-full rounded bg-black/40 px-3 py-2 font-mono text-sm"
        rows={5}
        value={lines}
        onChange={(e) => setLines(e.target.value)}
      />
      <button
        type="button"
        disabled={!reservationId}
        className="mt-2 rounded bg-pink-700 px-4 py-2 text-sm disabled:opacity-40"
        onClick={() => void pay()}
      >
        Post payment
      </button>
    </div>
  );
}
