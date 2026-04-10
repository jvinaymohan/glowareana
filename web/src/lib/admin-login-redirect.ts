/**
 * Safe redirect targets after admin sign-in. Prevents open redirects.
 */
export function safeAdminNext(raw: string | null | undefined, fallback: string): string {
  if (raw == null || raw === "") return fallback;
  let path = raw.trim();
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const u = new URL(path);
      path = `${u.pathname}${u.search}`;
    }
    if (!path.startsWith("/")) return fallback;
  } catch {
    return fallback;
  }
  if (path.startsWith("//")) return fallback;
  const pathname = path.split("?")[0] ?? path;
  if (pathname.startsWith("/admin/login")) return fallback;
  const allowed =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/platform/admin");
  if (!allowed) return fallback;
  return path;
}

/** After legacy cookie login only — never send user to platform routes. */
export function safeLegacyAdminNext(raw: string | null | undefined, fallback: string): string {
  const n = safeAdminNext(raw, fallback);
  if (n.startsWith("/platform/admin")) return "/admin";
  return n;
}
