import type { Metadata } from "next";
import { BookingPrototype } from "@/components/BookingPrototype";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a session",
  description: `Book ${site.name} — select games, time slots, and pay online (prototype flow).`,
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-lava)]">
        Booking prototype
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
        Lock your slot
      </h1>
      <p className="mt-4 text-zinc-400">
        This flow demonstrates UX only — no payments or emails are sent. Next
        step: wire Razorpay, inventory rules, and confirmation webhooks.
      </p>
      <div className="mt-10">
        <BookingPrototype initialGameSlug={game} />
      </div>
    </div>
  );
}
