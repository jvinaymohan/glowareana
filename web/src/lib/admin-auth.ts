import { NextResponse } from "next/server";

/**
 * When `ADMIN_SECRET` is unset in development, admin APIs stay open.
 * In production, `ADMIN_SECRET` is required or every admin route returns 503.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const secret = process.env.ADMIN_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!secret) {
      return NextResponse.json(
        {
          error:
            "Admin API disabled: set ADMIN_SECRET in the server environment.",
        },
        { status: 503 },
      );
    }
  }

  if (!secret) return null;
  const key =
    request.headers.get("x-admin-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (key !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
