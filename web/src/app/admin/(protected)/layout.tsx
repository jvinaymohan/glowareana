import { redirect } from "next/navigation";
import { hasValidAdminSessionCookie } from "@/lib/admin-session";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return <>{children}</>;
  }
  if (!(await hasValidAdminSessionCookie())) {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
