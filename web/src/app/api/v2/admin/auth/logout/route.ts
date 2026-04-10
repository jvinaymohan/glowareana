import { NextResponse } from "next/server";
import { clearPlatformAdminSession } from "@/lib/platform/sessions";

export async function POST() {
  await clearPlatformAdminSession();
  return NextResponse.json({ ok: true });
}
