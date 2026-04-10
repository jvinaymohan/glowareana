/**
 * Fires gtag when `NEXT_PUBLIC_GA_ID` is set and gtag is loaded (see root layout).
 * Safe to call from client components only.
 */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  const gtag = (
    window as unknown as {
      gtag?: (cmd: string, target: string, config?: object) => void;
    }
  ).gtag;
  if (typeof gtag === "function") {
    gtag("event", name, params ?? {});
  }
}
