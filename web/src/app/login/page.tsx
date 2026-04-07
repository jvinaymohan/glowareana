import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountAuthClient } from "./AccountAuthClient";

export const metadata: Metadata = {
  title: "Sign in or create account",
  description:
    "Sign in to your Glow Arena account or register with email and phone.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="h-8 w-40 animate-pulse rounded bg-white/5" />
          <div className="mt-4 h-10 w-full animate-pulse rounded bg-white/5" />
        </div>
      }
    >
      <AccountAuthClient />
    </Suspense>
  );
}
