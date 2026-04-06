import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} | ${site.tagline} — ${site.area}`,
    template: `%s | ${site.name}`,
  },
  description:
    "High-energy indoor game zone in Koramangala: Floor is Lava, Push Battles, Laser Maze, and more. Book birthdays, corporates, and weekend sessions.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
