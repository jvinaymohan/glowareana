import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createBirthdayPartyRequest,
  readStore,
  setBirthdayPartyPublicSlotHold,
  type CreateBirthdayPartyInput,
} from "@/lib/arena-store";
import type { ComboSize } from "@/lib/combos";
import {
  allowBirthdayMutation,
  clientKeyFromRequest,
} from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  const store = readStore();
  function rowDate(r: (typeof store.birthdayRequests)[0]) {
    if (r.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(r.preferredDate)) {
      return r.preferredDate;
    }
    return r.createdAt.slice(0, 10);
  }
  let list = [...store.birthdayRequests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  if (from) list = list.filter((r) => rowDate(r) >= from);
  if (to) list = list.filter((r) => rowDate(r) <= to);
  return NextResponse.json({ requests: list });
}

export async function POST(request: NextRequest) {
  const key = clientKeyFromRequest(request);
  if (!allowBirthdayMutation(key)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const comboSize = Number(body.comboSize) as ComboSize;
    const input: CreateBirthdayPartyInput = {
      kidCount: Number(body.kidCount),
      comboSize,
      gameSlugs: Array.isArray(body.gameSlugs)
        ? (body.gameSlugs as unknown[]).map(String)
        : [],
      returnGifts: Boolean(body.returnGifts),
      customerName: String(body.customerName ?? ""),
      phone: String(body.phone ?? ""),
      email: String(body.email ?? ""),
      preferredDate: String(body.preferredDate ?? ""),
      notes: String(body.notes ?? ""),
      reserveVenueForPublicBooking:
        body.reserveVenueForPublicBooking === undefined
          ? undefined
          : Boolean(body.reserveVenueForPublicBooking),
    };
    const result = createBirthdayPartyRequest(input);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ request: result.request });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const blocksPublicSlots = Boolean(body.blocksPublicSlots);
    const result = setBirthdayPartyPublicSlotHold(id, blocksPublicSlots);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
