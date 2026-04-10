import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  processRazorpayWebhook,
  verifyRazorpayWebhookSignature,
} from "@/lib/platform/services/payments";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    createHash("sha256").update(rawBody).digest("hex");
  const result = await processRazorpayWebhook(
    eventId,
    rawBody,
    payload as Parameters<typeof processRazorpayWebhook>[2],
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
