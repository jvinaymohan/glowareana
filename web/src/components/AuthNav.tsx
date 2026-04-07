"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { id: string; email: string; phone: string };

/**
 * Signed-in users only. Guests use Book now → on-page gate (no duplicate Sign in in header).
 */
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

  if (!loaded || !user) {
    return null;
  }

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

export function AuthNavMobile({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
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
    onNavigate?.();
  }

  if (!loaded || !user) {
    return (
      <Link
        href="/login"
        className="mt-3 flex min-h-[48px] items-center justify-center rounded-lg border border-white/10 px-3 text-sm text-zinc-400 touch-manipulation hover:bg-white/5 hover:text-zinc-300"
        onClick={onNavigate}
      >
        Already have an account?
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/account"
        className="flex min-h-[48px] items-center rounded-lg px-3 py-3 text-base font-medium text-[var(--ga-cyan)] touch-manipulation hover:bg-white/5"
        onClick={onNavigate}
      >
        My bookings
      </Link>
      <button
        type="button"
        className="flex min-h-[48px] w-full items-center rounded-lg px-3 py-3 text-left text-base text-zinc-400 touch-manipulation hover:bg-white/5"
        onClick={() => void logout()}
      >
        Log out
      </button>
    </>
  );
}
