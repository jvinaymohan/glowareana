import { prisma } from "@/lib/platform/prisma";

type CreateOrderResult =
  | { ok: true; orderId: string; amountPaise: number; currency: string; keyId: string }
  | { ok: false; error: string };

/**
 * Creates a Razorpay order for the unpaid balance on a reservation.
 * Amount is taken from DB (never from client).
 */
export async function createRazorpayOrderForReservation(input: {
  reservationId: string;
  userId: string;
}): Promise<CreateOrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    return { ok: false, error: "Razorpay is not configured" };
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: input.reservationId },
  });
  if (!reservation) return { ok: false, error: "Reservation not found" };
  if (reservation.userId !== input.userId) {
    return { ok: false, error: "Unauthorized" };
  }
  if (reservation.status === "CANCELLED") {
    return { ok: false, error: "Reservation is cancelled" };
  }
  const balance = Math.max(0, Math.round(reservation.balanceAmount));
  if (balance <= 0) {
    return { ok: false, error: "Nothing to pay" };
  }

  const amountPaise = balance * 100;
  if (amountPaise > 1_000_000_000) {
    return { ok: false, error: "Amount too large" };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const receipt = `${reservation.reference}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  const body = JSON.stringify({
    amount: amountPaise,
    currency: "INR",
    receipt: receipt || `rcpt_${reservation.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 28)}`,
    notes: {
      reservationId: reservation.id,
      reference: reservation.reference,
    },
    payment_capture: true,
  });

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: { description?: string; code?: string };
  };

  if (!res.ok || !json.id) {
    const msg = json.error?.description ?? json.error?.code ?? `Razorpay HTTP ${res.status}`;
    return { ok: false, error: msg };
  }

  return {
    ok: true,
    orderId: json.id,
    amountPaise,
    currency: "INR",
    keyId,
  };
}
