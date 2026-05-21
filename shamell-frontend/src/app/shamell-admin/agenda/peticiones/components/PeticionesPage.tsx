"use client";

import { useEffect } from "react";
import { markPeticionesSeenNow } from "@/lib/peticionesNotifications";
import PeticionesPageContent from "./PeticionesPageContent";

export default function PeticionesPage() {
  useEffect(() => {
    markPeticionesSeenNow();
  }, []);

  return <PeticionesPageContent />;
}
