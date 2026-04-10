import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `Terms of use for ${site.name} bookings and venue entry.`,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="text-[var(--ga-cyan)] hover:underline">
          Home
        </Link>
        {" / "}
        <span className="text-zinc-400">Terms</span>
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Terms of use
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-zinc-400">
        These terms apply when you book or visit {site.name} (“we”, “us”) at{" "}
        {site.address}. They are a concise starting point — replace with counsel-approved
        text before large campaigns.
      </p>
      <ul className="mt-8 list-disc space-y-3 pl-5 text-sm text-zinc-300">
        <li>
          <strong className="text-zinc-200">Bookings</strong> — Slots are subject to
          availability. You receive a reference by SMS/email when confirmations are
          enabled. Misstated contact details may delay support.
        </li>
        <li>
          <strong className="text-zinc-200">Conduct</strong> — Follow staff
          instructions, age rules per game, and posted safety rules. We may refuse
          entry or stop play for unsafe behaviour.
        </li>
        <li>
          <strong className="text-zinc-200">Liability</strong> — Participation in
          physical activities carries inherent risk. You accept our waiver process
          before play. We limit liability to the extent permitted by law.
        </li>
        <li>
          <strong className="text-zinc-200">Changes</strong> — We may update these
          terms; continued use after notice means acceptance.
        </li>
      </ul>
    </div>
  );
}
