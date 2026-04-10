import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertReportRangeOk } from "@/lib/platform/list-params";
import { assertStoreAccess } from "@/lib/platform/rbac";
import { prisma } from "@/lib/platform/prisma";

function esc(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
  return s;
}

function toCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const out = [headers.join(",")];
  rows.forEach((row) => {
    out.push(headers.map((h) => esc(row[h])).join(","));
  });
  return `${out.join("\n")}\n`;
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const type = request.nextUrl.searchParams.get("type") ?? "bookings";
  const storeId = request.nextUrl.searchParams.get("storeId");
  const from = new Date(request.nextUrl.searchParams.get("from") ?? Date.now() - 7 * 86400000);
  const to = new Date(request.nextUrl.searchParams.get("to") ?? Date.now());
  const rangeOk = assertReportRangeOk(from, to, 400);
  if (!rangeOk.ok) {
    return NextResponse.json({ error: rangeOk.error }, { status: 400 });
  }
  if (storeId) {
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  }
  const storeWhere =
    auth.admin.role === "OWNER"
      ? storeId
        ? { storeId }
        : {}
      : storeId
        ? { storeId }
        : { storeId: { in: auth.admin.storeIds } };

  let csv = "";
  let file = "report.csv";
  if (type === "bookings") {
    const rows = await prisma.reservation.findMany({
      where: { ...storeWhere, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        reference: true,
        storeId: true,
        bookingType: true,
        bookingChannel: true,
        participantCount: true,
        status: true,
        lifecycle: true,
        totalAmount: true,
        paidAmount: true,
        balanceAmount: true,
        gstAmount: true,
        invoiceRef: true,
        startAt: true,
      },
    });
    const normalized = rows.map((r) => ({ ...r, startAt: r.startAt.toISOString() }));
    csv = toCsv(
      [
        "id",
        "reference",
        "storeId",
        "bookingType",
        "bookingChannel",
        "participantCount",
        "status",
        "lifecycle",
        "totalAmount",
        "paidAmount",
        "balanceAmount",
        "gstAmount",
        "invoiceRef",
        "startAt",
      ],
      normalized as Array<Record<string, unknown>>,
    );
    file = "bookings.csv";
  } else if (type === "payments") {
    const rows = await prisma.payment.findMany({
      where: { ...storeWhere, paidAt: { gte: from, lte: to } },
      orderBy: { paidAt: "asc" },
      select: {
        id: true,
        reservationId: true,
        storeId: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        method: true,
        razorpayPaymentId: true,
        externalRef: true,
        capturedAt: true,
        paidAt: true,
      },
    });
    const normalized = rows.map((r) => ({
      ...r,
      capturedAt: r.capturedAt?.toISOString() ?? "",
      paidAt: r.paidAt?.toISOString() ?? "",
    }));
    csv = toCsv(
      [
        "id",
        "reservationId",
        "storeId",
        "type",
        "status",
        "amount",
        "currency",
        "method",
        "razorpayPaymentId",
        "externalRef",
        "capturedAt",
        "paidAt",
      ],
      normalized as Array<Record<string, unknown>>,
    );
    file = "payments.csv";
  } else if (type === "promo") {
    const rows = await prisma.promotionUsage.findMany({
      where: { ...storeWhere, usedAt: { gte: from, lte: to } },
      orderBy: { usedAt: "asc" },
      select: {
        id: true,
        promotionId: true,
        reservationId: true,
        storeId: true,
        discountAmount: true,
        usedAt: true,
      },
    });
    const normalized = rows.map((r) => ({ ...r, usedAt: r.usedAt.toISOString() }));
    csv = toCsv(
      ["id", "promotionId", "reservationId", "storeId", "discountAmount", "usedAt"],
      normalized as Array<Record<string, unknown>>,
    );
    file = "promo-usage.csv";
  } else {
    return NextResponse.json({ error: "Unsupported export type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
