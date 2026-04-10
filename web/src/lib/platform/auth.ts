import bcrypt from "bcryptjs";
import { prisma } from "@/lib/platform/prisma";
import { validatePassword } from "@/lib/input-validation";

export async function adminLogin(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({
    where: { email },
    include: { role: true, stores: true },
  });
  if (!admin || !admin.isActive) return { ok: false as const, error: "Invalid credentials" };
  const match = await bcrypt.compare(input.password, admin.passwordHash);
  if (!match) return { ok: false as const, error: "Invalid credentials" };
  return {
    ok: true as const,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role.name,
      storeIds: admin.stores.map((s) => s.storeId),
    },
  };
}

export async function userLogin(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return { ok: false as const, error: "Invalid credentials" };
  const match = await bcrypt.compare(input.password, user.passwordHash);
  if (!match) return { ok: false as const, error: "Invalid credentials" };
  return {
    ok: true as const,
    user: { id: user.id, email: user.email, phone: user.phone, name: user.name },
  };
}

export async function userRegister(input: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const passwordCheck = validatePassword(input.password);
  if (!passwordCheck.ok) return { ok: false as const, error: passwordCheck.error };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, error: "Email already registered" };
  const passwordHash = await bcrypt.hash(passwordCheck.value, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name?.trim() || null,
      phone: input.phone?.trim() || null,
    },
  });
  return { ok: true as const, user };
}
