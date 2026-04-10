import { createHmac, timingSafeEqual } from "node:crypto";
import { BookingLifecycle, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature.trim());
}

type RazorpayPayload = {
  event?: string;
  created_at?: number;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        notes?: { reservationId?: string };
      };
    };
  };
};

export async function processRazorpayWebhook(eventId: string, rawBody: string, data: RazorpayPayload) {
  const eventType = data.event ?? "unknown";
  const entity = data.payload?.payment?.entity;
  const reservationId = entity?.notes?.reservationId ?? null;
  const razorpayPaymentId = entity?.id ?? null;
  const amount = Math.max(0, Math.round((entity?.amount ?? 0) / 100));
  const currency = (entity?.currency ?? "INR").toUpperCase();
  const status = (entity?.status ?? "").toLowerCase();

  try {
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: "razorpay",
        eventId,
        eventType,
        reservationId,
        payloadJson: rawBody,
        createdBy: "webhook",
      },
    });
  } catch {
    return { ok: true as const, duplicate: true };
  }

  if (!reservationId || !razorpayPaymentId || amount <= 0) {
    await prisma.paymentWebhookEvent.update({
      where: { eventId },
      data: { processingError: "Missing reservationId/paymentId/amount" },
    });
    return { ok: false as const, error: "Malformed payload" };
  }

  const captured = status === "captured" || eventType === "payment.captured";
  if (!captured) {
    await prisma.paymentWebhookEvent.update({
      where: { eventId },
      data: { processingError: `Ignored event status ${status}` },
    });
    return { ok: true as const, ignored: true };
  }

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) {
      await tx.paymentWebhookEvent.update({
        where: { eventId },
        data: { processingError: "Reservation not found" },
      });
      return { ok: false as const, error: "Reservation not found" };
    }
    const balanceInr = Math.max(0, Math.round(reservation.balanceAmount));
    if (amount > balanceInr + 1) {
      await tx.paymentWebhookEvent.update({
        where: { eventId },
        data: { processingError: `Amount ${amount} exceeds balance ${balanceInr}` },
      });
      return { ok: false as const, error: "Payment amount exceeds open balance" };
    }
    const existingPayment = await tx.payment.findFirst({ where: { razorpayPaymentId } });
    if (existingPayment) {
      await tx.paymentWebhookEvent.update({
        where: { eventId },
        data: { paymentId: existingPayment.id, processedAt: new Date() },
      });
      return { ok: true as const, duplicatePayment: true };
    }
    const payment = await tx.payment.create({
      data: {
        reservationId: reservation.id,
        storeId: reservation.storeId,
        type: "CHARGE",
        status: PaymentStatus.PAID,
        amount,
        currency,
        method: "razorpay",
        razorpayPaymentId,
        externalRef: eventId,
        capturedAt: new Date((data.created_at ?? Math.floor(Date.now() / 1000)) * 1000),
        paidAt: new Date(),
        createdBy: "webhook",
      },
    });
    const paidAmount = reservation.paidAmount + amount;
    const balanceAmount = Math.max(0, reservation.totalAmount - paidAmount);
    const nextPaymentStatus =
      paidAmount <= 0 ? PaymentStatus.PENDING : balanceAmount > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PAID;
    await tx.reservation.update({
      where: { id: reservation.id },
      data: {
        paidAmount,
        balanceAmount,
        paymentStatus: nextPaymentStatus,
        lifecycle: nextPaymentStatus === PaymentStatus.PAID ? BookingLifecycle.PAID : reservation.lifecycle,
        updatedBy: "webhook",
      },
    });
    await tx.paymentWebhookEvent.update({
      where: { eventId },
      data: { paymentId: payment.id, processedAt: new Date() },
    });
    return { ok: true as const, paymentId: payment.id };
  });

  return result;
}
