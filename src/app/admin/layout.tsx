import type { Metadata } from "next";

// Admin chrome only. Deliberately no auth check here: layouts don't re-run on navigation and don't
// protect their pages, so each page and action calls requireOwner() itself.
export const metadata: Metadata = {
  title: { default: "Yönetim Paneli", template: "%s · Yönetim Paneli" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  // Don't inherit the public site's canonical / Open Graph data
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="tr" className="flex min-h-dvh flex-1 flex-col">
      {children}
    </div>
  );
}
