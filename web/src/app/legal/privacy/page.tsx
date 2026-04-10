import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `How ${site.name} handles contact and booking data.`,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="text-[var(--ga-cyan)] hover:underline">
          Home
        </Link>
        {" / "}
        <span className="text-zinc-400">Privacy</span>
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Privacy
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-zinc-400">
        {site.name} uses the details you provide at booking (name, phone, email) to
        confirm your visit, send SMS/email updates where enabled, and operate our
        booking records. This page is a lean placeholder — add DPO contact, retention,
        processors (e.g. Resend, Twilio), and India DPDP clauses with legal review.
      </p>
      <ul className="mt-8 list-disc space-y-3 pl-5 text-sm text-zinc-300">
        <li>We do not sell personal data.</li>
        <li>
          Messages go through configured providers; delivery depends on correct phone
          and email.
        </li>
        <li>
          For access or deletion requests, contact us at{" "}
          <a className="text-[var(--ga-cyan)] hover:underline" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          .
        </li>
      </ul>
    </div>
  );
}
