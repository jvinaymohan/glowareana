import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refunds & cancellations",
  description: `Cancellation and refund policy for ${site.name}.`,
  robots: { index: true, follow: true },
};

export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="text-[var(--ga-cyan)] hover:underline">
          Home
        </Link>
        {" / "}
        <span className="text-zinc-400">Refunds</span>
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Refunds & cancellations
      </h1>
      <ul className="mt-8 list-disc space-y-3 pl-5 text-sm text-zinc-300">
        <li>
          Cancellations <strong className="text-zinc-200">more than 24 hours</strong>{" "}
          before your scheduled slot may receive a full refund or venue credit,
          depending on how payment was collected.
        </li>
        <li>
          Cancellations inside 24 hours or <strong className="text-zinc-200">no-shows</strong>{" "}
          may be charged in full — we hold staff and arena time for your group.
        </li>
        <li>
          If we must cancel (maintenance, force majeure), we offer reschedule or
          refund at no charge.
        </li>
        <li>
          Rescheduling is subject to availability — WhatsApp or call{" "}
          <a className="text-[var(--ga-cyan)] hover:underline" href={`tel:${site.phone.replace(/\s/g, "")}`}>
            {site.phone}
          </a>{" "}
          with your booking reference.
        </li>
      </ul>
    </div>
  );
}
