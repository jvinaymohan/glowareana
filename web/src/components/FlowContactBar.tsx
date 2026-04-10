"use client";

import { trackEvent } from "@/lib/analytics";
import { site } from "@/lib/site";

type FlowContactBarProps = {
  source: string;
  className?: string;
};

export function FlowContactBar({ source, className = "" }: FlowContactBarProps) {
  const tel = site.phone.replace(/\s/g, "");
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:flex-wrap sm:items-center ${className}`}
    >
      <p className="w-full text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:w-auto sm:flex-1 sm:min-w-[200px]">
        Quick questions before you book?
      </p>
      <a
        href={`https://wa.me/${site.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("whatsapp_click", { source })}
        className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-[#25D366] px-4 py-2.5 text-center text-sm font-semibold text-[#0b0b12] touch-manipulation sm:flex-none sm:min-w-[140px]"
      >
        WhatsApp
      </a>
      <a
        href={`tel:${tel}`}
        onClick={() => trackEvent("call_click", { source })}
        className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white touch-manipulation hover:bg-white/5 sm:flex-none sm:min-w-[120px]"
      >
        Call
      </a>
      <a
        href={`mailto:${site.email}`}
        onClick={() => trackEvent("email_click", { source })}
        className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[var(--ga-cyan)]/40 px-4 py-2.5 text-center text-sm font-semibold text-[var(--ga-cyan)] touch-manipulation hover:bg-[var(--ga-cyan)]/10 sm:flex-none sm:min-w-[120px]"
      >
        Email
      </a>
    </div>
  );
}
