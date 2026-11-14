"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "../actions";

const links = [
  { href: "/admin", label: "Pano" },
  { href: "/admin/facts", label: "Bilgi Bankası" },
  { href: "/admin/cv", label: "Ana CV" },
];

// Static navigation, no data. Each page still checks the owner itself.
export default function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <header className="border-b border-line print:hidden">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <nav aria-label="Yönetim" className="flex flex-wrap items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                isActive(l.href) ? "bg-ink text-night" : "text-mist hover:bg-raised hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-full border border-line-strong px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-raised"
          >
            Çıkış yap
          </button>
        </form>
      </div>
    </header>
  );
}
