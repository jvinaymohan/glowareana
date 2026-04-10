import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { addBlock, readStore, removeBlock } from "@/lib/arena-store";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  const store = readStore();
  let blocks = [...store.blocks].sort((a, b) =>
    a.date === b.date ? a.slotKey.localeCompare(b.slotKey) : a.date.localeCompare(b.date),
  );
  if (from) blocks = blocks.filter((b) => b.date >= from);
  if (to) blocks = blocks.filter((b) => b.date <= to);
  return NextResponse.json({ blocks });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = addBlock({
      date: String(body.date ?? ""),
      gameSlug: String(body.gameSlug ?? ""),
      slotKey: String(body.slotKey ?? ""),
      note: String(body.note ?? ""),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ block: result.block });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const ok = removeBlock(id);
  if (!ok) return NextResponse.json({ error: "Block not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
