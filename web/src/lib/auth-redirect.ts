/** Safe in-app path only — avoids open redirects. */
export function safeAuthRedirectNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}
