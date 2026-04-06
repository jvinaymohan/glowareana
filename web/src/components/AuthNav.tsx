"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { id: string; email: string; phone: string };

export function AuthNav() {
  const [user, setUser] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { user?: Me | null }) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }

  if (!loaded) {
    return (
      <span
        className="hidden h-8 w-20 animate-pulse rounded bg-white/5 sm:inline-block"
        aria-hidden
      />
    );
  }

  if (user) {
    return (
      <div className="hidden items-center gap-3 sm:flex">
        <Link
          href="/account"
          className="text-sm font-medium text-[var(--ga-cyan)] hover:underline"
        >
          My bookings
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 sm:flex">
      <Link
        href="/login"
        className="text-sm text-zinc-400 hover:text-white"
      >
        Log in
      </Link>
      <Link
        href="/register"
        className="text-sm font-medium text-[var(--ga-cyan)] hover:underline"
      >
        Register
      </Link>
    </div>
  );
}

export function AuthNavMobile({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const [user, setUser] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { user?: Me | null }) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    onNavigate?.();
  }

  if (user) {
    return (
      <>
        <Link
          href="/account"
          className="rounded-lg px-3 py-3 text-base font-medium text-[var(--ga-cyan)]"
          onClick={onNavigate}
        >
          My bookings
        </Link>
        <button
          type="button"
          className="w-full rounded-lg px-3 py-3 text-left text-base text-zinc-400"
          onClick={() => void logout()}
        >
          Log out
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="rounded-lg px-3 py-3 text-base text-zinc-200"
        onClick={onNavigate}
      >
        Log in
      </Link>
      <Link
        href="/register"
        className="rounded-lg px-3 py-3 text-base font-medium text-[var(--ga-cyan)]"
        onClick={onNavigate}
      >
        Register
      </Link>
    </>
  );
}
