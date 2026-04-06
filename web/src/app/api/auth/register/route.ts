import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth-session";
import {
  requireEmailForAuth,
  sanitizePhone,
  toCanonicalPhoneE164,
  validatePassword,
} from "@/lib/input-validation";
import { registerUser } from "@/lib/arena-store";
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
    const emailRes = requireEmailForAuth(String(body.email ?? ""));
    if (!emailRes.ok) {
      return NextResponse.json({ error: emailRes.error }, { status: 400 });
    }
    const phoneRes = sanitizePhone(String(body.phone ?? ""));
    if (!phoneRes.ok) {
      return NextResponse.json({ error: phoneRes.error }, { status: 400 });
    }
    const passRes = validatePassword(String(body.password ?? ""));
    if (!passRes.ok) {
      return NextResponse.json({ error: passRes.error }, { status: 400 });
    }

    const phoneE164 = toCanonicalPhoneE164(phoneRes.value);
    const result = await registerUser(
      emailRes.value,
      phoneE164,
      passRes.value,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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
