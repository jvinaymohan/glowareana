import type { Metadata } from "next";
import { BookingFaq } from "@/components/BookingFaq";
import { BookingPrototype } from "@/components/BookingPrototype";
import { SiteLogo, SiteLogoLockup } from "@/components/SiteLogo";
import { BOOKING_FAQ_ITEMS } from "@/lib/faq-content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book now",
  description: `Book ${site.name} — pick a game, time slot, and confirm by SMS or email.`,
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <SiteLogoLockup className="w-fit shrink-0 self-center sm:self-start">
          <SiteLogo variant="compact" />
        </SiteLogoLockup>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-white sm:text-4xl">
            Book a session
          </h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {site.name}
          </p>
        </div>
      </div>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400">
        Pick a game and time, then add parent details. We send your{" "}
        <strong className="font-medium text-zinc-300">booking reference by email or SMS</strong>{" "}
        — easy to find on your phone. Sign in first if you want everything saved
        under one account.
      </p>
      <div className="mt-8 sm:mt-10">
        <BookingPrototype initialGameSlug={game} />
      </div>
      <div className="mt-14 border-t border-white/10 pt-12">
        <BookingFaq items={BOOKING_FAQ_ITEMS} />
      </div>
    </div>
  );
}
