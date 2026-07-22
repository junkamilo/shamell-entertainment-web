import { redirect } from "next/navigation";
import { onComingEventsSiteAdminHref } from "@/lib/onComingEventsRoutes";

export default function UpcomingEventsAdminRedirectPage() {
  redirect(onComingEventsSiteAdminHref());
}

