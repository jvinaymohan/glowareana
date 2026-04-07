import type { Metadata } from "next";
import { AccountBookings } from "@/components/AccountBookings";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "My bookings",
  description: `View and reschedule ${site.name} reservations`,
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white sm:text-3xl">
        My bookings
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Each reservation is tied to your phone number in E.164 format (e.g.{" "}
        <span className="font-mono text-zinc-400">+919876543210</span>) for
        future WhatsApp confirmations.
      </p>
      <div className="mt-10">
        <AccountBookings />
      </div>
    </div>
  );
}
