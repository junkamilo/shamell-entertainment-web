"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppStatusScreen } from "@/components/shared/AppStatusScreen";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        pathname,
      );
    }
  }, [pathname]);

  return (
    <AppStatusScreen
      title="Page not found"
      message="This page does not exist or was moved."
    />
  );
}
