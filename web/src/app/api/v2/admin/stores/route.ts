import { NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;

  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      ...(auth.admin.role === "OWNER"
        ? {}
        : { id: { in: auth.admin.storeIds } }),
    },
    select: { id: true, code: true, name: true, timezone: true, currency: true },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({ stores });
}
