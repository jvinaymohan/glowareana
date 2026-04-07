"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { safeAuthRedirectNext } from "@/lib/auth-redirect";

type Mode = "signin" | "signup";

export function AccountAuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");

  const mode: Mode =
    searchParams.get("mode") === "signup" ? "signup" : "signin";

  const setMode = useCallback(
    (m: Mode) => {
      const q = new URLSearchParams(searchParams.toString());
      if (m === "signup") q.set("mode", "signup");
      else q.delete("mode");
      router.replace(`/login?${q.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((j as { error?: string }).error ?? "Login failed");
      }
      router.push(safeAuthRedirectNext(nextRaw));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, phone, password: regPassword }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(
          (j as { error?: string }).error ?? "Registration failed",
        );
      }
      router.push(safeAuthRedirectNext(nextRaw));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1.5 min-h-[48px] w-full rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-base text-white outline-none focus:border-[var(--ga-cyan)] sm:min-h-0 sm:py-2 sm:text-sm";

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-cyan)]">
        Glow Arena
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white sm:text-3xl">
        Your account
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Sign in to manage bookings, or create an account. Use the same phone as
        your reservations for WhatsApp updates (password min. 8 characters).
      </p>

      <div
        className="mt-8 flex rounded-full border border-white/15 bg-black/40 p-1"
        role="tablist"
        aria-label="Sign in or create account"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          onClick={() => setMode("signin")}
          className={`min-h-[48px] flex-1 rounded-full px-3 py-2 text-sm font-semibold transition touch-manipulation sm:px-4 sm:py-2.5 ${
            mode === "signin"
              ? "bg-[var(--ga-cyan)]/20 text-[var(--ga-cyan)] shadow-[0_0_16px_rgba(0,240,255,0.15)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => setMode("signup")}
          className={`min-h-[48px] flex-1 rounded-full px-3 py-2 text-sm font-semibold transition touch-manipulation sm:px-4 sm:py-2.5 ${
            mode === "signup"
              ? "bg-[var(--ga-magenta)]/20 text-[var(--ga-magenta)] shadow-[0_0_16px_rgba(255,45,140,0.12)]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Create account
        </button>
      </div>

      {mode === "signin" ? (
        <form
          onSubmit={(e) => void handleSignIn(e)}
          className="mt-8 space-y-4"
          noValidate
        >
          <label className="block text-sm text-zinc-400">
            Email or phone
            <input
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={inputClass}
              placeholder="you@email.com or +91…"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          {error ? (
            <p className="text-sm text-[var(--ga-lava)]">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="ga-btn-neon min-h-[52px] w-full rounded-full py-3.5 text-base font-semibold touch-manipulation disabled:opacity-50 sm:py-3 sm:text-sm"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => void handleSignUp(e)}
          className="mt-8 space-y-4"
          noValidate
        >
          <label className="block text-sm text-zinc-400">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              inputMode="email"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Phone
            <input
              required
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+91 …"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Password
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          {error ? (
            <p className="text-sm text-[var(--ga-lava)]">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="ga-btn-neon min-h-[52px] w-full rounded-full py-3.5 text-base font-semibold touch-manipulation disabled:opacity-50 sm:py-3 sm:text-sm"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}
