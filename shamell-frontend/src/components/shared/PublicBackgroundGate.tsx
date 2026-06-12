"use client";

import { usePathname } from "next/navigation";
import { AnimatedBackground } from "@/components/shared/AnimatedBackground";
import { isPaymentFlowRoute } from "@/lib/paymentFlowRoutes";

export default function PublicBackgroundGate() {
  const pathname = usePathname() ?? "/";
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/shamell-admin");
  if (isAdminRoute || isPaymentFlowRoute(pathname)) return null;
  return <AnimatedBackground />;
}
