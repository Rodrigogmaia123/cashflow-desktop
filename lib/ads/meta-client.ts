"use client";

export type ClientAdsContext = {
  eventId: string;
  fbp: string | null;
  fbc: string | null;
};

function cookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function readClientAdsContext(): ClientAdsContext {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  const fbp = cookie("_fbp");
  let fbc = cookie("_fbc");
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return {
    eventId: crypto.randomUUID(),
    fbp,
    fbc,
  };
}

export function trackMetaBrowserEvent(
  eventName: string,
  eventId: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", eventName, params ?? {}, { eventID: eventId });
}

export function trackMetaCustomBrowserEvent(
  eventName: string,
  eventId: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", eventName, params ?? {}, { eventID: eventId });
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
