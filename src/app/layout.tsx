import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Shamell Entertainment — Exclusive Performance Artistry",
  description:
    "Shamell Entertainment SVCS LLC — Luxury Oriental dance performer for private galas, VIP events, and bespoke collaborations.",
  authors: [{ name: "Shamell Entertainment SVCS LLC" }],
  openGraph: {
    title: "Shamell Entertainment — Exclusive Performance Artistry",
    description:
      "Luxury Oriental dance performer for private galas, VIP events, and bespoke collaborations.",
    type: "website",
    url: "https://shamellentertainment.com",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Great+Vibes&family=Montserrat:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
