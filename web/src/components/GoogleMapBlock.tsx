import Link from "next/link";
import { site } from "@/lib/site";

export function GoogleMapBlock({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--ga-cyan)]/25 bg-zinc-900 aspect-video shadow-[0_0_40px_rgba(0,240,255,0.12)]">
        <iframe
          title={`${site.name} — map`}
          src={site.mapsUrl}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-500">{site.address}</p>
        <Link
          href={site.mapsOpenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--ga-cyan)]/50 px-4 py-2 text-sm font-semibold text-[var(--ga-cyan)] touch-manipulation hover:bg-[var(--ga-cyan)]/10"
        >
          View on Google Maps →
        </Link>
      </div>
    </div>
  );
}
