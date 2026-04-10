"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminRoleName } from "@prisma/client";
import { isOwner } from "@/lib/platform/admin-capabilities";

type Admin = { id: string; name: string; email: string; role: AdminRoleName; storeIds: string[] };

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [matrix, setMatrix] = useState<
    Array<{ role: string; description: string | null; permissions: Record<string, boolean> }>
  >([]);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/v2/admin/auth/me", { credentials: "include" });
      if (me.ok) {
        const j = (await me.json()) as { admin: Admin };
        setAdmin(j.admin);
        if (!isOwner(j.admin.role)) {
          setErr("Owner sign-in required for system configuration.");
          return;
        }
        const r = await fetch("/api/v2/admin/settings/role-matrix", { credentials: "include" });
        const mj = (await r.json().catch(() => ({}))) as {
          matrix?: typeof matrix;
          note?: string;
          error?: string;
        };
        if (!r.ok) setErr(mj.error ?? "Failed to load matrix");
        else {
          setMatrix(mj.matrix ?? []);
          setNote(mj.note ?? null);
        }
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">System configuration</h1>
          <p className="mt-1 text-sm text-zinc-400">Role matrix and permission map (Owner only).</p>
        </div>
        <Link href="/platform/admin" className="text-sm text-cyan-300 underline">
          Dashboard
        </Link>
      </div>

      {err ? (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          {err}
        </p>
      ) : null}

      {note ? <p className="mt-4 text-xs text-zinc-500">{note}</p> : null}

      {admin && isOwner(admin.role) && matrix.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-black/40 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Description</th>
                {Object.keys(matrix[0]?.permissions ?? {}).map((k) => (
                  <th key={k} className="px-2 py-2">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.role} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2 font-medium text-zinc-200">{row.role}</td>
                  <td className="px-3 py-2 text-zinc-500">{row.description ?? "—"}</td>
                  {Object.entries(row.permissions).map(([k, v]) => (
                    <td key={k} className="px-2 py-2 text-center text-xs">
                      {v ? "Yes" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
