// Custom GA4 events. The gtag snippet in (site)/layout.tsx defines window.gtag;
// before it loads (or with an ad blocker) events are silently dropped.
// Never put personal data (the email or phone values) into params: GA forbids it.

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event", name: string, params?: Params) => void;
  }
}

export function track(name: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  // beacon transport survives the page closing (watch time sent on pagehide)
  window.gtag?.("event", name, { ...params, transport_type: "beacon" });
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", name, params);
}
