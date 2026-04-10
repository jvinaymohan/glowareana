import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertReportRangeOk } from "@/lib/platform/list-params";
import { assertStoreAccess } from "@/lib/platform/rbac";
import { getAdminReportSummary } from "@/lib/platform/report-data";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  const from = new Date(request.nextUrl.searchParams.get("from") ?? Date.now() - 7 * 86400000);
  const to = new Date(request.nextUrl.searchParams.get("to") ?? Date.now());
  const rangeOk = assertReportRangeOk(from, to, 120);
  if (!rangeOk.ok) {
    return NextResponse.json({ error: rangeOk.error }, { status: 400 });
  }
  if (storeId) {
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const data = await getAdminReportSummary({
    role: auth.admin.role,
    storeIds: auth.admin.storeIds,
    storeId: storeId ?? null,
    from,
    to,
  });

  const {
    reservations: _omitRes,
    payments: _omitPay,
    expenses: _omitExp,
    ...json
  } = data;
  void _omitRes;
  void _omitPay;
  void _omitExp;
  return NextResponse.json({
    ...json,
    filters: { ...json.filters, storeId: storeId ?? null },
    exportHint:
      "Full row-level exports: GET /api/v2/admin/reports/export?type=bookings|payments|promo (avoids multi-thousand-row JSON payloads). XLSX: /api/v2/admin/reports/export-xlsx",
  });
}
