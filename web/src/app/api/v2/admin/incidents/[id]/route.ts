import { NextRequest, NextResponse } from "next/server";
import { IncidentSeverity } from "@prisma/client";
import { prisma } from "@/lib/platform/prisma";
import { requirePlatformAdmin } from "@/lib/platform/guards";
import { assertStoreAccess } from "@/lib/platform/rbac";

const SEV = new Set(Object.values(IncidentSeverity));

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requirePlatformAdmin();
  if (auth.denied) return auth.denied;
  const { id } = await ctx.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const row = await prisma.incident.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const access = assertStoreAccess(auth.admin.role, auth.admin.storeIds, row.storeId);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: 403 });
    const sev = body.severity ? String(body.severity) : undefined;
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        ...(body.title ? { title: String(body.title).slice(0, 200) } : {}),
        ...(body.description ? { description: String(body.description).slice(0, 4000) } : {}),
        ...(sev && SEV.has(sev as IncidentSeverity) ? { severity: sev as IncidentSeverity } : {}),
      },
    });
    return NextResponse.json({ incident: updated });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
