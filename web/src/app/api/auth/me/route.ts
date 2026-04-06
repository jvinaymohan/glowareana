import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth-session";
import { readStore } from "@/lib/arena-store";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null });
  }
  const store = readStore();
  const u = store.users.find((x) => x.id === userId);
  if (!u) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: { id: u.id, email: u.email, phone: u.phone },
  });
}
