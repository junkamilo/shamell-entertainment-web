"use client";

import { useEffect } from "react";
import ContactRequestsPanel from "@/components/admin/ContactRequestsPanel";
import { markPeticionesSeenNow } from "@/lib/peticionesNotifications";

export default function AgendaPeticionesPage() {
  useEffect(() => {
    markPeticionesSeenNow();
  }, []);

  return (
    <ContactRequestsPanel
      heroTitle="Inbox"
      heroSubtitle=""
    />
  );
}
