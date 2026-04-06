import Link from "next/link";
import { nav, site } from "@/lib/site";
import { SiteLogo } from "@/components/SiteLogo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--ga-cyan)]/20 bg-black shadow-[0_-12px_48px_rgba(255,45,140,0.06)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div>
          <SiteLogo variant="footer" />
          <p className="ga-tagline-colors mt-3 text-sm font-semibold tracking-wide">
            {site.brandTagline}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {site.tagline} · {site.area}
          </p>
          <p className="mt-4 text-xs text-zinc-500">
            Prototype — copy & pricing are placeholders.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ga-cyan)]">Explore</p>
          <ul className="mt-3 flex flex-col gap-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-zinc-400 transition hover:text-[var(--ga-cyan)] hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.45)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ga-magenta)]">Contact</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-zinc-400">
            <li>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-white">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-white">
                {site.email}
              </a>
            </li>
            <li>{site.address}</li>
          </ul>
          <a
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-full border border-[#25D366]/50 bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#4ade80] shadow-[0_0_16px_rgba(34,197,94,0.25)] hover:bg-[#25D366]/20"
          >
            WhatsApp us
          </a>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
