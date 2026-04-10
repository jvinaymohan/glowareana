import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { canManageArenaGames } from "@/lib/platform/admin-capabilities";
import { assertStoreAccess } from "@/lib/platform/rbac";
import { MAX_ARENA_GAMES } from "@/lib/platform/arena-games";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  if (!canManageArenaGames(auth.admin.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, game.storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const nextActive = body.isActive !== undefined ? Boolean(body.isActive) : game.isActive;
    if (nextActive && !game.isActive) {
      const activeOthers = await prisma.game.count({
        where: { storeId: game.storeId, isActive: true, id: { not: game.id } },
      });
      if (activeOthers >= MAX_ARENA_GAMES) {
        return NextResponse.json(
          {
            error: `This arena already has ${MAX_ARENA_GAMES} active games. Deactivate one first.`,
          },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.game.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).slice(0, 120) } : {}),
        ...(body.basePrice !== undefined ? { basePrice: Math.max(0, Math.round(Number(body.basePrice))) } : {}),
        ...(body.maxPerSlot !== undefined
          ? { maxPerSlot: Math.max(1, Math.round(Number(body.maxPerSlot))) }
          : {}),
        ...(body.durationMin !== undefined
          ? { durationMin: Math.max(5, Math.round(Number(body.durationMin))) }
          : {}),
        ...(body.ageMin !== undefined ? { ageMin: Math.max(0, Math.round(Number(body.ageMin))) } : {}),
        ...(body.ageMax !== undefined ? { ageMax: Math.max(0, Math.round(Number(body.ageMax))) } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: Math.round(Number(body.sortOrder)) } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        lastModifiedBy: auth.admin.id,
      },
    });
    return NextResponse.json({ game: updated });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
