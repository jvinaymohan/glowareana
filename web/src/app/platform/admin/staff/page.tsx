"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRoleName } from "@prisma/client";
import { personaForRole } from "@/lib/platform/admin-persona";
import { ALL_ASSIGNABLE_ROLES, ROLES_HIRABLE_BY_MANAGER } from "@/lib/platform/staff-roles";

type Admin = { id: string; name: string; email: string; role: AdminRoleName; storeIds: string[] };
type StoreRow = { id: string; code: string; name: string };

const DUTY_ROLES = ["GENERAL", "FLOOR", "CASH_POS", "SUPPORT", "MANAGER_ON_DUTY"] as const;

export default function StaffSchedulePage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storeId, setStoreId] = useState("");
  const [tab, setTab] = useState<
    "overview" | "games" | "team" | "schedule" | "time" | "payroll"
  >("overview");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canManageGames = admin?.role === "OWNER" || admin?.role === "STORE_MANAGER";
  const canManageTeam = canManageGames;
  const canPayroll = canManageGames;
  const lineStaff = admin?.role === "EMPLOYEE" || admin?.role === "CASH_POS_USER";

  const hireRoleOptions = useMemo(() => {
    if (!admin) return [];
    if (admin.role === "OWNER") return [...ALL_ASSIGNABLE_ROLES];
    return [...ROLES_HIRABLE_BY_MANAGER];
  }, [admin]);

  const persona = admin ? personaForRole(admin.role) : null;

  const refreshMe = useCallback(async () => {
    const r = await fetch("/api/v2/admin/auth/me", { credentials: "include" });
    if (!r.ok) return;
    const j = (await r.json()) as { admin: Admin };
    setAdmin(j.admin);
  }, []);

  const loadStores = useCallback(async () => {
    const r = await fetch("/api/v2/admin/stores", { credentials: "include" });
    if (!r.ok) return;
    const j = (await r.json()) as { stores: StoreRow[] };
    setStores(j.stores ?? []);
  }, []);

  useEffect(() => {
    void refreshMe();
    void loadStores();
  }, [refreshMe, loadStores]);

  useEffect(() => {
    if (admin?.storeIds?.length && !storeId) {
      setStoreId(admin.storeIds[0] ?? "");
    }
  }, [admin, storeId]);

  useEffect(() => {
    if (lineStaff && tab === "games") setTab("overview");
    if (lineStaff && tab === "team") setTab("overview");
    if (lineStaff && tab === "payroll") setTab("overview");
  }, [lineStaff, tab]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Staff &amp; schedule</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Arena games (up to 5), hiring &amp; multi-arena assignment, shifts, time clock, and salary
            payouts.
          </p>
        </div>
        <Link href="/platform/admin" className="text-sm text-cyan-400 underline">
          ← Dashboard
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
        <select
          className="rounded-lg bg-black/50 px-3 py-2 text-sm"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <option value="">Select arena</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
        {admin ? (
          <span className="self-center text-xs text-zinc-500">
            Signed in as <strong className="text-zinc-300">{admin.name}</strong> ({persona?.label})
          </span>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {(
          [
            ["overview", "Overview"],
            ...(canManageGames ? [["games", "Arena games (5)"] as const] : []),
            ...(canManageTeam ? [["team", "Team & hiring"] as const] : []),
            ["schedule", "Shifts"],
            ["time", "Time clock"],
            ...(canPayroll ? [["payroll", "Payroll"] as const] : []),
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              tab === k ? "bg-cyan-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
            onClick={() => {
              setTab(k);
              setErr(null);
              setMsg(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {err ? <p className="mb-3 text-sm text-red-400">{err}</p> : null}
      {msg ? <p className="mb-3 text-sm text-emerald-400">{msg}</p> : null}

      {!storeId ? (
        <p className="text-zinc-500">Pick an arena to load data.</p>
      ) : tab === "overview" ? (
        <OverviewPanel admin={admin} persona={persona} storeId={storeId} stores={stores} />
      ) : tab === "games" && canManageGames ? (
        <GamesPanel storeId={storeId} setErr={setErr} setMsg={setMsg} />
      ) : tab === "team" && canManageTeam ? (
        <TeamPanel
          storeId={storeId}
          stores={stores}
          hireRoleOptions={hireRoleOptions}
          setErr={setErr}
          setMsg={setMsg}
        />
      ) : tab === "schedule" ? (
        <SchedulePanel
          storeId={storeId}
          setErr={setErr}
          setMsg={setMsg}
          canManageShifts={admin?.role === "OWNER" || admin?.role === "STORE_MANAGER"}
        />
      ) : tab === "time" ? (
        <TimeClockPanel storeId={storeId} setErr={setErr} setMsg={setMsg} lineStaff={!!lineStaff} />
      ) : tab === "payroll" && canPayroll ? (
        <PayrollPanel storeId={storeId} setErr={setErr} setMsg={setMsg} />
      ) : null}
    </div>
  );
}

function OverviewPanel({
  admin,
  persona,
  storeId,
  stores,
}: {
  admin: Admin | null;
  persona: ReturnType<typeof personaForRole> | null;
  storeId: string;
  stores: StoreRow[];
}) {
  const arena = stores.find((s) => s.id === storeId);
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
      <p className="text-zinc-300">{persona?.tagline}</p>
      <p className="text-zinc-400">
        Current arena: <strong className="text-white">{arena?.name ?? storeId}</strong>
      </p>
      {admin?.storeIds?.length ? (
        <div>
          <p className="font-medium text-zinc-200">Your arena access</p>
          <ul className="mt-1 list-inside list-disc text-zinc-500">
            {admin.storeIds.map((id) => {
              const s = stores.find((x) => x.id === id);
              return (
                <li key={id}>
                  {s ? `${s.code} — ${s.name}` : id}
                  {id === storeId ? " (selected)" : ""}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-zinc-600">
            Staff can be assigned to multiple arenas. Scheduling and time clock are per arena; payroll rows
            are stored per arena with an optional link to a staff profile.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function GamesPanel({
  storeId,
  setErr,
  setMsg,
}: {
  storeId: string;
  setErr: (s: string | null) => void;
  setMsg: (s: string | null) => void;
}) {
  const [games, setGames] = useState<
    Array<{
      id: string;
      name: string;
      basePrice: number;
      maxPerSlot: number;
      durationMin: number;
      ageMin: number;
      ageMax: number;
      sortOrder: number;
      isActive: boolean;
    }>
  >([]);
  const [meta, setMeta] = useState<{ maxGames: number; activeCount: number } | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/v2/admin/games?storeId=${encodeURIComponent(storeId)}`, {
      credentials: "include",
    });
    const j = (await r.json().catch(() => ({}))) as {
      games?: typeof games;
      maxGames?: number;
      activeCount?: number;
      error?: string;
    };
    if (!r.ok) return setErr(j.error ?? "Failed to load games");
    setGames(j.games ?? []);
    setMeta(j.maxGames != null ? { maxGames: j.maxGames, activeCount: j.activeCount ?? 0 } : null);
  }, [storeId, setErr]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    setErr(null);
    setMsg(null);
    const r = await fetch(`/api/v2/admin/games/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setErr(j.error ?? "Update failed");
    setMsg("Saved");
    await load();
  }

  return (
    <div className="space-y-4">
      {meta ? (
        <p className="text-xs text-zinc-500">
          Active games: {meta.activeCount} / {meta.maxGames} (product limit per arena).
        </p>
      ) : null}
      <div className="space-y-3">
        {games.map((g) => (
          <div key={g.id} className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-cyan-200">{g.name}</span>
              <label className="flex items-center gap-1 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={g.isActive}
                  onChange={(e) => void patch(g.id, { isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs text-zinc-500">
                Name
                <input
                  className="mt-1 w-full rounded bg-black/50 px-2 py-1 text-white"
                  defaultValue={g.name}
                  onBlur={(e) => {
                    if (e.target.value !== g.name) void patch(g.id, { name: e.target.value });
                  }}
                />
              </label>
              <label className="text-xs text-zinc-500">
                Price ₹
                <input
                  type="number"
                  className="mt-1 w-full rounded bg-black/50 px-2 py-1 text-white"
                  defaultValue={g.basePrice}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n !== g.basePrice) void patch(g.id, { basePrice: n });
                  }}
                />
              </label>
              <label className="text-xs text-zinc-500">
                Max / slot
                <input
                  type="number"
                  className="mt-1 w-full rounded bg-black/50 px-2 py-1 text-white"
                  defaultValue={g.maxPerSlot}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n !== g.maxPerSlot) void patch(g.id, { maxPerSlot: n });
                  }}
                />
              </label>
              <label className="text-xs text-zinc-500">
                Minutes
                <input
                  type="number"
                  className="mt-1 w-full rounded bg-black/50 px-2 py-1 text-white"
                  defaultValue={g.durationMin}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n !== g.durationMin) void patch(g.id, { durationMin: n });
                  }}
                />
              </label>
              <label className="text-xs text-zinc-500">
                Age min
                <input
                  type="number"
                  className="mt-1 w-full rounded bg-black/50 px-2 py-1 text-white"
                  defaultValue={g.ageMin}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n !== g.ageMin) void patch(g.id, { ageMin: n });
                  }}
                />
              </label>
              <label className="text-xs text-zinc-500">
                Age max
                <input
                  type="number"
                  className="mt-1 w-full rounded bg-black/50 px-2 py-1 text-white"
                  defaultValue={g.ageMax}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n !== g.ageMax) void patch(g.id, { ageMax: n });
                  }}
                />
              </label>
              <label className="text-xs text-zinc-500">
                Sort order
                <input
                  type="number"
                  className="mt-1 w-full rounded bg-black/50 px-2 py-1 text-white"
                  defaultValue={g.sortOrder}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n !== g.sortOrder) void patch(g.id, { sortOrder: n });
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamPanel({
  storeId,
  stores,
  hireRoleOptions,
  setErr,
  setMsg,
}: {
  storeId: string;
  stores: StoreRow[];
  hireRoleOptions: readonly AdminRoleName[];
  setErr: (s: string | null) => void;
  setMsg: (s: string | null) => void;
}) {
  const [rows, setRows] = useState<
    Array<{
      id: string;
      email: string;
      name: string;
      isActive: boolean;
      role: string;
      arenas: Array<{ id: string; code: string; name: string }>;
    }>
  >([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRoleName>("EMPLOYEE");
  const [pickStores, setPickStores] = useState<string[]>([storeId]);

  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/v2/admin/staff?storeId=${encodeURIComponent(storeId)}`, {
      credentials: "include",
    });
    const j = (await r.json().catch(() => ({}))) as { staff?: typeof rows; error?: string };
    if (!r.ok) return setErr(j.error ?? "Failed");
    setRows(j.staff ?? []);
  }, [storeId, setErr]);

  useEffect(() => {
    setPickStores((p) => (p.includes(storeId) ? p : [...p, storeId]));
    void load();
  }, [storeId, load]);

  async function hire() {
    setErr(null);
    setMsg(null);
    const r = await fetch("/api/v2/admin/staff", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        password,
        role,
        storeIds: pickStores,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setErr(j.error ?? "Hire failed");
    setMsg("Staff created");
    setEmail("");
    setName("");
    setPassword("");
    await load();
  }

  async function toggleStore(u: (typeof rows)[0], sid: string, on: boolean) {
    const ids = new Set(u.arenas.map((a) => a.id));
    if (on) ids.add(sid);
    else ids.delete(sid);
    const next = [...ids];
    if (next.length === 0) return setErr("Keep at least one arena");
    setErr(null);
    const r = await fetch(`/api/v2/admin/staff/${u.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeIds: next }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setErr(j.error ?? "Update failed");
    setMsg("Arena assignment updated");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="font-semibold text-zinc-200">Hire staff</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Assign one or more arenas (for multi-location staff). Store managers can only hire into arenas
          they manage.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            className="rounded bg-black/50 px-3 py-2 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="rounded bg-black/50 px-3 py-2 text-sm"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded bg-black/50 px-3 py-2 text-sm"
            type="password"
            placeholder="Temp password (min 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className="rounded bg-black/50 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRoleName)}
          >
            {hireRoleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Arenas</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {stores.map((s) => (
            <label key={s.id} className="flex items-center gap-1 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={pickStores.includes(s.id)}
                onChange={(e) => {
                  if (e.target.checked) setPickStores((p) => [...p, s.id]);
                  else setPickStores((p) => p.filter((x) => x !== s.id));
                }}
              />
              {s.code}
            </label>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium"
          onClick={() => void hire()}
        >
          Create account
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Arenas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="px-3 py-2">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                </td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {stores.map((s) => (
                      <label key={s.id} className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <input
                          type="checkbox"
                          checked={u.arenas.some((a) => a.id === s.id)}
                          onChange={(e) => void toggleStore(u, s.id, e.target.checked)}
                        />
                        {s.code}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SchedulePanel({
  storeId,
  setErr,
  setMsg,
  canManageShifts,
}: {
  storeId: string;
  setErr: (s: string | null) => void;
  setMsg: (s: string | null) => void;
  canManageShifts: boolean;
}) {
  const [shifts, setShifts] = useState<
    Array<{
      id: string;
      name: string | null;
      startsAt: string;
      endsAt: string;
      assignments: Array<{
        adminUserId: string;
        dutyRole: string;
        adminUser: { id: string; name: string; email: string };
      }>;
    }>
  >([]);
  const [mine, setMine] = useState(false);
  const [admins, setAdmins] = useState<Array<{ id: string; name: string; email: string; role: string }>>(
    [],
  );
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [pickStaff, setPickStaff] = useState<string[]>([]);
  const [duty, setDuty] = useState<string>("GENERAL");

  const fromTo = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() + 21);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const loadShifts = useCallback(async () => {
    setErr(null);
    const q = new URLSearchParams({
      storeId,
      from: fromTo.from,
      to: fromTo.to,
    });
    if (mine) q.set("mine", "1");
    const r = await fetch(`/api/v2/admin/shifts?${q}`, { credentials: "include" });
    const j = (await r.json().catch(() => ({}))) as { shifts?: typeof shifts; error?: string };
    if (!r.ok) return setErr(j.error ?? "Failed shifts");
    setShifts(j.shifts ?? []);
  }, [storeId, fromTo.from, fromTo.to, mine, setErr]);

  const loadTeam = useCallback(async () => {
    const r = await fetch(`/api/v2/admin/team?storeId=${encodeURIComponent(storeId)}`, {
      credentials: "include",
    });
    const j = (await r.json().catch(() => ({}))) as {
      admins?: Array<{ id: string; name: string; email: string; role: string }>;
    };
    setAdmins(j.admins ?? []);
  }, [storeId]);

  useEffect(() => {
    void loadShifts();
    void loadTeam();
  }, [loadShifts, loadTeam]);

  async function createShift() {
    setErr(null);
    setMsg(null);
    const assignments = pickStaff.map((id) => ({ adminUserId: id, dutyRole: duty }));
    const r = await fetch("/api/v2/admin/shifts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        startsAt,
        endsAt,
        assignments,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setErr(j.error ?? "Create failed");
    setMsg("Shift scheduled");
    setPickStaff([]);
    await loadShifts();
  }

  async function deleteShift(id: string) {
    if (!confirm("Delete this shift?")) return;
    setErr(null);
    const r = await fetch(`/api/v2/admin/shifts/${id}`, { method: "DELETE", credentials: "include" });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      return setErr(j.error ?? "Delete failed");
    }
    await loadShifts();
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-xs text-zinc-400">
        <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
        Only shifts assigned to me
      </label>

      {canManageShifts ? (
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="font-semibold text-zinc-200">New shift</h3>
        <p className="text-xs text-zinc-500">Pick who is on duty; everyone can see coverage below.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            type="datetime-local"
            className="rounded bg-black/50 px-2 py-2 text-sm text-white"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <input
            type="datetime-local"
            className="rounded bg-black/50 px-2 py-2 text-sm text-white"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
        <select
          className="mt-2 rounded bg-black/50 px-2 py-2 text-sm"
          value={duty}
          onChange={(e) => setDuty(e.target.value)}
        >
          {DUTY_ROLES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-zinc-500">Staff on this shift</p>
        <div className="mt-1 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
          {admins.map((a) => (
            <label key={a.id} className="flex items-center gap-1 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={pickStaff.includes(a.id)}
                onChange={(e) => {
                  if (e.target.checked) setPickStaff((p) => [...p, a.id]);
                  else setPickStaff((p) => p.filter((x) => x !== a.id));
                }}
              />
              {a.name}
            </label>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm"
          onClick={() => void createShift()}
        >
          Save shift
        </button>
      </div>
      ) : (
        <p className="text-xs text-zinc-500">
          Only <strong className="text-zinc-400">Owner</strong> or{" "}
          <strong className="text-zinc-400">Store manager</strong> can create or delete shifts. You can still
          view assignments.
        </p>
      )}

      <ul className="space-y-2 text-sm">
        {shifts.map((s) => (
          <li key={s.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex flex-wrap justify-between gap-2">
              <span>
                {new Date(s.startsAt).toLocaleString()} → {new Date(s.endsAt).toLocaleString()}
              </span>
              {canManageShifts ? (
                <button
                  type="button"
                  className="text-xs text-red-400 underline"
                  onClick={() => void deleteShift(s.id)}
                >
                  Delete
                </button>
              ) : null}
            </div>
            {s.name ? <p className="text-xs text-zinc-500">{s.name}</p> : null}
            <ul className="mt-2 text-xs text-zinc-400">
              {s.assignments.map((as) => (
                <li key={as.adminUserId}>
                  {as.adminUser.name} ({as.dutyRole})
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimeClockPanel({
  storeId,
  setErr,
  setMsg,
  lineStaff,
}: {
  storeId: string;
  setErr: (s: string | null) => void;
  setMsg: (s: string | null) => void;
  lineStaff: boolean;
}) {
  const [entries, setEntries] = useState<
    Array<{
      id: string;
      clockInAt: string;
      clockOutAt: string | null;
      adminUser: { name: string; email: string };
    }>
  >([]);
  const [openShift, setOpenShift] = useState<{ id: string } | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const q = new URLSearchParams({ storeId });
    if (lineStaff) q.set("mine", "1");
    const r = await fetch(`/api/v2/admin/time-clock?${q}`, { credentials: "include" });
    const j = (await r.json().catch(() => ({}))) as {
      entries?: typeof entries;
      openShift?: { id: string } | null;
      error?: string;
    };
    if (!r.ok) return setErr(j.error ?? "Failed");
    setEntries(j.entries ?? []);
    setOpenShift(j.openShift ?? null);
  }, [storeId, lineStaff, setErr]);

  useEffect(() => {
    void load();
  }, [load]);

  async function punch(action: "in" | "out") {
    setErr(null);
    setMsg(null);
    const r = await fetch("/api/v2/admin/time-clock", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, action }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setErr(j.error ?? "Clock failed");
    setMsg(action === "in" ? "Clocked in" : "Clocked out");
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm disabled:opacity-40"
          disabled={!!openShift}
          onClick={() => void punch("in")}
        >
          Clock in
        </button>
        <button
          type="button"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm disabled:opacity-40"
          disabled={!openShift}
          onClick={() => void punch("out")}
        >
          Clock out
        </button>
        {openShift ? (
          <span className="self-center text-xs text-amber-200">Open entry — clock out to close.</span>
        ) : null}
      </div>
      {!lineStaff ? (
        <p className="text-xs text-zinc-500">
          Showing all punches for this arena (managers/supervisors). Use Operations with{" "}
          <code className="text-zinc-400">?mine=1</code> on the API to filter yourself only.
        </p>
      ) : null}
      <div className="overflow-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2">Staff</th>
              <th className="px-3 py-2">In</th>
              <th className="px-3 py-2">Out</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-white/10">
                <td className="px-3 py-2">{e.adminUser.name}</td>
                <td className="px-3 py-2">{new Date(e.clockInAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {e.clockOutAt ? new Date(e.clockOutAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayrollPanel({
  storeId,
  setErr,
  setMsg,
}: {
  storeId: string;
  setErr: (s: string | null) => void;
  setMsg: (s: string | null) => void;
}) {
  const [rows, setRows] = useState<
    Array<{
      id: string;
      employeeName: string;
      amount: number;
      payPeriodStart: string;
      payPeriodEnd: string;
      status: string;
      payoutDate: string | null;
      adminUserId: string | null;
    }>
  >([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(50000);
  const [staffId, setStaffId] = useState("");
  const [admins, setAdmins] = useState<Array<{ id: string; name: string }>>([]);

  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/v2/admin/salaries?storeId=${encodeURIComponent(storeId)}`, {
      credentials: "include",
    });
    const j = (await r.json().catch(() => ({}))) as { salaries?: typeof rows; error?: string };
    if (!r.ok) return setErr(j.error ?? "Failed");
    setRows((j.salaries ?? []) as typeof rows);
  }, [storeId, setErr]);

  const loadAdmins = useCallback(async () => {
    const r = await fetch(`/api/v2/admin/team?storeId=${encodeURIComponent(storeId)}`, {
      credentials: "include",
    });
    const j = (await r.json().catch(() => ({}))) as { admins?: Array<{ id: string; name: string }> };
    setAdmins(j.admins ?? []);
  }, [storeId]);

  useEffect(() => {
    void load();
    void loadAdmins();
  }, [load, loadAdmins]);

  async function addRow() {
    setErr(null);
    setMsg(null);
    const start = new Date();
    start.setDate(1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const r = await fetch("/api/v2/admin/salaries", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        employeeName: name,
        amount,
        adminUserId: staffId || null,
        payPeriodStart: start.toISOString(),
        payPeriodEnd: end.toISOString(),
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setErr(j.error ?? "Failed");
    setMsg("Salary row added");
    setName("");
    await load();
  }

  async function markPaid(id: string) {
    setErr(null);
    const r = await fetch(`/api/v2/admin/salaries/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markPaid: true }),
    });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return setErr(j.error ?? "Failed");
    setMsg("Marked paid");
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="font-semibold text-zinc-200">Add payroll line</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            className="rounded bg-black/50 px-3 py-2 text-sm"
            placeholder="Employee name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            className="rounded bg-black/50 px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <select
            className="rounded bg-black/50 px-3 py-2 text-sm sm:col-span-2"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            <option value="">Optional: link platform staff</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="mt-2 rounded-lg bg-violet-600 px-4 py-2 text-sm" onClick={() => void addRow()}>
          Add
        </button>
        <p className="mt-2 text-xs text-zinc-600">
          Period defaults to current calendar month. Extend API later for custom ranges.
        </p>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs text-zinc-500">
          <tr>
            <th className="px-3 py-2">Employee</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-white/10">
              <td className="px-3 py-2">{r.employeeName}</td>
              <td className="px-3 py-2">₹{r.amount}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2">
                {r.status === "SCHEDULED" ? (
                  <button
                    type="button"
                    className="text-xs text-cyan-400 underline"
                    onClick={() => void markPaid(r.id)}
                  >
                    Mark paid
                  </button>
                ) : (
                  <span className="text-xs text-zinc-600">
                    {r.payoutDate ? new Date(r.payoutDate).toLocaleDateString() : ""}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
