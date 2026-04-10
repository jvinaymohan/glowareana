import Link from "next/link";
import { BookNowLink } from "@/components/BookNowLink";
import { site } from "@/lib/site";

type VisitMiniProps = {
  source: string;
  className?: string;
};

/**
 * Repeat on deep-linked pages: address, Book now, short “how it works”.
 */
export function VisitMini({ source, className = "" }: VisitMiniProps) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[var(--ga-surface)] p-5 sm:p-6 ${className}`}
    >
      <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
        Visit {site.name}
      </h2>
      <p className="mt-2 text-sm text-zinc-400">{site.address}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <BookNowLink
          source={source}
          className="ga-btn-neon inline-flex min-h-[44px] items-center justify-center rounded-full px-5 py-2 text-sm font-semibold touch-manipulation"
        />
        <Link
          href={site.mapsOpenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm text-zinc-300 touch-manipulation hover:bg-white/5"
        >
          Open in Maps
        </Link>
      </div>
      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          How it works
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
          <li>
            <Link href="/book" className="text-[var(--ga-cyan)] hover:underline">
              Book online
            </Link>{" "}
            — pick game, kids, slot (~25–30 min per attraction).
          </li>
          <li>Arrive 10 minutes early for socks, waiver, and briefing.</li>
          <li>Play, collect your reference by SMS/email — rebook anytime.</li>
        </ol>
      </div>
    </section>
  );
}
