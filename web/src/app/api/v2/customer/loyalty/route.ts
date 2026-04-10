import { NextRequest, NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/platform/guards";
import { getLoyaltySummaryForUser } from "@/lib/platform/services/loyalty";

export async function GET(request: NextRequest) {
  const auth = await requirePlatformUser();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId?.trim()) {
    return NextResponse.json({ error: "storeId query required" }, { status: 400 });
  }
  const summary = await getLoyaltySummaryForUser(auth.user.id, storeId.trim());
  return NextResponse.json({
    loyalty: summary,
    gamification: {
      punchCardSlots: 10,
      message:
        "Each completed visit (check-out) adds a punch. Fill the card for a 10% off coupon!",
    },
  });
}
