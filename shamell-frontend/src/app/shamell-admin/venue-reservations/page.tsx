import { Suspense } from "react";
import { VenueReservationsAdminPage } from "./components/VenueReservationsAdminPage";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-foreground/55">Loading reservations…</p>}>
      <VenueReservationsAdminPage />
    </Suspense>
  );
}
