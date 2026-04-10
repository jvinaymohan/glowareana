import type { MetadataRoute } from "next";

const PATHS = [
  "",
  "/games",
  "/combos",
  "/birthday",
  "/corporate",
  "/contact",
  "/book",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refunds",
  "/legal/safety",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!raw || !/^https?:\/\//i.test(raw)) {
    return [];
  }

  const now = new Date();
  return PATHS.map((path) => ({
    url: `${raw}${path === "" ? "/" : path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.75,
  }));
}
