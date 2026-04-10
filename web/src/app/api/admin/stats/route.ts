import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { computeStats, readStore } from "@/lib/arena-store";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const from =
    request.nextUrl.searchParams.get("from") ??
    new Date().toISOString().slice(0, 10);
  const to =
    request.nextUrl.searchParams.get("to") ??
    new Date().toISOString().slice(0, 10);

  const store = readStore();
  const stats = computeStats(store, from, to);
  return NextResponse.json({ from, to, ...stats });
}
