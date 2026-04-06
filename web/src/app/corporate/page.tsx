import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corporate & group events",
  description: `Team building and group events at ${site.name}, Koramangala — facilitated arena games and private slots.`,
};

export default function CorporatePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--ga-blue)]">
        Teams & groups
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
        Offsites that actually get people talking
      </h1>
      <p className="mt-4 max-w-2xl text-zinc-400">
        Structured team formats, private arena windows, and group pricing for
        startups, schools, and enterprise teams visiting Bangalore.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Team-building sprint",
            body: "Facilitated relays, bracket-style battles, debrief with your host.",
            tag: "90–120 min",
          },
          {
            title: "Group discounts",
            body: "Tiered pricing from 15+ guests — combine games for a arena crawl.",
            tag: "15–120 pax",
          },
          {
            title: "Custom run-of-show",
            body: "Brand moments on LED, catering partners, trophies — we co-design.",
            tag: "On quote",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ga-blue)]">
              {c.tag}
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-lg font-bold text-white">
              {c.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/book"
          className="rounded-full bg-gradient-to-r from-[var(--ga-lava)] to-[var(--ga-orange)] px-6 py-3 text-sm font-semibold text-[#0b0b12]"
        >
          Hold a slot
        </Link>
        <a
          href={`https://wa.me/${site.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-[#25D366]/40 px-6 py-3 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/10"
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
        <div className="mt-6 max-w-xl">
          <LeadForm context="Corporate / group" submitLabel="Send to sales" />
        </div>
      </section>
    </div>
  );
}
