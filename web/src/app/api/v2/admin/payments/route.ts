import { NextRequest, NextResponse } from "next/server";
import { addPayment } from "@/lib/platform/services/reservations";
import { requirePlatformAdmin } from "@/lib/platform/guards";

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const linesRaw = body.lineItems;
    const lineItems = Array.isArray(linesRaw)
      ? linesRaw.map((row) => {
          const r = row as Record<string, unknown>;
          return {
            description: String(r.description ?? "Item"),
            quantity: Number(r.quantity ?? 1),
            unitAmount: Number(r.unitAmount ?? 0),
          };
        })
      : undefined;

    const result = await addPayment({
      actorId: auth.admin.id,
      role: auth.admin.role,
      storeIds: auth.admin.storeIds,
      reservationId: String(body.reservationId ?? ""),
      amount: Number(body.amount ?? 0),
      method: body.method ? String(body.method) : undefined,
      type: body.type === "REFUND" ? "REFUND" : body.type === "ADJUSTMENT" ? "ADJUSTMENT" : "CHARGE",
      status: body.status === "PENDING" ? "PENDING" : body.status === "PARTIAL" ? "PARTIAL" : body.status === "REFUNDED" ? "REFUNDED" : "PAID",
      note: body.note ? String(body.note) : undefined,
      lineItems,
      idempotencyKey:
        request.headers.get("idempotency-key") ??
        (body.idempotencyKey ? String(body.idempotencyKey) : undefined),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
