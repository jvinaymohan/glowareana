import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth-session";
import { verifyUserLogin } from "@/lib/arena-store";
import { allowAuthAttempt, clientKeyFromRequest } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const key = clientKeyFromRequest(request);
  if (!allowAuthAttempt(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const identifier = String(body.identifier ?? "").trim();
    const password = String(body.password ?? "");
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email or phone and password are required" },
        { status: 400 },
      );
    }

    const result = await verifyUserLogin(identifier, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    try {
      await setSessionCookie(result.user.id);
    } catch {
      return NextResponse.json(
        {
          error:
            "Server authentication is not configured. Set AUTH_SECRET in the environment.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        phone: result.user.phone,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
