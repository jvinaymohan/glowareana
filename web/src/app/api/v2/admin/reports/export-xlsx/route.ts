import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertReportRangeOk } from "@/lib/platform/list-params";
import { assertStoreAccess } from "@/lib/platform/rbac";
import { getAdminReportSummary } from "@/lib/platform/report-data";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  const from = new Date(request.nextUrl.searchParams.get("from") ?? Date.now() - 30 * 86400000);
  const to = new Date(request.nextUrl.searchParams.get("to") ?? Date.now());
  const rangeOk = assertReportRangeOk(from, to, 400);
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
    occupancyRowCap: 5000,
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Glow Arena";
  const sum = wb.addWorksheet("Summary");
  sum.addRow(["KPI", "Value"]);
  for (const [k, v] of Object.entries(data.kpis)) {
    sum.addRow([k, v]);
  }
  sum.getColumn(1).width = 28;
  sum.getColumn(2).width = 18;

  const mix = wb.addWorksheet("Revenue mix");
  mix.addRow(["Booking type", "Gross amount"]);
  for (const [k, v] of Object.entries(data.revenueByBookingType)) {
    mix.addRow([k, v]);
  }

  const occ = wb.addWorksheet("Occupancy");
  occ.addRow(["Bucket", "Sessions", "Participants"]);
  for (const row of data.occupancyByDayTime) {
    occ.addRow([row.bucket, row.sessions, row.participants]);
  }

  const book = wb.addWorksheet("Bookings");
  book.addRow([
    "reference",
    "status",
    "lifecycle",
    "bookingType",
    "participantCount",
    "totalAmount",
    "balanceAmount",
    "startAt",
    "endAt",
  ]);
  for (const r of data.reservations) {
    book.addRow([
      r.reference,
      r.status,
      r.lifecycle,
      r.bookingType,
      r.participantCount,
      r.totalAmount,
      r.balanceAmount,
      r.startAt.toISOString(),
      r.endAt.toISOString(),
    ]);
  }

  const pay = wb.addWorksheet("Payments");
  pay.addRow(["paidAt", "type", "amount", "method"]);
  for (const p of data.payments) {
    pay.addRow([
      p.paidAt ? p.paidAt.toISOString() : "",
      p.type,
      p.amount,
      p.method ?? "",
    ]);
  }

  const exp = wb.addWorksheet("Expenses");
  exp.addRow(["expenseDate", "category", "title", "amount"]);
  for (const e of data.expenses) {
    exp.addRow([e.expenseDate.toISOString(), e.category, e.title, e.amount]);
  }

  const buf = await wb.xlsx.writeBuffer();
  const filename = `glow-arena-report-${from.toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
