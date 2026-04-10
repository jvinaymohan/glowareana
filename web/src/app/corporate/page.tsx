import type { Metadata } from "next";
import Link from "next/link";
import { BookNowLink } from "@/components/BookNowLink";
import { FlowContactBar } from "@/components/FlowContactBar";
import { LeadForm } from "@/components/LeadForm";
import { VisitMini } from "@/components/VisitMini";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corporate & group events",
  description: `Team building and group events at ${site.name}, Koramangala — facilitated arena games and private slots.`,
};

const PACKAGES = [
  {
    title: "Sprint standoff",
    price: "From ₹12,000",
    detail: "Up to 15 pax · 90 min facilitated games + debrief",
    tag: "90 min",
  },
  {
    title: "Arena crawl",
    price: "From ₹25,000",
    detail: "16–40 pax · multi-game rotation with hosts",
    tag: "Half day",
  },
  {
    title: "Full buyout",
    price: "On quote",
    detail: "40–120 pax · private windows, catering intros, trophies",
    tag: "Custom",
  },
];

export default function CorporatePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-blue)]">
        Teams & groups
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-white sm:text-4xl">
        Offsites that actually get people talking
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
        Structured team formats, private arena windows, and clear per-package
        starting points. Office admins can WhatsApp us for PO and vendor
        formalities.
      </p>

      <FlowContactBar source="corporate_top" className="mt-8" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="grid gap-6 md:grid-cols-3">
          {PACKAGES.map((c) => (
            <div
              key={c.title}
              className="flex flex-col rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ga-blue)]">
                {c.tag}
              </span>
              <h2 className="mt-3 font-[family-name:var(--font-syne)] text-lg font-bold text-white">
                {c.title}
              </h2>
              <p className="mt-2 text-lg font-semibold text-[var(--ga-orange)]">
                {c.price}
              </p>
              <p className="mt-2 flex-1 text-sm text-zinc-400">{c.detail}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/contact"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
                >
                  Enquire
                </Link>
                <BookNowLink
                  source={`corporate_${c.title}`}
                  className="ga-btn-neon inline-flex min-h-[44px] items-center justify-center rounded-full py-2.5 text-sm font-semibold touch-manipulation"
                />
              </div>
            </div>
          ))}
        </div>
        <VisitMini source="corporate_sidebar" className="h-fit lg:sticky lg:top-24" />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href={`https://wa.me/${site.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#25D366]/40 px-6 py-3 text-sm font-semibold text-[#25D366] touch-manipulation hover:bg-[#25D366]/10"
        >
          WhatsApp sales
        </a>
      </div>

      <section className="mt-20 rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6 sm:p-10">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Corporate enquiry
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Share company, preferred dates, headcount, and any compliance needs.
        </p>
        <FlowContactBar source="corporate_form" className="mt-6" />
        <div className="mt-6 max-w-xl">
          <LeadForm context="Corporate / group" submitLabel="Send to sales" />
        </div>
      </section>
    </div>
  );
}
