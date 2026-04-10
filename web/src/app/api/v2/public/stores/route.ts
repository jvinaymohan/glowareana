import { NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";

/** Public list of active stores for booking UIs (ids are not secret). */
export async function GET() {
  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, timezone: true, currency: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json({ stores });
}
