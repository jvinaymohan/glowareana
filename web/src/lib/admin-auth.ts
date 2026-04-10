import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/admin-session-jwt";

function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k !== name) continue;
    try {
      return decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      return part.slice(idx + 1).trim();
    }
  }
  return undefined;
}

async function adminSessionOk(request: Request): Promise<boolean> {
  const raw = cookieValue(request, ADMIN_SESSION_COOKIE_NAME);
  if (!raw) return false;
  return verifyAdminSessionToken(raw);
}

/**
 * When `ADMIN_SECRET` is unset in development, admin APIs stay open.
 * In production, `ADMIN_SECRET` is required or every admin route returns 503.
 *
 * When `ADMIN_SECRET` is set, accepts the secret via `x-admin-secret` / Bearer,
 * or a valid signed `glow_admin_session` cookie (from POST /api/admin/login).
 */
export async function requireAdmin(
  request: Request,
): Promise<NextResponse | null> {
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
  const headerKey =
    request.headers.get("x-admin-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (headerKey === secret) return null;
  if (await adminSessionOk(request)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
