import Link from "next/link";
import { BookNowLink } from "@/components/BookNowLink";
import { nav, site } from "@/lib/site";
import { SiteLogo, SiteLogoLockup } from "@/components/SiteLogo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--ga-cyan)]/20 bg-black pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-12px_48px_rgba(255,45,140,0.06)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-12 lg:grid-cols-4">
        <div>
          <SiteLogoLockup className="inline-block">
            <SiteLogo variant="footer" />
          </SiteLogoLockup>
          <p className="ga-tagline-colors mt-4 text-sm font-semibold tracking-wide">
            {site.brandTagline}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {site.tagline} · {site.area}
          </p>
          <BookNowLink
            source="footer"
            className="ga-btn-neon mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold touch-manipulation"
          />
          <p className="mt-4 text-xs text-zinc-500">
            Soft opening — hours and slots may adjust. Call or WhatsApp before you
            travel if you&apos;re unsure.
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
          <p className="text-sm font-semibold text-zinc-300">Policies</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <Link
                href="/legal/terms"
                className="text-zinc-400 transition hover:text-[var(--ga-cyan)]"
              >
                Terms of use
              </Link>
            </li>
            <li>
              <Link
                href="/legal/privacy"
                className="text-zinc-400 transition hover:text-[var(--ga-cyan)]"
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/legal/refunds"
                className="text-zinc-400 transition hover:text-[var(--ga-cyan)]"
              >
                Refunds & cancellations
              </Link>
            </li>
            <li>
              <Link
                href="/legal/safety"
                className="text-zinc-400 transition hover:text-[var(--ga-cyan)]"
              >
                Safety guidelines
              </Link>
            </li>
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
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#25D366]/50 bg-[#25D366]/10 px-5 py-2.5 text-sm font-medium text-[#4ade80] shadow-[0_0_16px_rgba(34,197,94,0.25)] touch-manipulation hover:bg-[#25D366]/20"
          >
            WhatsApp us
          </a>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {site.name}. Soft opening period.
      </div>
    </footer>
  );
}
