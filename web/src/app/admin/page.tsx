import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Admin — bookings & revenue",
  description: `Operations dashboard for ${site.name}`,
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
