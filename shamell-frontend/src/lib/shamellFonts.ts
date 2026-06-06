import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

/** Self-hosted fonts — no Google Fonts fetch at build time. */
export const geistSans = GeistSans;

export const geistMono = GeistMono;

export const cinzel = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/cinzel/files/cinzel-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/cinzel/files/cinzel-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-cinzel",
  display: "swap",
});

export const greatVibes = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-great-vibes",
  display: "swap",
});

export const cormorant = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const shamellAdminSans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-shamell-admin-sans",
  display: "swap",
});
