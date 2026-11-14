"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Shareable section links (e.g. /development#brew-games-case):
// - while scrolling, the address bar follows the section in view (replaceState: no history entries)
// - near the top of the page the hash is removed
// - a reload always starts at the top with a clean URL; a link opened from elsewhere still jumps to its section
// Sections opt in with id="..." and data-section.

const TOP_OFFSET = 140; // past this much scroll, a section can become "current"

function setHash(hash: string) {
  const url = window.location.pathname + window.location.search + hash;
  if (url !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, "", url);
  }
}

export default function SectionSpy() {
  const pathname = usePathname();

  // Reload: always start at the top, without a hash (runs once per page load)
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload") {
      window.history.scrollRestoration = "manual";
      if (window.location.hash) setHash("");
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    let current = window.location.hash;
    // Arrived through a shared link: keep that hash until the visitor scrolls or interacts themselves
    let armed = !window.location.hash;

    const update = () => {
      frame = 0;
      if (!armed) return;
      // Next keeps recently visited pages mounted but hidden (<Activity>); their sections have no
      // layout boxes and must not count, or another page's hash shows up here.
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section][id]")).filter(
        (s) => s.getClientRects().length > 0,
      );
      if (!sections.length) return;

      let active = "";
      const atBottom =
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        // A short page may never scroll its last section up to the line
        active = `#${sections[sections.length - 1].id}`;
      } else if (window.scrollY > TOP_OFFSET) {
        const line = window.innerHeight * 0.35; // a section is current once its top passes this line
        for (const s of sections) {
          if (s.getBoundingClientRect().top <= line) active = `#${s.id}`;
        }
      }
      if (active !== current) {
        current = active;
        setHash(active);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const arm = () => {
      armed = true;
    };
    const userEvents = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    userEvents.forEach((e) => window.addEventListener(e, arm, { passive: true, once: true }));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      userEvents.forEach((e) => window.removeEventListener(e, arm));
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
