import type { Metadata, Viewport } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import { AnalyticsScript } from "@/components/AnalyticsScript";
import { BetaBanner } from "@/components/BetaBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";
import "./globals.css";

const display = Montserrat({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: `${site.name} | ${site.tagline} — ${site.area}`,
    template: `%s | ${site.name}`,
  },
  description:
    "Light Up Your Play — high-energy neon indoor game zone in Koramangala: Floor is Lava, Push Battles, Laser Maze, and more. Book birthdays, corporates, and weekend sessions.",
  keywords: [
    "indoor games Koramangala",
    "birthday party venue Koramangala",
    "kids activity Bangalore",
    "team building Bangalore",
    "Glow Arena",
  ],
  openGraph: {
    title: `${site.name} — ${site.area}`,
    description: site.tagline,
    locale: "en_IN",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${dmSans.variable} h-full scroll-smooth`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <AnalyticsScript />
        <BetaBanner />
        <SiteHeader />
        <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
