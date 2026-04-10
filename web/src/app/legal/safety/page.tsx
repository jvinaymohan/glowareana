import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Safety guidelines",
  description: `Safety rules and supervision at ${site.name}.`,
  robots: { index: true, follow: true },
};

export default function SafetyLegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="text-[var(--ga-cyan)] hover:underline">
          Home
        </Link>
        {" / "}
        <span className="text-zinc-400">Safety</span>
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Safety guidelines
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-zinc-400">
        Everyone plays their best when rules are clear. Parents and guardians are
        responsible for supervising children in common areas; arena staff lead
        in-game safety briefings and equipment checks.
      </p>
      <ul className="mt-8 list-disc space-y-3 pl-5 text-sm text-zinc-300">
        <li>Closed-toe shoes; non-slip socks where posted; no loose jewellery.</li>
        <li>Climbing: harness checks every session; follow auto-belay rules only.</li>
        <li>Laser maze: no running; follow staff signals.</li>
        <li>
          Medical: children with heart conditions, severe asthma, pregnancy, or
          recent surgery should not participate in high-intensity attractions without
          doctor clearance.
        </li>
        <li>First aid is available on site; emergencies — we coordinate with local services.</li>
        <li>Waiver acceptance is required before play; copies available at reception.</li>
      </ul>
      <p className="mt-8 text-sm text-zinc-500">
        Questions?{" "}
        <Link href="/contact" className="text-[var(--ga-cyan)] hover:underline">
          Contact
        </Link>
        .
      </p>
    </div>
  );
}
