import type { Metadata, Viewport } from "next";
import { Inter, Hanken_Grotesk } from "next/font/google";
import { site } from "./lib/site";
import "./globals.css";

// Root layout is shared by the public site, the 404 page and /admin, so it only holds the document,
// fonts and site-wide defaults. The public chrome (header, smooth scroll, analytics, JSON-LD) lives in
// (site)/layout.tsx so none of it runs inside the admin panel.

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
      <body className="flex min-h-screen min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
