import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth-session";
import { listBookingsForUser } from "@/lib/arena-store";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bookings = listBookingsForUser(userId);
  return NextResponse.json({ bookings });
}
