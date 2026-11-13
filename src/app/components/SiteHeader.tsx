"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { work } from "../lib/site";

const nav = [
  { href: "/", label: "Works" },
  { href: "/cv", label: "CV" },
  { href: "/contact", label: "Contact" },
];

function activeIndex(pathname: string) {
  if (pathname.startsWith("/cv")) return 1;
  if (pathname.startsWith("/contact")) return 2;
  if (pathname === "/" || work.some((w) => pathname.startsWith(`/${w.slug}`))) return 0;
  return -1;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const index = activeIndex(pathname);
  const [visible, setVisible] = useState(true);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setVisible(true);
  }

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;

      // Sayfanın en üstündeyken her zaman göster
      if (currentScrollY < 60) {
        setVisible(true);
      } else if (diff > 6) {
        // Aşağı kaydırırken yukarı kayarak gizle
        setVisible(false);
      } else if (diff < -6) {
        // Yukarı kaydırırken aşağı kayarak geri gel
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      // Keyboard focus on a hidden link would be invisible, so bring the bar back
      onFocus={() => setVisible(true)}
      className="pointer-events-none fixed top-4 z-50 inset-x-0 flex justify-center px-4 sm:top-6"
      style={{
        transform: visible ? "translate3d(0, 0, 0)" : "translate3d(0, -120px, 0)",
        opacity: visible ? 1 : 0,
        transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease",
      }}
    >
      <nav
        aria-label="Main"
        className={`relative isolate flex items-center rounded-full border border-white/[0.08] bg-[#0c1e05]/85 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl ring-1 ring-white/[0.05] ${
          visible ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Lüks aktif kapsül (yalnızca bu eleman kayar) */}
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-1.5 w-20 rounded-full bg-gradient-to-b from-white via-[#f4f7f0] to-[#e5eae0] shadow-[0_2px_12px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[transform,opacity] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none sm:w-24"
          style={{
            transform: `translate3d(${Math.max(index, 0) * 100}%, 0, 0)`,
            willChange: "transform",
            opacity: index < 0 ? 0 : 1,
          }}
        />

        {nav.map((item, i) => {
          const active = i === index;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative z-10 flex h-11 w-20 shrink-0 items-center justify-center rounded-full text-[0.85rem] font-semibold tracking-[-0.01em] transition-colors duration-200 select-none sm:h-10 sm:w-24 sm:text-sm ${
                active
                  ? "text-[#081f01]"
                  : "text-[#8fa688] hover:text-[#eef1f6]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
