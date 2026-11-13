import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Hanken_Grotesk } from "next/font/google";
import SiteHeader from "./components/SiteHeader";
import SmoothScroll from "./components/SmoothScroll";
import JsonLd from "./components/JsonLd";
import { pageMetadata, personJsonLd } from "./lib/seo";
import { site } from "./lib/site";
import "./globals.css";

// Hanken Grotesk for headings; Inter carries the body text.
// Only the latin subset: the site text is English, so latin-ext (Turkish ş/ğ/İ etc.) was
// an extra preloaded file per font that nothing used. Add it back if Turkish text is added.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#081f01",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.role}`,
    template: `%s · ${site.name}`,
  },
  ...pageMetadata({ path: "/", description: site.description }),
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  verification: {
    google: "3_xQr1Oew08iykJSsBbFDe7E-xu21xo26o0b8v5WS5E",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${inter.variable} antialiased`}
    >
      <body className="flex min-h-screen min-h-dvh flex-col font-sans">
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
        <div id="content" className="flex flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
