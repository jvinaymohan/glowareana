import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/lib/admin-session";
import { allowAuthAttempt, clientKeyFromRequest } from "@/lib/rate-limit";

function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Admin login is only available when ADMIN_SECRET is set." },
      { status: 400 },
    );
  }

  const key = clientKeyFromRequest(request);
  if (!allowAuthAttempt(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const password = String(body.password ?? "");
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    if (!safeEqualString(password, secret)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    try {
      await setAdminSessionCookie();
    } catch {
      return NextResponse.json(
        {
          error:
            "Server cannot issue admin session. Set AUTH_SECRET in the environment.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
