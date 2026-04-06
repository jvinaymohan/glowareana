import { NextRequest, NextResponse } from "next/server";
import {
  computeSlotAvailability,
  isDateHeldForBirthdayParty,
  readStore,
} from "@/lib/arena-store";

export async function GET(request: NextRequest) {
  const gameSlug = request.nextUrl.searchParams.get("game");
  const date = request.nextUrl.searchParams.get("date");
  if (!gameSlug || !date) {
    return NextResponse.json(
      { error: "Missing game or date query params" },
      { status: 400 },
    );
  }
  const store = readStore();
  const birthdayPartyHold = isDateHeldForBirthdayParty(store, date);
  const slots = computeSlotAvailability(store, gameSlug, date);
  const open = slots.filter((s) => s.available).length;
  return NextResponse.json({
    slots,
    availableCount: open,
    totalSlots: slots.length,
    birthdayPartyHold,
  });
}
