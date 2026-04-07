import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";
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
      <p className="mt-4 text-base leading-relaxed text-zinc-400">
        Reach the arena team — swap in your real number and WhatsApp Business
        link.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
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
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
            Contact form
          </h2>
          <div className="mt-6">
            <LeadForm context="General contact" />
          </div>
        </div>
      </div>

      <div className="mt-12 min-h-[220px] w-full max-w-full overflow-hidden rounded-2xl border border-white/10 aspect-video sm:min-h-0">
        <iframe
          title="Glow Arena map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.84916296526!2d77.44109579999999!3d12.9539594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae145edc12ae15%3A0x5d6fa3f68c672c4e!2sKoramangala%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
          className="h-full min-h-[220px] w-full border-0 sm:min-h-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
