import { NextRequest, NextResponse } from "next/server";
import { adminLogin } from "@/lib/platform/auth";
import { setPlatformAdminSession } from "@/lib/platform/sessions";
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
    const login = await adminLogin({ email, password });
    if (!login.ok) {
      return NextResponse.json({ error: login.error }, { status: 401 });
    }
    await setPlatformAdminSession({
      adminUserId: login.admin.id,
      role: login.admin.role,
      storeIds: login.admin.storeIds,
    });
    return NextResponse.json({ admin: login.admin });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
