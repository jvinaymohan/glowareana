import { NextRequest, NextResponse } from "next/server";
import { userLogin } from "@/lib/platform/auth";
import { setPlatformUserSession } from "@/lib/platform/sessions";
import { allowAuthAttempt, clientKeyFromRequest } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const key = clientKeyFromRequest(request);
  if (!allowAuthAttempt(key)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }
    const login = await userLogin({ email, password });
    if (!login.ok) {
      return NextResponse.json({ error: login.error }, { status: 401 });
    }
    await setPlatformUserSession(login.user.id);
    return NextResponse.json({ user: login.user });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
