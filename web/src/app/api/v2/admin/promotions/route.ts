import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { createPromotion } from "@/lib/platform/services/admin";

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createPromotion({
      actorId: auth.admin.id,
      role: auth.admin.role,
      storeIds: auth.admin.storeIds,
      storeId: body.storeId ? String(body.storeId) : null,
      name: String(body.name ?? ""),
      startAt: String(body.startAt ?? ""),
      endAt: String(body.endAt ?? ""),
      eligibilityRule: body.eligibilityRule ? String(body.eligibilityRule) : "",
      discountRule: String(body.discountRule ?? ""),
      description: body.description ? String(body.description) : "",
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ promotion: result.promotion });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
