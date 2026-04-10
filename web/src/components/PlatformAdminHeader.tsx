"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AdminRoleName } from "@prisma/client";
import { displayRoleName, personaForRole } from "@/lib/platform/admin-persona";

type Admin = { id: string; name: string; email: string; role: AdminRoleName; storeIds: string[] };

export function PlatformAdminHeader() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);

  const navLinks = useMemo(() => (admin ? personaForRole(admin.role).nav : []), [admin]);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/v2/admin/auth/me", { credentials: "include" });
      if (!r.ok) return;
      const j = (await r.json()) as { admin: Admin };
      setAdmin(j.admin);
    })();
  }, []);

  async function signOut() {
    await fetch("/api/v2/admin/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login?next=/platform/admin");
    router.refresh();
  }

  return (
    <header className="border-b border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-white">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-[var(--ga-orange)]">Admin</span>
          {navLinks.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="text-zinc-300 hover:text-white">
              {item.label}
            </Link>
          ))}
          <Link href="/platform/customer" className="text-zinc-400 hover:text-zinc-200">
            Customer demo
          </Link>
          <Link href="/admin" className="text-zinc-400 hover:text-zinc-200">
            Legacy dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {admin ? (
            <span className="text-zinc-400">
              {admin.name}{" "}
              <span className="text-zinc-500">({displayRoleName(admin.role)})</span>
            </span>
          ) : (
            <span className="text-zinc-500">…</span>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
