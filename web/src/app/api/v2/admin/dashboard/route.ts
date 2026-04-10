import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { getDashboardSummary } from "@/lib/platform/services/admin";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId") ?? undefined;
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
  const toDate = to ? new Date(to) : new Date(new Date().setHours(23, 59, 59, 999));
  const summary = await getDashboardSummary({
    role: auth.admin.role,
    storeIds: auth.admin.storeIds,
    storeId,
    from: fromDate,
    to: toDate,
  });
  return NextResponse.json(summary);
}
