"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "../lib/analytics";

// Site-wide analytics that need no per-component code:
// - ui_click: every link/button click with a readable label (cards, nav, Source Code, Play Fullscreen…).
//   Elements with data-track="skip" send their own, more specific event instead.
// - section_time: seconds each [data-section][id] block was the one in view, with the tab visible.

function labelOf(el: HTMLElement) {
  const raw =
    el.dataset.track ||
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    el.textContent ||
    "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 80);
}

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("a, button");
      if (!el || el.dataset.track === "skip") return;
      const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? undefined : undefined;
      track("ui_click", {
        label: labelOf(el),
        element: el.tagName.toLowerCase(),
        link_url: href,
        in_header: Boolean(el.closest("header")),
      });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  useEffect(() => {
    // Recently visited pages stay mounted but hidden; only visible sections count
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section][id]")).filter(
      (s) => s.getClientRects().length > 0,
    );
    if (sections.length === 0) return;

    // Visible height in px per section: the one filling most of the screen is "current"
    const visible = new Map<string, number>();
    let current: string | null = null;
    let since = 0;

    const stop = () => {
      if (current && since) {
        const seconds = Math.round((Date.now() - since) / 1000);
        if (seconds >= 2) track("section_time", { section: current, page_path: pathname, seconds });
      }
      since = 0;
    };
    const pick = () => {
      let best: string | null = null;
      let bestHeight = window.innerHeight * 0.3; // must fill at least 30% of the screen
      for (const [id, height] of visible) {
        if (height > bestHeight) {
          best = id;
          bestHeight = height;
        }
      }
      if (best !== current) {
        stop();
        current = best;
        if (current && !document.hidden) since = Date.now();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.intersectionRect.height);
        pick();
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    sections.forEach((s) => observer.observe(s));

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (current) since = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [pathname]);

  return null;
}
