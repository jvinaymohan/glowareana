"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { safeAdminNext, safeLegacyAdminNext } from "@/lib/admin-login-redirect";
import { site } from "@/lib/site";

type Props = {
  legacyLoginEnabled: boolean;
  nextParam: string | null;
};

export function AdminLoginClient({ legacyLoginEnabled, nextParam }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [platformPassword, setPlatformPassword] = useState("");
  const [legacyPassword, setLegacyPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyPlatform, setBusyPlatform] = useState(false);
  const [busyLegacy, setBusyLegacy] = useState(false);

  const inputClass =
    "mt-1.5 min-h-[48px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-base text-white outline-none focus:border-[var(--ga-orange)] sm:min-h-0 sm:py-2 sm:text-sm";

  async function onPlatformSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusyPlatform(true);
    try {
      const r = await fetch("/api/v2/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: platformPassword }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((j as { error?: string }).error ?? "Login failed");
      }
      const dest = safeAdminNext(nextParam, "/platform/admin");
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyPlatform(false);
    }
  }

  async function onLegacySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusyLegacy(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: legacyPassword }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((j as { error?: string }).error ?? "Login failed");
      }
      const dest = safeLegacyAdminNext(nextParam, "/admin");
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyLegacy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-orange)]">
        {site.name}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white sm:text-3xl">
        Admin sign in
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Use your team account for the platform dashboard and reports. Sessions use secure HTTP-only cookies.
      </p>

      <form onSubmit={(e) => void onPlatformSubmit(e)} className="mt-8 space-y-4" noValidate>
        <h2 className="text-sm font-semibold text-zinc-300">Platform (dashboard &amp; reports)</h2>
        <label className="block text-sm text-zinc-400">
          Work email
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm text-zinc-400">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={platformPassword}
            onChange={(e) => setPlatformPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        {error ? <p className="text-sm text-[var(--ga-lava)]">{error}</p> : null}
        <button
          type="submit"
          disabled={busyPlatform}
          className="min-h-[52px] w-full rounded-full bg-[var(--ga-orange)] py-3.5 text-base font-semibold text-[#0b0b12] touch-manipulation disabled:opacity-50 sm:py-3 sm:text-sm"
        >
          {busyPlatform ? "Signing in…" : "Sign in to platform admin"}
        </button>
      </form>

      {legacyLoginEnabled ? (
        <>
          <div className="my-10 border-t border-white/10" />
          <h2 className="text-sm font-semibold text-zinc-300">Legacy dashboard</h2>
          <p className="mt-1 text-sm text-zinc-500">
            File-backed admin tools only. Password from server environment (
            <code className="text-zinc-400">ADMIN_SECRET</code>).
          </p>
          <form onSubmit={(e) => void onLegacySubmit(e)} className="mt-4 space-y-4" noValidate>
            <label className="block text-sm text-zinc-400">
              Admin password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={legacyPassword}
                onChange={(e) => setLegacyPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={busyLegacy}
              className="min-h-[52px] w-full rounded-full border border-white/20 py-3.5 text-base font-semibold text-white touch-manipulation disabled:opacity-50 sm:py-3 sm:text-sm"
            >
              {busyLegacy ? "Signing in…" : "Sign in to legacy admin"}
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
