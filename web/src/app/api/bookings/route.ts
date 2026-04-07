import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth-session";
import { requireAdmin } from "@/lib/admin-auth";
import { createBooking, readStore } from "@/lib/arena-store";
import { deliverBookingNotifications } from "@/lib/booking-notify";
import { requireEmailForAuth } from "@/lib/input-validation";
import {
  allowBookingMutation,
  clientKeyFromRequest,
} from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  const game = request.nextUrl.searchParams.get("game") ?? "";

  const store = readStore();
  let list = [...store.bookings].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
  if (from) list = list.filter((b) => b.date >= from);
  if (to) list = list.filter((b) => b.date <= to);
  if (game) list = list.filter((b) => b.gameSlug === game);

  return NextResponse.json({ bookings: list });
}

export async function POST(request: NextRequest) {
  const key = clientKeyFromRequest(request);
  if (!allowBookingMutation(key)) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sessionUserId = await getSessionUserId();
    const notifyEmail =
      body.notifyEmail === undefined ? true : Boolean(body.notifyEmail);
    const notifySms =
      body.notifySms === undefined ? true : Boolean(body.notifySms);

    const emailRaw = String(body.email ?? "");
    let emailForBooking = emailRaw;
    if (notifyEmail) {
      const emailRes = requireEmailForAuth(emailRaw);
      if (!emailRes.ok) {
        return NextResponse.json({ error: emailRes.error }, { status: 400 });
      }
      emailForBooking = emailRes.value;
    }

    const result = createBooking({
      gameSlug: String(body.gameSlug ?? ""),
      date: String(body.date ?? ""),
      slotKey: String(body.slotKey ?? ""),
      kidCount: Number(body.kidCount),
      couponCode: body.couponCode ? String(body.couponCode) : null,
      customerName: String(body.customerName ?? ""),
      phone: String(body.phone ?? ""),
      email: emailForBooking,
      userId: sessionUserId ?? null,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const notifications = await deliverBookingNotifications(result.booking, {
      email: notifyEmail,
      sms: notifySms,
    });
    return NextResponse.json({ booking: result.booking, notifications });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
