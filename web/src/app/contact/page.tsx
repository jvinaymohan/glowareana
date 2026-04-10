import type { Metadata } from "next";
import { FlowContactBar } from "@/components/FlowContactBar";
import { GoogleMapBlock } from "@/components/GoogleMapBlock";
import { LeadForm } from "@/components/LeadForm";
import { VisitMini } from "@/components/VisitMini";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.name} in Koramangala — phone, WhatsApp, map, and enquiry form.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-white sm:text-4xl">
        Let&apos;s talk
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
        Call, WhatsApp, or email the {site.name} team — we reply fastest on
        WhatsApp during soft opening hours.
      </p>

      <FlowContactBar source="contact_top" className="mt-8" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6">
            <p className="text-sm text-zinc-500">Phone</p>
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="mt-1 block text-xl font-semibold text-white hover:text-[var(--ga-blue)]"
            >
              {site.phone}
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6">
            <p className="text-sm text-zinc-500">WhatsApp</p>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-[#0b0b12] touch-manipulation active:brightness-95"
            >
              Open WhatsApp chat
            </a>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6">
            <p className="text-sm text-zinc-500">Email</p>
            <a
              href={`mailto:${site.email}`}
              className="mt-1 block text-lg text-[var(--ga-blue)] hover:underline"
            >
              {site.email}
            </a>
            <p className="mt-4 text-sm text-zinc-400">{site.address}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              Contact form
            </h2>
            <div className="mt-6">
              <LeadForm context="General contact" />
            </div>
          </div>

          <GoogleMapBlock />
        </div>
        <VisitMini source="contact_sidebar" className="h-fit lg:sticky lg:top-24" />
      </div>
    </div>
  );
}
