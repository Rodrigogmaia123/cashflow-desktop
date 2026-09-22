import localFont from "next/font/local";

export const display = localFont({
  src: [
    { path: "../fonts/space-grotesk-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/space-grotesk-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/space-grotesk-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lp-display",
  display: "swap",
});

export const sans = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lp-sans",
  display: "swap",
});

export const mono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-lp-mono",
  display: "swap",
});
