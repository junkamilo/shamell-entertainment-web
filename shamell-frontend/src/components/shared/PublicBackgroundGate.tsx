"use client";

import { usePathname } from "next/navigation";
import { AnimatedBackground } from "@/components/shared/AnimatedBackground";

export default function PublicBackgroundGate() {
  const pathname = usePathname() ?? "/";
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/shamell-admin");
  if (isAdminRoute) return null;
  return <AnimatedBackground />;
}
