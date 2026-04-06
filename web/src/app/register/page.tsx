"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, phone, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((j as { error?: string }).error ?? "Registration failed");
      }
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-cyan)]">
        Create account
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Register
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Use the same phone for bookings — we&apos;ll use it for WhatsApp updates
        later. Password min. 8 characters.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
        <label className="block text-sm text-zinc-400">
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--ga-cyan)]"
          />
        </label>
        <label className="block text-sm text-zinc-400">
          Phone
          <input
            required
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--ga-cyan)]"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-[var(--ga-cyan)]"
          />
        </label>
        {error ? (
          <p className="text-sm text-[var(--ga-lava)]">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="ga-btn-neon w-full rounded-full py-3 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--ga-cyan)] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
