import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasValidAdminSessionCookie } from "@/lib/admin-session";
import { safeAdminNext, safeLegacyAdminNext } from "@/lib/admin-login-redirect";
import { getPlatformAdminSession } from "@/lib/platform/sessions";
import { site } from "@/lib/site";
import { AdminLoginClient } from "./AdminLoginClient";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: `Sign in to the ${site.name} operations dashboard.`,
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const { next: nextRaw } = await searchParams;
  const secret = process.env.ADMIN_SECRET?.trim();

  const platformSession = await getPlatformAdminSession();
  if (platformSession) {
    redirect(safeAdminNext(nextRaw, "/platform/admin"));
  }

  if (secret && (await hasValidAdminSessionCookie())) {
    const intended = safeAdminNext(nextRaw, "/admin");
    if (intended.startsWith("/platform/admin")) {
      // Legacy cookie is not enough for platform routes — show login for team sign-in.
    } else {
      redirect(safeLegacyAdminNext(nextRaw, "/admin"));
    }
  }

  return <AdminLoginClient legacyLoginEnabled={Boolean(secret)} nextParam={nextRaw ?? null} />;
}
