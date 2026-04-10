import { NextRequest, NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/platform/guards";
import { createRazorpayOrderForReservation } from "@/lib/platform/services/razorpay-orders";

/**
 * POST body: { reservationId: string }
 * Returns Razorpay order id + key id for Checkout.js / hosted flow (amount from DB only).
 */
export async function POST(request: NextRequest) {
  const auth = await requirePlatformUser();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const reservationId = String(body.reservationId ?? "").trim();
    if (!reservationId) {
      return NextResponse.json({ error: "reservationId required" }, { status: 400 });
    }
    const result = await createRazorpayOrderForReservation({
      reservationId,
      userId: auth.user.id,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      orderId: result.orderId,
      amountPaise: result.amountPaise,
      currency: result.currency,
      keyId: result.keyId,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
