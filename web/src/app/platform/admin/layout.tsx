import { PlatformAdminHeader } from "@/components/PlatformAdminHeader";

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      <PlatformAdminHeader />
      {children}
    </div>
  );
}
