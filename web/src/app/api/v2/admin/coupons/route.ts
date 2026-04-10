import { DiscountType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { createCoupon } from "@/lib/platform/services/admin";

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createCoupon({
      actorId: auth.admin.id,
      role: auth.admin.role,
      storeIds: auth.admin.storeIds,
      storeId: body.storeId ? String(body.storeId) : null,
      code: String(body.code ?? ""),
      discountType: body.discountType === "FIXED" ? DiscountType.FIXED : DiscountType.PERCENT,
      discountValue: Number(body.discountValue ?? 0),
      maxDiscountAmount: body.maxDiscountAmount == null ? null : Number(body.maxDiscountAmount),
      expiresAt: body.expiresAt ? String(body.expiresAt) : null,
      usageLimit: body.usageLimit == null ? null : Number(body.usageLimit),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ coupon: result.coupon });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
