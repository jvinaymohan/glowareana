import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createBooking, readStore } from "@/lib/arena-store";
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
    const result = createBooking({
      gameSlug: String(body.gameSlug ?? ""),
      date: String(body.date ?? ""),
      slotKey: String(body.slotKey ?? ""),
      kidCount: Number(body.kidCount),
      couponCode: body.couponCode ? String(body.couponCode) : null,
      customerName: String(body.customerName ?? ""),
      phone: String(body.phone ?? ""),
      email: String(body.email ?? ""),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ booking: result.booking });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
