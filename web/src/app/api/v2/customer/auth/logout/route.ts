import { NextResponse } from "next/server";
import { clearPlatformUserSession } from "@/lib/platform/sessions";

export async function POST() {
  await clearPlatformUserSession();
  return NextResponse.json({ ok: true });
}
