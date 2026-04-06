import { NextResponse } from "next/server";

/** When `ADMIN_SECRET` is unset, admin APIs stay open (dev only). Set in `.env.local` for production. */
export function requireAdmin(request: Request): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  const key =
    request.headers.get("x-admin-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
