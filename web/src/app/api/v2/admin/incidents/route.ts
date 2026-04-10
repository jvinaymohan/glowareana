import { NextRequest, NextResponse } from "next/server";
import { IncidentSeverity } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

const SEV = new Set(Object.values(IncidentSeverity));

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
  const rows = await prisma.incident.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reportedBy: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ incidents: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const storeId = String(body.storeId ?? "");
    const title = String(body.title ?? "").trim().slice(0, 200);
    const description = String(body.description ?? "").trim().slice(0, 4000);
    if (!storeId || !title || !description) {
      return NextResponse.json({ error: "storeId, title, description required" }, { status: 400 });
    }
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
    const sev = String(body.severity ?? "MEDIUM");
    const row = await prisma.incident.create({
      data: {
        storeId,
        title,
        description,
        severity: SEV.has(sev as IncidentSeverity) ? (sev as IncidentSeverity) : "MEDIUM",
        reservationId: body.reservationId ? String(body.reservationId) : null,
        gameSlotId: body.gameSlotId ? String(body.gameSlotId) : null,
        reportedById: auth.admin.id,
      },
    });
    return NextResponse.json({ incident: row });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
