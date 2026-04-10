import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform/guards";

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  return NextResponse.json({ admin: auth.admin });
}
