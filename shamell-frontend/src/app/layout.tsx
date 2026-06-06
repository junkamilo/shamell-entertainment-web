import type { Metadata, Viewport } from "next";
import {
  cinzel,
  cormorant,
  geistMono,
  geistSans,
  greatVibes,
} from "@/lib/shamellFonts";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import PublicBackgroundGate from "@/components/shared/PublicBackgroundGate";
import WhatsAppFloatingButton from "@/components/shared/WhatsAppFloatingButton";

export const metadata: Metadata = {
  title: "Shamell Entertainment — Performance & Events",
  description:
    "Exclusive performance artistry for private events, galas, and bespoke productions. Explore services, gallery, and inquire.",
  icons: {
    icon: [{ url: "/01_bailarina.png", type: "image/png" }],
    shortcut: "/01_bailarina.png",
    apple: "/01_bailarina.png",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${greatVibes.variable} ${cormorant.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <PublicBackgroundGate />
        {children}
        <WhatsAppFloatingButton />
        <Toaster />
      </body>
    </html>
  );
}
