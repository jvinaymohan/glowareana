"use client";

import type { FaqItem } from "@/lib/faq-content";
import Link from "next/link";

export function BookingFaq({
  items,
  id = "faq",
}: {
  items: FaqItem[];
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white sm:text-2xl">
        Questions parents ask
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        Quick answers — WhatsApp us if yours isn&apos;t listed.
      </p>
      <div className="mt-6 space-y-2">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-white/10 bg-black/20"
          >
            <summary className="cursor-pointer list-none px-4 py-3 pr-10 text-sm font-medium text-zinc-200 marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="relative block">
                {item.q}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 transition group-open:rotate-180">
                  ▼
                </span>
              </span>
            </summary>
            <div className="border-t border-white/5 px-4 py-3 text-sm leading-relaxed text-zinc-400">
              {item.a}
            </div>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-zinc-500">
        Policies:{" "}
        <Link href="/legal/refunds" className="text-[var(--ga-cyan)] hover:underline">
          Refunds
        </Link>
        {" · "}
        <Link href="/legal/safety" className="text-[var(--ga-cyan)] hover:underline">
          Safety
        </Link>
        {" · "}
        <Link href="/legal/terms" className="text-[var(--ga-cyan)] hover:underline">
          Terms
        </Link>
        {" · "}
        <Link href="/legal/privacy" className="text-[var(--ga-cyan)] hover:underline">
          Privacy
        </Link>
      </p>
    </section>
  );
}
