"use client";

import { EmptyState } from "@/components/admin/data-display";
import { CalendarDays } from "lucide-react";
import { BOOK_CLASS_SETUP_PATH } from "../lib/bookClassRoutes";

export function BookClassEmptyState() {
  return (
    <div className="shamell-glass-surface rounded-2xl p-4 sm:p-5 md:p-8">
      <EmptyState
        icon={CalendarDays}
        title="No bookable class schedule yet"
        description={
          <>
            <p>
              To reserve a class from Book Class, create an upcoming event using{" "}
              <strong>Recurring Weekdays (Classes)</strong>: pick active weekdays,
              add at least one class section (start/end time, capacity), save the
              event, and regenerate sessions.
            </p>
            <p className="mt-3 text-sm text-foreground/45">
              On Coming Events → Upcoming events → New upcoming event → Recurring
              Weekdays (Classes)
            </p>
          </>
        }
        action={{
          label: "Create Recurring Weekdays (Classes)",
          href: BOOK_CLASS_SETUP_PATH,
        }}
      />
    </div>
  );
}
