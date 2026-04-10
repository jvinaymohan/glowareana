import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { MAX_ARENA_GAMES } from "@/lib/platform/arena-games";
import { assertStoreAccess } from "@/lib/platform/rbac";

/** Games for an arena (store), ordered for admin editing. */
export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  const games = await prisma.game.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const activeCount = games.filter((g) => g.isActive).length;
  return NextResponse.json({
    games,
    maxGames: MAX_ARENA_GAMES,
    activeCount,
    hint: `Each arena supports up to ${MAX_ARENA_GAMES} active games; deactivate one before activating another.`,
  });
}
