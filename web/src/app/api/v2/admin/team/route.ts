import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

/** Staff with access to a store (for shift assignment pickers). */
export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  const links = await prisma.adminUserStore.findMany({
    where: { storeId },
    include: {
      adminUser: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
    },
  });
  const admins = links.map((l) => ({
    id: l.adminUser.id,
    name: l.adminUser.name,
    email: l.adminUser.email,
    role: l.adminUser.role.name,
  }));
  return NextResponse.json({ admins });
}
