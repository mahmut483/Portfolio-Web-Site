import type { Metadata } from "next";
import Script from "next/script";
import SiteHeader from "../components/SiteHeader";
import SmoothScroll from "../components/SmoothScroll";
import SectionSpy from "../components/SectionSpy";
import SiteAnalytics from "../components/SiteAnalytics";
import JsonLd from "../components/JsonLd";
import { pageMetadata, personJsonLd } from "../lib/seo";
import { site } from "../lib/site";

// Public site chrome. A route group, so URLs are unchanged; /admin sits outside it and gets none of this.
export const metadata: Metadata = {
  ...pageMetadata({ path: "/", description: site.description }),
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-6H2B921TK8"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-6H2B921TK8');
        `}
      </Script>
      <a
        href="#content"
        className="sr-only z-[60] rounded-full bg-ink px-4 py-2 text-sm font-medium text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <JsonLd data={personJsonLd()} />
      <SiteHeader />
      <SmoothScroll />
      <SectionSpy />
      <SiteAnalytics />
      <div id="content" className="flex flex-1 flex-col">
        {children}
      </div>
    </>
  );
}
