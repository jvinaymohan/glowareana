import { NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/platform/guards";

export async function GET() {
  const auth = await requirePlatformUser();
  if (auth.denied) return auth.denied;
  return NextResponse.json({ user: auth.user });
}
