import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
    occupancyRowCap: 24,
  });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 760;
  const line = (text: string, size = 11, bold = false) => {
    page.drawText(text, {
      x: 48,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.12),
    });
    y -= size + 6;
  };

  line("Glow Arena — Executive summary",18, true);
  line(
    `Period: ${data.filters.from.toISOString().slice(0, 10)} → ${data.filters.to.toISOString().slice(0, 10)}`,
    10,
  );
  if (data.filters.storeId) line(`Store filter: ${data.filters.storeId}`, 10);
  y -= 6;
  line("Key metrics", 13, true);
  for (const [k, v] of Object.entries(data.kpis)) {
    line(`${k}: ${typeof v === "number" ? v.toLocaleString() : v}`, 10);
  }
  y -= 6;
  line("Revenue by booking type", 13, true);
  for (const [k, v] of Object.entries(data.revenueByBookingType)) {
    line(`${k}: ₹${v.toLocaleString()}`, 10);
  }
  y -= 6;
  line("Occupancy sample (first buckets)", 13, true);
  for (const row of data.occupancyByDayTime.slice(0, 12)) {
    line(`${row.bucket}: ${row.sessions} sessions, ${row.participants} pax`, 9);
  }
  if (data.occupancyTruncated) {
    line("Note: occupancy truncated in PDF; use XLSX or CSV for full data.", 9);
  }

  const bytes = await pdf.save();
  const filename = `glow-arena-executive-${data.filters.from.toISOString().slice(0, 10)}.pdf`;
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
