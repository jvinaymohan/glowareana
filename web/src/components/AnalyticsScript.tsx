import Script from "next/script";

/**
 * Loads gtag when NEXT_PUBLIC_GA_ID is set. Pair with `trackEvent` from `@/lib/analytics`.
 */
export function AnalyticsScript() {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
        strategy="afterInteractive"
      />
      <Script id="ga-glowarena" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(id)}, { send_page_view: true });
        `}
      </Script>
    </>
  );
}
