import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure payment — Shamell Entertainment",
  robots: { index: false, follow: false },
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-white text-foreground">{children}</div>
  );
}
